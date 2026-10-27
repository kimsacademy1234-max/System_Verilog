"""annotate_fifo_hw.py — mark event order on the FIFO homework captures (S1 ~ S5) + page/contents fix.

usage: python3 annotate_fifo_hw.py <unpacked_pptx_dir>
Time -> x mapping per capture comes from the time axis / clock edges of each PNG.
Helpers (sp, vline, badge, Map ...) are reused from 02_UART_FIFO/_build/annotate_captures.py.
"""
import sys, os, re
from xml.dom import minidom

HELP = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../02_UART_FIFO/_build/annotate_captures.py')
src = open(HELP, encoding='utf-8').read()
exec(src[:src.index('# ---------------------------------------------------------------- slide 12')])
ROOT = sys.argv[1]
TOTAL = 21


def load(n):
    p = os.path.join(ROOT, f'ppt/slides/slide{n}.xml')
    return p, minidom.parse(p)


def shapes(doc):
    tree = doc.getElementsByTagName('p:spTree')[0]
    return tree, [c for c in tree.childNodes if c.nodeType == 1 and c.tagName in ('p:sp', 'p:pic', 'p:grpSp', 'p:cxnSp', 'p:graphicFrame')]


def text(el):
    return ''.join(t.firstChild.data if t.firstChild else '' for t in el.getElementsByTagName('a:t'))


def drop_placeholders(doc):
    tree, kids = shapes(doc)
    rm = []
    for i, el in enumerate(kids):
        if el.tagName == 'p:sp' and text(el).strip() == '파형 캡처 영역':
            rm += [el, kids[i + 1], kids[i + 2]]
            if 'FFF7ED' in kids[i - 1].toxml():
                rm.append(kids[i - 1])
    for r in rm:
        if r.parentNode is not None:
            tree.removeChild(r)


def set_text(el, new, sz, bold=True, color=INK):
    tb = el.getElementsByTagName('p:txBody')[0]
    frag = minidom.parseString('<r xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
                               'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
                               + txbody(new, sz, bold, color, 'l', '맑은 고딕') + '</r>')
    new_tb = el.ownerDocument.importNode(frag.documentElement.firstChild, True)
    el.replaceChild(new_tb, tb)


def retitle(doc, title, l1, l2):
    _, kids = shapes(doc)
    for el in kids:
        t = text(el)
        if el.tagName != 'p:sp':
            continue
        off = el.getElementsByTagName('a:off')
        if not off:
            continue
        y = int(off[0].getAttribute('y')) / E
        if 40 <= y <= 50 and t.strip():
            set_text(el, title, 2400)
        elif 98 <= y <= 103 and t.startswith('·'):
            set_text(el, '·  ' + l1, 1500)
        elif 125 <= y <= 130 and t.startswith('·'):
            set_text(el, '·  ' + l2, 1500)


def place_pic(doc, m, which=-1):
    tree, kids = shapes(doc)
    pic = [k for k in kids if k.tagName == 'p:pic'][which]
    bf = pic.getElementsByTagName('p:blipFill')[0]
    for old in bf.getElementsByTagName('a:srcRect'):
        bf.removeChild(old)
    sr = doc.createElement('a:srcRect')
    for k, v in zip('ltrb', (m.l / m.iw, m.t / m.ih, m.r / m.iw, m.b / m.ih)):
        if v:
            sr.setAttribute(k, str(int(round(v * 100000))))
    bf.insertBefore(sr, bf.getElementsByTagName('a:stretch')[0])
    xf = pic.getElementsByTagName('a:xfrm')[0]
    off = xf.getElementsByTagName('a:off')[0]; ext = xf.getElementsByTagName('a:ext')[0]
    off.setAttribute('x', emu(m.X)); off.setAttribute('y', emu(m.Y))
    ext.setAttribute('cx', emu(m.W)); ext.setAttribute('cy', emu(m.H))


def append(doc, xml):
    tree, _ = shapes(doc)
    frag = minidom.parseString('<r xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
                               'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' + xml + '</r>')
    for c in list(frag.documentElement.childNodes):
        tree.appendChild(doc.importNode(c, True))


def save(p, doc):
    open(p, 'wb').write(doc.toxml(encoding='UTF-8'))


