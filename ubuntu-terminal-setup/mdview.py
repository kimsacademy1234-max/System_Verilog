#!/usr/bin/env python3
"""Markdown 을 VS Code 미리보기처럼 보여주기 (bash 의 md 명령, vim 의 :MdLive 가 사용).

사용:
  python3 mdview.py <입력.md> <출력.html>             → HTML 한 파일로 변환 (md 명령)
  python3 mdview.py serve <실시간.md> <원본폴더> <제목>  → 실시간 미리보기 서버 + 브라우저 열기 (:MdLive)
     - vim 이 입력할 때마다 <실시간.md> 에 버퍼 내용을, <실시간.md>.pos 에 커서 줄을 씀
     - 서버가 바뀐 내용을 브라우저로 바로 보냄 (SSE) → 저장(:w) 안 해도 미리보기가 바뀜
 - ~/.mdview/assets/ 의 marked(마크다운 해석), github-markdown-css, highlight.js 를
   HTML 안에 그대로 넣음 → 인터넷 없이 열림
 - 밝은/어두운 색은 Windows 설정을 따라감
"""
import json, os, sys, html, time, subprocess
from urllib.parse import quote, unquote, urlparse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

ASSETS = os.path.expanduser('~/.mdview/assets')


def asset(name):
    with open(os.path.join(ASSETS, name), encoding='utf-8') as f:
        return f.read()


def folder_url(path):
    """리눅스 경로의 폴더 → 브라우저용 file:// 주소 (/mnt/c/... → file:///C:/...)"""
    d = os.path.dirname(os.path.abspath(path))
    parts = d.split('/')
    if len(parts) >= 3 and parts[1] == 'mnt' and len(parts[2]) == 1:
        return 'file:///' + parts[2].upper() + ':/' + quote('/'.join(parts[3:])) + '/'
    distro = os.environ.get('WSL_DISTRO_NAME', 'Ubuntu')
    return 'file://wsl.localhost/' + quote(distro) + quote(d) + '/'


def page(title, text=None, base=None):
    """text 가 있으면 그 내용을 넣은 HTML, None 이면 /events 로 실시간 내용을 받는 HTML"""
    # </script> 가 본문에 있어도 깨지지 않게
    data = 'null' if text is None else json.dumps(text, ensure_ascii=False).replace('</', '<\\/')
    base_tag = f'<base href="{base}">' if base else ''
    return f'''<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
{base_tag}
<style>{asset('github-markdown.css')}</style>
<style media="(prefers-color-scheme: light)">{asset('hl-light.css')}</style>
<style media="(prefers-color-scheme: dark)">{asset('hl-dark.css')}</style>
<style>
  body {{ margin: 0; background: #ffffff; }}
  @media (prefers-color-scheme: dark) {{ body {{ background: #0d1117; }} }}
  .markdown-body {{ box-sizing: border-box; max-width: 980px; margin: 0 auto; padding: 32px 45px 50vh; }}
  @media (max-width: 767px) {{ .markdown-body {{ padding: 16px 16px 50vh; }} }}
  .markdown-body pre code.hljs {{ padding: 0; background: transparent; }}
</style>
</head><body>
<article class="markdown-body" id="c"></article>
<script>{asset('marked.min.js')}</script>
<script>{asset('highlight.min.js')}</script>
<script>{asset('verilog.min.js')}</script>
<script>
  var c = document.getElementById('c'), TITLE = document.title;
  // 블록마다 md 몇 번째 줄에서 시작했는지 data-line 으로 기록 (vim 커서 위치로 스크롤할 때 사용)
  function render(text) {{
    var tokens = marked.lexer(text), out = '', line = 0;
    tokens.forEach(function (t) {{
      var one = [t]; one.links = tokens.links;
      var h = marked.parser(one).trim();
      if (h) out += h.replace(/^<([a-zA-Z0-9]+)/, '<$1 data-line="' + line + '"');
      line += (t.raw.match(/\\n/g) || []).length;
    }});
    c.innerHTML = out;
    c.querySelectorAll('pre code').forEach(function (el) {{
      var m = (el.className.match(/language-(\\S+)/) || [])[1];
      if (m === 'v' || m === 'sv' || m === 'systemverilog') el.className = 'language-verilog';
      hljs.highlightElement(el);
    }});
  }}
  // vim 커서 줄(0부터)이 화면 위쪽 1/3 쯤 오도록 스크롤 (블록 안에서는 줄 비율로 보간)
  function scrollToLine(n) {{
    var els = c.querySelectorAll('[data-line]'), cur = null, next = null;
    for (var i = 0; i < els.length; i++) {{
      if (+els[i].dataset.line <= n) cur = els[i]; else {{ next = els[i]; break; }}
    }}
    if (!cur) {{ window.scrollTo(0, 0); return; }}
    var top = cur.getBoundingClientRect().top + window.scrollY;
    var a = +cur.dataset.line, b = next ? +next.dataset.line : a + 1;
    var y = top + cur.offsetHeight * Math.min(1, (n - a) / Math.max(1, b - a));
    window.scrollTo(0, y - window.innerHeight / 3);
  }}
  var DATA = {data};
  if (DATA !== null) {{
    render(DATA);
  }} else {{
    var es = new EventSource('/events');
    es.onmessage = function (e) {{
      var d = JSON.parse(e.data);
      document.title = TITLE;
      if (d.text !== null) render(d.text);
      if (d.line !== null) scrollToLine(d.line);
    }};
    es.onerror = function () {{ document.title = '(연결 끊김) ' + TITLE; }};
  }}
</script>
</body></html>
'''


