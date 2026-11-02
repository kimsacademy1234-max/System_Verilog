"""annotate_s5.py — S5 START glitch capture (slide 19): layout + event marks. Reuses helpers of annotate_captures.py"""
import sys, os
from xml.dom import minidom
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'annotate_captures.py'), encoding='utf-8').read()
exec(src[:src.index('# ---------------------------------------------------------------- slide 12')])  # helpers only
ROOT = sys.argv[1]

path = os.path.join(ROOT, 'ppt/slides/slide19.xml')
doc = minidom.parse(path)
tree = doc.getElementsByTagName('p:spTree')[0]
kids = [c for c in tree.childNodes if c.nodeType == 1 and c.tagName in ('p:sp', 'p:pic', 'p:grpSp', 'p:cxnSp', 'p:graphicFrame')]
def text(el): return ''.join(t.firstChild.data if t.firstChild else '' for t in el.getElementsByTagName('a:t'))
# drop the two explanation cards (glitch 입력 / 판정) : replaced by the numbered legend
for el in list(kids):
    if el.tagName != 'p:sp': continue
    x = el.getElementsByTagName('a:off')
    if not x: continue
    oy = int(x[0].getAttribute('y')) / E
    if 435 <= oy <= 630 and int(x[0].getAttribute('x')) / E < 100:
        tree.removeChild(el)
pics = [c for c in tree.childNodes if c.nodeType == 1 and c.tagName == 'p:pic']
def place(pic, X, Y, W, H):
    xf = pic.getElementsByTagName('a:xfrm')[0]
    off = xf.getElementsByTagName('a:off')[0]; ext = xf.getElementsByTagName('a:ext')[0]
    off.setAttribute('x', emu(X)); off.setAttribute('y', emu(Y)); ext.setAttribute('cx', emu(W)); ext.setAttribute('cy', emu(H))
    for sr in pic.getElementsByTagName('a:srcRect'): sr.parentNode.removeChild(sr)
def rid(pic): return pic.getElementsByTagName('a:blip')[0].getAttribute('r:embed')
rels = open(os.path.join(ROOT, 'ppt/slides/_rels/slide19.xml.rels'), encoding='utf-8').read()
def target(r):
    import re
    return re.search(r'Id="%s"[^>]*Target="([^"]+)"' % r, rels).group(1)
wave = [p for p in pics if target(rid(p)).endswith('image8.png')][0]
log = [p for p in pics if target(rid(p)).endswith('image7.png')][0]
m = Map(670, 168, 506 * 1030 / 915, 1030, 915, (0, 0, 0, 0))
place(wave, m.X, m.Y, m.W, m.H)
place(log, 40, 560, 248, 248 * 225 / 453)

s = ''
s += m.box(338, 30, 1030, 54)            # 1 rx glitches
s += m.box(338, 80, 1030, 103)           # 2 c_state IDLE -> START -> IDLE
s += m.box(338, 130, 1030, 153)          # 3 bit_cnt 0
s += m.box(338, 55, 1030, 79, GRN)       # 4 rx_done 0
s += m.box(338, 205, 1030, 228, GRN)     # 4 FIFO_RX push 0
s += m.box(338, 754, 1030, 778)          # 5 TX c_state IDLE
s += m.box(338, 879, 1030, 903)          # 5 tx = 1
for yy in (42, 67, 91, 141, 216, 416, 666, 766, 891):
    s += m.box(40, yy - 11, 175, yy + 11, GRN, 1.5)
for n_, yy in (('1', 42), ('2', 91), ('3', 141), ('4', 216), ('5', 766)):
    s += badge(m.x(338) - 14, m.y(yy), n_, d=20, sz=950)
rows = [('1', 'rx glitch 입력 (가는 low pulse 반복)'),
        ('2', 'c_state IDLE → START → IDLE 복귀'),
        ('3', 'bit_cnt 0 유지 → DATA 진입 없음'),
        ('4', 'rx_done 0 · FIFO push 0 · count 0'),
        ('5', 'UART_TX IDLE · tx = 1 → echo 없음')]
for i, (n_, b_) in enumerate(rows):
    s += legend_row(40, 404 + i * 30, 600, n_, '', b_, h=28, sz=1200)
frag = minidom.parseString('<r xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
                           'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' + s + '</r>')
for c in list(frag.documentElement.childNodes):
    tree.appendChild(doc.importNode(c, True))
open(path, 'wb').write(doc.toxml(encoding='UTF-8'))
print('slide19 done')