def legend(x, y, w, rows, h=40, gap=48, sz=1150):
    out = ''
    for i, (n_, b_) in enumerate(rows):
        if n_:
            out += legend_row(x, y + i * gap, w, n_, '', b_, h=h, sz=sz)
        else:
            out += sp('rect', x + 30, y + i * gap, w - 30, h, text=b_, sz=sz, bold=False, align='l', font='맑은 고딕', color=SUB)
    return out


def names(m, ys, x2=200):
    return ''.join(m.box(40, y - 11, x2, y + 11, GRN, 1.5) for y in ys)


def slide(n, iw, ih, crop, tx, rows_y, events, boxes, name_rows, leg, retitle_args=None, H=506):
    p, doc = load(n)
    drop_placeholders(doc)
    if retitle_args:
        retitle(doc, *retitle_args)
    W = H * (iw - crop[0] - crop[2]) / (ih - crop[1] - crop[3])
    m = Map(40, 168, W, iw, ih, crop)
    place_pic(doc, m)
    s = ''
    top, bot = rows_y
    for k, (t, lab, col) in enumerate(events):
        x = m.x(tx(t))
        s += vline(x, m.y(top), m.y(bot), col, 1.25)
        if lab:
            s += badge(x, m.y(top) - 2, lab, d=20, sz=950)
    for (t1, t2, y1, y2) in boxes:
        s += m.box(tx(t1), y1, tx(t2), y2)
    s += names(m, name_rows)
    lx = 40 + W + 14
    s += legend(lx, 176, 860 - lx, leg)
    append(doc, s)
    save(p, doc)


# ---------------------------------------------------------------- S1 (slide 12, image1 1026 x 894) : x = 353 + (t - 5) * 8
slide(12, 1026, 894, (0, 0, 0, 0), lambda t: 353 + (t - 5) * 8, (34, 884),
      [(20, '1', RED), (30, '2', YEL)],
      [(28, 32, 236, 258), (28, 32, 261, 283), (28, 32, 311, 333), (28, 32, 336, 358)],
      [72, 247, 272, 322, 347],
      [('1', '20 ns i_reset 1 → 0'), ('2', '30 ns negedge 판정'), ('', 'full 0 · empty 1'), ('', 'wptr 0 · rptr 0 → PASS')])

# ---------------------------------------------------------------- S2 (slide 13, image2 1016 x 937) : x = 322 + (t - 30) * 11.04
slide(13, 1016, 937, (0, 0, 0, 0), lambda t: 322 + (t - 30) * 11.04, (75, 925),
      [(45, '1', YEL), (55, '2', YEL), (65, '3', YEL), (75, '4', RED), (85, '5', YEL)],
      [(45, 85, 352, 374), (75, 90, 277, 299), (75, 90, 477, 499), (80, 90, 602, 624)],
      [163, 288, 363, 488, 613],
      [('1', '45 ns 0a → wptr 1'), ('2', '55 ns 0b → wptr 2'), ('3', '65 ns 0c → wptr 3'),
       ('4', '75 ns 0d → wptr 0, full 1'), ('5', '85 ns 0e → we 0, 무시')],
      ('S2 Push × 5: 4번째 Push 후 Full, 5번째는 무시',
       '0a ~ 0d push → posedge마다 wptr 0 → 1 → 2 → 3 → 0, 4번째 뒤 (75 ns) full 1',
       'full 중 0e push → we = 0 → wptr · register_file 그대로 (모델에도 기록 안 함)'))

# ---------------------------------------------------------------- S3 (slide 14, image3 1185 x 950, white right part cropped) : x = 346 + (t - 80) * 7.96
slide(14, 1185, 950, (0, 0, 155, 0), lambda t: 346 + (t - 80) * 7.96, (78, 930),
      [(100, '1', YEL), (110, '2', YEL), (120, '3', YEL), (130, '4', YEL), (135, '5', RED), (140, '6', YEL)],
      [(98, 102, 255, 277), (108, 112, 255, 277), (118, 122, 255, 277), (128, 132, 255, 277), (135, 150, 305, 327), (140, 150, 380, 402)],
      [216, 266, 316, 391, 916],
      [('1', '100 ns pop_data 0a 판정'), ('2', '110 ns 0b 판정'), ('3', '120 ns 0c 판정'),
       ('4', '130 ns 0d 판정'), ('5', '135 ns empty 1'), ('6', '140 ns pop → 무시')])

