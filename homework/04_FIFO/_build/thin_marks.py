"""thin_marks.py — thin out annotation lines/boxes (shapes named ann*) on capture slides; place the two TB log images on slide 21.
usage: python3 thin_marks.py <unpacked_dir>"""
import sys, os, re
from xml.dom import minidom
ROOT = sys.argv[1]
E = 9525
for n in range(12, 18):
    p = os.path.join(ROOT, f'ppt/slides/slide{n}.xml')
    doc = minidom.parse(p)
    for nv in doc.getElementsByTagName('p:cNvPr'):
        if not nv.getAttribute('name').startswith('ann'):
            continue
        el = nv.parentNode.parentNode
        geo = el.getElementsByTagName('a:prstGeom')
        prst = geo[0].getAttribute('prst') if geo else ''
        for ln in el.getElementsByTagName('a:ln'):
            if not ln.getElementsByTagName('a:solidFill'):
                continue
            if el.tagName == 'p:cxnSp':                      # event line
                ln.setAttribute('w', '6350')                 # 0.5 pt
                for d in ln.getElementsByTagName('a:prstDash'):
                    d.setAttribute('val', 'sysDash')
            elif prst == 'rect' and el.getElementsByTagName('a:noFill'):  # signal / event box
                ln.setAttribute('w', '9525')                 # 0.75 pt
    open(p, 'wb').write(doc.toxml(encoding='UTF-8'))

# slide 21 : directed log (image8) left, random log (image7) right, with labels
p = os.path.join(ROOT, 'ppt/slides/slide21.xml')
rels = open(os.path.join(ROOT, 'ppt/slides/_rels/slide21.xml.rels'), encoding='utf-8').read()
doc = minidom.parse(p)
tree = doc.getElementsByTagName('p:spTree')[0]
def target(rid): return re.search(r'Id="%s"[^>]*Target="([^"]+)"' % rid, rels).group(1)
def place(pic, X, Y, W, H):
    xf = pic.getElementsByTagName('a:xfrm')[0]
    off = xf.getElementsByTagName('a:off')[0]; ext = xf.getElementsByTagName('a:ext')[0]
    off.setAttribute('x', str(int(X * E))); off.setAttribute('y', str(int(Y * E)))
    ext.setAttribute('cx', str(int(W * E))); ext.setAttribute('cy', str(int(H * E)))
for pic in doc.getElementsByTagName('p:pic'):
    t = target(pic.getElementsByTagName('a:blip')[0].getAttribute('r:embed'))
    if t.endswith('image8.png'):
        place(pic, 140, 210, 440 * 209 / 218, 440)       # directed : 209 x 218
    elif t.endswith('image7.png'):
        place(pic, 680, 300, 480, 480 * 81 / 253)         # random : 253 x 81
def label(x, y, w, txt, i):
    return (f'<p:sp xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
            f'<p:nvSpPr><p:cNvPr id="{9800 + i}" name="lbl{i}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{int(x * E)}" y="{int(y * E)}"/><a:ext cx="{int(w * E)}" cy="{int(26 * E)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            f'<p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"/><a:lstStyle/><a:p><a:r><a:rPr lang="ko-KR" sz="1500" b="1"><a:solidFill><a:srgbClr val="64748B"/></a:solidFill><a:ea typeface="맑은 고딕"/></a:rPr><a:t>{txt}</a:t></a:r></a:p></p:txBody></p:sp>')
for i, (x, y, w, t) in enumerate([(140, 176, 440, 'directed (S1 ~ S4) · pass 메시지'), (680, 266, 480, 'random (S5) · result')]):
    frag = minidom.parseString(label(x, y, w, t, i))
    tree.appendChild(doc.importNode(frag.documentElement, True))
open(p, 'wb').write(doc.toxml(encoding='UTF-8'))
print('done')