def read(path, default=''):
    try:
        with open(path, encoding='utf-8', errors='replace') as f:
            return f.read()
    except OSError:
        return default


def mtime(path):
    try:
        return os.stat(path).st_mtime_ns
    except OSError:
        return 0


def serve(live, srcdir, title):
    pos = live + '.pos'
    srcdir = os.path.realpath(srcdir)

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def send(self, code, body, ctype):
            self.send_response(code)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path = unquote(urlparse(self.path).path)
            if path == '/':
                return self.send(200, page(title).encode(), 'text/html; charset=utf-8')
            if path == '/events':
                return self.events()
            # md 안의 상대 경로 그림 등: 원본 md 폴더 아래 파일만 보냄
            f = os.path.realpath(os.path.join(srcdir, path.lstrip('/')))
            if f.startswith(srcdir + os.sep) and os.path.isfile(f):
                ctype = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
                         '.svg': 'image/svg+xml', '.webp': 'image/webp'}.get(os.path.splitext(f)[1].lower(),
                                                                            'application/octet-stream')
                with open(f, 'rb') as fh:
                    return self.send(200, fh.read(), ctype)
            self.send(404, b'not found', 'text/plain')

        def events(self):
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            seen_t = seen_p = -1
            try:
                while True:
                    mt, mp = mtime(live), mtime(pos)
                    if mt != seen_t or mp != seen_p:
                        text = read(live) if mt != seen_t else None
                        line = read(pos, '0').strip()
                        msg = {'text': text, 'line': int(line) if line.isdigit() else None}
                        self.wfile.write(b'data: ' + json.dumps(msg, ensure_ascii=False).encode() + b'\n\n')
                        self.wfile.flush()
                        seen_t, seen_p = mt, mp
                    time.sleep(0.1)
            except (BrokenPipeError, ConnectionResetError):
                pass

    srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    srv.daemon_threads = True
    url = f'http://localhost:{srv.server_address[1]}/'
    print(url, flush=True)
    subprocess.Popen(['cmd.exe', '/c', 'start', '', url], cwd='/mnt/c',
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    srv.serve_forever()


def main():
    if sys.argv[1] == 'serve':
        return serve(sys.argv[2], sys.argv[3], sys.argv[4])
    src, out = sys.argv[1], sys.argv[2]
    text = read(src)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(page(os.path.basename(src), text, folder_url(src)))


if __name__ == '__main__':
    main()