# ---------------------------------------------------------------- S4 (slide 15, image4 1012 x 942) : x = 392 + (t - 160) * 7.95
slide(15, 1012, 942, (0, 0, 0, 0), lambda t: 392 + (t - 160) * 7.95, (78, 930),
      [(165, '1', RED), (170, '2', YEL), (180, '', YEL), (190, '', YEL), (200, '', YEL), (215, '3', RED)],
      [(160, 170, 357, 379), (160, 170, 382, 404), (170, 205, 257, 279), (210, 220, 307, 329)],
      [167, 217, 267, 317, 367, 392],
      [('1', '165 ns push만: wptr +1, empty 0'), ('2', '170 ~ 200 ns 0f 0e 0d 0c 판정'), ('', 'wptr · rptr 같이 +1 (개수 1)'),
       ('3', '215 ns pop → empty 1')])

# ---------------------------------------------------------------- S5-A (slide 16, image5 1008 x 936) : x = 432 + (t - 480) * 8.25
slide(16, 1008, 936, (0, 0, 0, 0), lambda t: 432 + (t - 480) * 8.25, (70, 925),
      [(505, '1', YEL), (510, '2', YEL), (515, '3', RED), (525, '4', YEL)],
      [(505, 515, 273, 295), (505, 515, 473, 495), (510, 520, 373, 395), (505, 525, 623, 645)],
      [159, 209, 259, 284, 359, 384, 484, 634],
      [('1', '505 ns 5b push → full 1'), ('2', '510 ns push+pop (d0) · 7e 판정'),
       ('3', '515 ns rptr만 +1, full 0 · we 0 → d0 버림'), ('4', '525 ns push+pop 96 → 둘 다 +1')],
      ('S5-A Random: Full 중 Push+Pop은 Pop만 (Spec)',
       '505 ns full 1 → 510 ns push+pop (d0) → rptr만 +1, full 0 · we 0이라 d0 저장 안 함',
       'pop_data 7e 판정 PASS · 모델도 d0 기록 안 함 → 이후 순서 일치 (random **113 / 113**)'))

# ---------------------------------------------------------------- S5-B (slide 17, image6 1011 x 893) : x = 643 + (t - 1405) * 5
slide(17, 1011, 893, (0, 0, 0, 0), lambda t: 643 + (t - 1405) * 5, (25, 880),
      [(1405, '1', RED), (1410, '2', YEL), (1420, '', YEL), (1445, '3', RED)],
      [(1405, 1445, 254, 276), (1410, 1430, 329, 351), (1440, 1450, 304, 326), (1440, 1450, 204, 226)],
      [165, 215, 265, 315, 340],
      [('1', '1405 ns pop → empty 1'), ('2', '1410 · 1420 ns pop → 무시 (rptr 3)'),
       ('3', '1445 ns push+pop (4b) → push만'), ('', 'wptr 3 → 0 · empty 0 · pop_data 4b')],
      ('S5-B Random: Empty 중 Pop 무시, Push+Pop은 Push만',
       '1405 ns empty 1 → 1410 · 1420 ns pop 무시 (rptr 3 유지)',
       '1440 ns push+pop (4b) → wptr만 +1, empty 0 → 다음 clk부터 pop_data 4b'))

# ---------------------------------------------------------------- TB log (slide 21) : drop placeholder, enlarge log
p, doc = load(21)
drop_placeholders(doc)
m = Map(340, 230, 600, 253, 81, (0, 0, 0, 0))
place_pic(doc, m)
save(p, doc)

# ---------------------------------------------------------------- page numbers + contents ranges
for n in range(1, TOTAL + 1):
    p = os.path.join(ROOT, f'ppt/slides/slide{n}.xml')
    x = open(p, encoding='utf-8').read()
    x = re.sub(r'<a:t>\d+ / 20</a:t>', f'<a:t>{n} / {TOTAL}</a:t>', x)
    if n == 2:
        for a, b in (('p. 20', 'p. 21'), ('p. 18', 'p. 19'), ('p. 17', 'p. 18'), ('p. 10 – 16', 'p. 10 – 17')):
            x = x.replace(f'<a:t>{a}</a:t>', f'<a:t>{b}</a:t>')
    if n == 15:
        x = x.replace('<a:t>empty 1 (215 ns)</a:t>', '<a:t>→ empty 1</a:t>')
    open(p, 'w', encoding='utf-8').write(x)
print('done')
