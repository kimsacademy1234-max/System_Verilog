"""annotate_captures.py — mark the event order on the user's Vivado captures (UART_FIFO_loopback deck)

usage: python3 annotate_captures.py <unpacked_pptx_dir>
  - removes the "파형 캡처 영역" placeholder on capture slides
  - fixes the picture aspect ratio (crop + size) and places it
  - adds native shapes: clk-edge lines, E0 ~ E4 / ① ~ ⑦ badges, name boxes, event boxes, step legend
Event x positions are pixel positions measured on the capture PNGs (edge scan).
"""
import sys, os, re
from xml.dom import minidom

ROOT = sys.argv[1]
E = 9525
YEL, RED, GRN, INK, WHITE, SUB = 'FFD400', 'FF3B3B', '7CFC00', '0F172A', 'FFFFFF', '475569'
NID = [9000]


def nid():
    NID[0] += 1
    return NID[0]


def emu(v):
    return str(int(round(v * E)))


def txbody(text, sz, bold, color, align='ctr', font='Consolas', anchor='ctr'):
    if text is None:
        return '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="ko-KR"/></a:p></p:txBody>'
    paras = []
    for line in text.split('\n'):
        runs = []
        for k, part in enumerate(re.split(r'\*\*', line)):
            if not part:
                continue
            b = '1' if (bold or k % 2) else '0'
            c = RED if (k % 2 and color != WHITE) else color
            part = part.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            runs.append(f'<a:r><a:rPr lang="ko-KR" sz="{sz}" b="{b}"><a:solidFill><a:srgbClr val="{c}"/></a:solidFill>'
                        f'<a:latin typeface="{font}"/><a:ea typeface="맑은 고딕"/></a:rPr><a:t>{part}</a:t></a:r>')
        paras.append(f'<a:p><a:pPr algn="{align}"/>{"".join(runs)}</a:p>')
    return (f'<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="{anchor}"><a:noAutofit/></a:bodyPr>'
            f'<a:lstStyle/>{"".join(paras)}</p:txBody>')


def sp(prst, x, y, w, h, fill=None, line=None, lw=1.5, dash=None, text=None, sz=1000, bold=True,
       color=INK, align='ctr', font='Consolas', anchor='ctr', radius=None):
    i = nid()
    fill_x = f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>' if fill else '<a:noFill/>'
    if line:
        d = f'<a:prstDash val="{dash}"/>' if dash else ''
        line_x = f'<a:ln w="{int(lw * 12700)}"><a:solidFill><a:srgbClr val="{line}"/></a:solidFill>{d}</a:ln>'
    else:
        line_x = '<a:ln><a:noFill/></a:ln>'
    av = f'<a:avLst><a:gd name="adj" fmla="val {radius}"/></a:avLst>' if radius is not None else '<a:avLst/>'
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{i}" name="ann{i}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
            f'<a:prstGeom prst="{prst}">{av}</a:prstGeom>{fill_x}{line_x}</p:spPr>'
            f'{txbody(text, sz, bold, color, align, font, anchor)}</p:sp>')


def vline(x, y1, y2, color=YEL, lw=1.25, dash='dash'):
    i = nid()
    return (f'<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="{i}" name="ann{i}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y1)}"/><a:ext cx="0" cy="{emu(y2 - y1)}"/></a:xfrm>'
            f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="{int(lw * 12700)}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:prstDash val="{dash}"/></a:ln></p:spPr></p:cxnSp>')


def arrow(x1, y1, x2, y2, color=RED, lw=1.75):
    i = nid()
    fh = ' flipH="1"' if x2 < x1 else ''
    fv = ' flipV="1"' if y2 < y1 else ''
    return (f'<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="{i}" name="ann{i}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>'
            f'<p:spPr><a:xfrm{fh}{fv}><a:off x="{emu(min(x1, x2))}" y="{emu(min(y1, y2))}"/><a:ext cx="{emu(abs(x2 - x1))}" cy="{emu(abs(y2 - y1))}"/></a:xfrm>'
            f'<a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="{int(lw * 12700)}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
            f'<a:tailEnd type="triangle"/></a:ln></p:spPr></p:cxnSp>')


def badge(cx, cy, t, d=22, sz=1000, fill='FDE047', color=INK):
    return sp('ellipse', cx - d / 2, cy - d / 2, d, d, fill=fill, line=INK, lw=1, text=t, sz=sz, color=color)


def tagbox(x, y, w, h, t, sz=900):  # small yellow label "E0"
    return sp('rect', x, y, w, h, fill='FDE047', line=INK, lw=0.75, text=t, sz=sz)


def legend_row(x, y, w, n, head, body, h=30, sz=1200):
    return (badge(x + 12, y + h / 2, n) +
            sp('rect', x + 30, y, w - 30, h, text=f'**{head}**  {body}' if head else body, sz=sz, bold=False,
               align='l', font='맑은 고딕', color=INK))


class Map:  # image pixel -> slide px
    def __init__(s, X, Y, W, iw, ih, crop):  # crop = (l, t, r, b) in px
        s.l, s.t, s.r, s.b = crop
        s.k = W / (iw - s.l - s.r)
        s.X, s.Y, s.W, s.H = X, Y, W, (ih - s.t - s.b) * s.k
        s.iw, s.ih = iw, ih

    def x(s, px):
        return s.X + (px - s.l) * s.k

    def y(s, py):
        return s.Y + (py - s.t) * s.k

    def box(s, x1, y1, x2, y2, color=RED, lw=1.75):
        return sp('rect', s.x(x1), s.y(y1), s.x(x2) - s.x(x1), s.y(y2) - s.y(y1), line=color, lw=lw)


def edit_slide(n, mp, shapes_xml):
    path = os.path.join(ROOT, f'ppt/slides/slide{n}.xml')
    doc = minidom.parse(path)
    tree = doc.getElementsByTagName('p:spTree')[0]
    kids = [c for c in tree.childNodes if c.nodeType == 1 and c.tagName in ('p:sp', 'p:pic', 'p:grpSp', 'p:cxnSp', 'p:graphicFrame')]

    def text(el):
        return ''.join(t.firstChild.data if t.firstChild else '' for t in el.getElementsByTagName('a:t'))
    # remove placeholder (dashed box + 3 text shapes)
    for i, el in enumerate(kids):
        if el.tagName == 'p:sp' and text(el).strip() == '파형 캡처 영역':
            rm = [kids[i], kids[i + 1], kids[i + 2]]
            prev = kids[i - 1]
            if prev.tagName == 'p:sp' and 'FFF7ED' in prev.toxml():
                rm.append(prev)
            for r in rm:
                tree.removeChild(r)
            break
    # picture : crop + size
    if mp is not None:
        pics = [c for c in tree.childNodes if c.nodeType == 1 and c.tagName == 'p:pic']
        pic = pics[-1] if mp.get('pic') is None else pics[mp['pic']]
        m = mp['map']
        bf = pic.getElementsByTagName('p:blipFill')[0]
        for old in bf.getElementsByTagName('a:srcRect'):
            bf.removeChild(old)
        sr = doc.createElement('a:srcRect')
        for k, v in zip('ltrb', (m.l / m.iw, m.t / m.ih, m.r / m.iw, m.b / m.ih)):
            if v:
                sr.setAttribute(k, str(int(round(v * 100000))))
        stretch = bf.getElementsByTagName('a:stretch')[0]
        bf.insertBefore(sr, stretch)
        xfrm = pic.getElementsByTagName('a:xfrm')[0]
        off = xfrm.getElementsByTagName('a:off')[0]
        ext = xfrm.getElementsByTagName('a:ext')[0]
        off.setAttribute('x', emu(m.X)); off.setAttribute('y', emu(m.Y))
        ext.setAttribute('cx', emu(m.W)); ext.setAttribute('cy', emu(m.H))
    frag = minidom.parseString(
        '<r xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' + shapes_xml + '</r>')
    for c in list(frag.documentElement.childNodes):
        tree.appendChild(doc.importNode(c, True))
    xml = doc.toxml(encoding='UTF-8')
    open(path, 'wb').write(xml)


# ---------------------------------------------------------------- slide 12 : rx_done -> tx (image1 1011 x 1070)
m = Map(480, 170, 545, 1011, 1070, (0, 112, 0, 30))
EX = [551, 601, 651, 701, 751]
s = ''
for k, x in enumerate(EX):
    s += vline(m.x(x), m.y(128), m.y(1038), RED if k == 0 else YEL, 1.25)
    s += tagbox(m.x(x) - 12, m.y(114), 24, 15, f'E{k}', 850)
for yy in (300, 450, 600, 700, 850, 900, 1025):  # names to check
    s += m.box(40, yy - 11, 175, yy + 11, GRN, 1.5)
s += m.box(551, 290, 601, 311)          # E0 rx_done
s += m.box(601, 440, 651, 462)          # E1 FIFO_RX empty 0
s += m.box(601, 590, 651, 612)          # E1 FIFO_TX push
s += m.box(651, 690, 701, 712)          # E2 FIFO_TX empty 0
s += m.box(651, 840, 701, 862)          # E2 tx_start
s += m.box(701, 889, 790, 911)          # E3 c_state START
s += m.box(740, 1013, 790, 1037)        # E4 tx fall
s += sp('rect', 1035, 600, 205, 60, text='E0 → E4\n**4 clk (40 ns)**', sz=1300, bold=False, font='맑은 고딕', align='l')
edit_slide(12, {'map': m}, s)

# ---------------------------------------------------------------- slide 15 : S1 FIFO unit (image3 1391 x 340)
m = Map(16, 184, 854, 1391, 340, (0, 0, 241, 0))
s = ''
for x in (690, 730, 770, 850, 930, 1090):
    s += vline(m.x(x), m.y(28), m.y(332), YEL, 1.25)
marks = [(630, '1'), (730, '2'), (770, '3'), (850, '4'), (930, '5'), (1010, '6'), (1090, '7')]
for x, t in marks:
    s += badge(m.x(x), 172, t, d=20, sz=950)
for yy in (190, 240, 265, 290):
    s += m.box(40, yy - 11, 210, yy + 11, GRN, 1.5)
s += m.box(690, 254, 770, 277)   # full
s += m.box(760, 180, 800, 201)   # pop_data a0 -> a1 at push+pop@full
s += m.box(930, 229, 1090, 252)  # empty
rows = [('1', 'fill', 'a0 ~ a3 push → wptr 0→1→2→3→0, full 1'),
        ('2', 'push & full', 'ee → 무시 (wptr · head 유지)'),
        ('3', 'push+pop & full', 'b0 → pop만 (full 0, spec)'),
        ('4', 'push+pop & mid', 'b1 → wptr · rptr +1, count 유지'),
        ('5', 'drain', 'pop 2번 → count 0, empty 1'),
        ('6', 'pop & empty', 'pop 3번 → 무시 (rptr 유지)'),
        ('7', 'push+pop & empty', 'c0 → push만 (empty 0)')]
for i, (n_, h_, b_) in enumerate(rows):
    col, row = (0, i) if i < 4 else (1, i - 4)
    s += legend_row(16 + col * 432, 452 + row * 52, 424, n_, h_, b_, h=44, sz=1150)
s += sp('rect', 448, 608, 424, 44, text='이후 무작위 400 step · 매 step 모델과 일치', sz=1150, bold=False, font='맑은 고딕', align='l', color=SUB)
edit_slide(15, {'map': m, 'pic': -1}, s)

# ---------------------------------------------------------------- slide 16 : S2 single byte (image4 1035 x 987)
m = Map(40, 168, 426, 1035, 987, (0, 0, 205, 0))
s = vline(m.x(539), m.y(10), m.y(980), RED, 1.5)
s += m.box(340, 28, 539, 52)            # rx frame tail
s += m.box(339, 128, 539, 227)          # UART_RX DATA -> data_reg d4
s += m.box(529, 280, 550, 300)          # FIFO_RX push
s += m.box(529, 530, 550, 550)          # FIFO_TX push
s += m.box(529, 780, 550, 800)          # tx_start
s += m.box(539, 828, 750, 927)          # UART_TX DATA shift
s += m.box(539, 580, 748, 600)          # FIFO_TX pop 0 while busy
for yy in (240, 290, 540, 590, 790, 940, 965):
    s += m.box(40, yy - 11, 175, yy + 11, GRN, 1.5)
s += badge(m.x(440), m.y(12), '1') + badge(m.x(539) + 14, m.y(240), '2') + badge(m.x(539) + 14, m.y(790), '3')
s += badge(m.x(645), m.y(830) - 14, '4') + badge(m.x(645), m.y(590) - 14, '5')
rows = [('1', '', 'rx frame 수신 → data_reg 80 → … → d4'),
        ('2', '', 'rx_done 1 clk → FIFO_RX push (빨간 선)'),
        ('3', '', 'FIFO 2단 통과 → tx_start (4 clk)'),
        ('4', '', 'uart_tx DATA: d4 → 6a → 35 … LSB부터 송신'),
        ('5', '', 'tx_busy = 1 동안 FIFO_TX pop = 0')]
for i, (n_, h_, b_) in enumerate(rows):
    s += legend_row(482, 176 + i * 60, 384, n_, h_, b_, h=50, sz=1200)
edit_slide(16, {'map': m, 'pic': -1}, s)

# ---------------------------------------------------------------- slide 17 : S3 back-to-back (image5 945 x 836)
m = Map(40, 168, 572, 945, 836, (0, 0, 0, 0))
s = ''
for x in (413, 517, 621, 726, 830, 934):
    s += vline(m.x(x), m.y(340), m.y(830), YEL, 1)
s += m.box(342, 254, 944, 300)          # rx / tx continuous
s += m.box(342, 503, 944, 552)          # FIFO_RX wptr / rptr
s += m.box(342, 553, 944, 576, GRN)     # occ_rx 0
s += m.box(342, 802, 944, 826, GRN)     # occ_tx 0
s += arrow(m.x(377), m.y(146), m.x(560), m.y(160)) + arrow(m.x(467), m.y(146), m.x(665), m.y(160))
for yy in (139, 164, 189, 364, 515, 540, 564, 814):
    s += m.box(40, yy - 11, 190, yy + 11, GRN, 1.5)
s += badge(m.x(330) - 4, m.y(277), '1') + badge(m.x(413) + 12, m.y(352), '2') + badge(m.x(330) - 4, m.y(527), '3')
s += badge(m.x(620), m.y(152), '4') + badge(m.x(330) - 4, m.y(189), '5')
rows = [('1', '', '연속 rx → 연속 echo'),
        ('2', '', 'frame마다 FIFO push'),
        ('3', '', 'wptr = rptr → count 0'),
        ('4', '', 'echo 순서 = 송신 순서'),
        ('5', '', 'sb_err 0 · err_flag 0')]
for i, (n_, h_, b_) in enumerate(rows):
    s += legend_row(626, 176 + i * 60, 244, n_, h_, b_, h=52, sz=1150)
edit_slide(17, {'map': m, 'pic': -1}, s)

# ---------------------------------------------------------------- slide 18 : S4 worst case (image6 971 x 911)
m = Map(40, 168, 539, 971, 911, (0, 0, 0, 0))
EX = [645, 679, 714, 748, 782]
s = ''
for k, x in enumerate(EX):
    s += vline(m.x(x), m.y(22), m.y(902), RED if k == 0 else YEL, 1.25)
    s += tagbox(m.x(x) - 9, m.y(4) + (0 if k % 2 == 0 else 12), 18, 12, f'E{k}', 750)
s += m.box(640, 52, 680, 73)            # rx_done
s += m.box(600, 752, 690, 773)          # TX STOP -> IDLE (same edge)
s += m.box(679, 302, 714, 323)          # FIFO_RX empty 0
s += m.box(679, 452, 714, 473)          # FIFO_TX push
s += m.box(714, 552, 748, 573)          # FIFO_TX empty 0
s += m.box(714, 702, 748, 723)          # tx_start
s += m.box(748, 752, 830, 773)          # START
s += m.box(770, 877, 800, 898)          # tx fall
for yy in (62, 312, 462, 562, 712, 762, 887):
    s += m.box(40, yy - 11, 180, yy + 11, GRN, 1.5)
s += badge(m.x(600), m.y(762), '1') + badge(m.x(610), m.y(62), '2') + badge(m.x(696), m.y(390), '3') + badge(m.x(860), m.y(762), '4')
rows = [('E0', 'rx_done ↑ = TX STOP → IDLE (같은 clk)'),
        ('E1', 'FIFO_RX push · tx_busy 0'),
        ('E2', 'FIFO_TX push · tx_start 1'),
        ('E3', 'START · FIFO_TX pop'),
        ('E4', 'tx fall → 다음 echo')]
for i, (t_, b_) in enumerate(rows):
    y = 178 + i * 56
    s += tagbox(594, y + 12, 30, 22, t_, 1000)
    s += sp('rect', 632, y, 238, 46, text=b_, sz=1150, bold=False, font='맑은 고딕', align='l')
edit_slide(18, {'map': m, 'pic': -1}, s)

# ---------------------------------------------------------------- slide 19 : S5 log (image7 453 x 225)
m = Map(600, 240, 630, 453, 225, (0, 0, 0, 0))
edit_slide(19, {'map': m, 'pic': -1}, '')
print('done')
