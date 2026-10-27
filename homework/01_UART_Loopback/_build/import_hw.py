"""import_hw.py — copy the user's HW-deck shapes (waveform captures + their annotations) onto the base deck.

usage: python3 import_hw.py <base.pptx> <import_map.json> <hw_unpacked_dir> <photo_dir> <out.pptx>

import_map.json (from build_final.js):
  {"total": N, "imports": [{"slide": k, "src": hw_slide_no, "keep": [spTree child indexes],
                            "tf": {"s", "ax", "ay", "bx", "by"} | null, "fix": [[old, new], ...]}]}
  tf maps an HW position (px) to   b + s * (p - a)   on the new slide.
photo_dir holds downscaled copies of large HW images (same file name) that replace the originals.
Also replaces the "__TOTAL__" page-count placeholder on every slide.
"""
import json, os, re, sys, zipfile, copy
from xml.dom import minidom

E = 9525  # EMU per px (1280 px = 12192000 EMU)
base, mapf, hwdir, photodir, out = sys.argv[1:6]
m = json.load(open(mapf, encoding='utf-8'))
zin = zipfile.ZipFile(base)
files = {n: zin.read(n) for n in zin.namelist()}


def slide_paths():
    pres = files['ppt/presentation.xml'].decode()
    rels = files['ppt/_rels/presentation.xml.rels'].decode()
    rid = {}
    for r in re.findall(r'<Relationship [^>]*/>', rels):
        i = re.search(r'Id="([^"]+)"', r).group(1)
        t = re.search(r'Target="([^"]+)"', r).group(1)
        rid[i] = t.lstrip('/').replace('ppt/', '')
    ids = re.findall(r'<p:sldId [^>]*r:id="([^"]+)"', pres)
    return ['ppt/' + rid[i] for i in ids]


paths = slide_paths()
media_added = {}  # src media name -> new media path


def hw_rels(n):
    x = open(os.path.join(hwdir, f'ppt/slides/_rels/slide{n}.xml.rels'), encoding='utf-8').read()
    d = {}
    for r in re.findall(r'<Relationship [^>]*/>', x):
        i = re.search(r'Id="([^"]+)"', r).group(1)
        t = re.search(r'Target="([^"]+)"', r).group(1)
        d[i] = t
    return d


def add_media(target):
    name = os.path.basename(target)
    if name in media_added:
        return media_added[name]
    src = os.path.join(photodir, name)
    if not os.path.exists(src):
        src = os.path.join(hwdir, 'ppt/media', name)
    new = 'ppt/media/hw_' + name
    files[new] = open(src, 'rb').read()
    media_added[name] = new
    return new


def xf(el, tf):
    """transform the top-level xfrm of a shape / picture / group / connector"""
    if not tf:
        return
    pr = None
    for c in el.childNodes:
        if c.nodeType == 1 and c.tagName in ('p:spPr', 'p:grpSpPr'):
            pr = c
    if pr is None:
        return
    xs = [c for c in pr.childNodes if c.nodeType == 1 and c.tagName == 'a:xfrm']
    if not xs:
        return
    x = xs[0]
    off = [c for c in x.childNodes if c.nodeType == 1 and c.tagName == 'a:off'][0]
    ext = [c for c in x.childNodes if c.nodeType == 1 and c.tagName == 'a:ext'][0]
    s, ax, ay, bx, by = tf['s'], tf['ax'], tf['ay'], tf['bx'], tf['by']
    ox, oy = int(off.getAttribute('x')) / E, int(off.getAttribute('y')) / E
    off.setAttribute('x', str(int(round((bx + s * (ox - ax)) * E))))
    off.setAttribute('y', str(int(round((by + s * (oy - ay)) * E))))
    ext.setAttribute('cx', str(int(round(int(ext.getAttribute('cx')) * s))))
    ext.setAttribute('cy', str(int(round(int(ext.getAttribute('cy')) * s))))


for imp in m['imports']:
    tpath = paths[imp['slide'] - 1]
    trels_path = tpath.replace('slides/', 'slides/_rels/') + '.rels'
    tdoc = minidom.parseString(files[tpath])
    tree = tdoc.getElementsByTagName('p:spTree')[0]
    sdoc = minidom.parse(os.path.join(hwdir, f"ppt/slides/slide{imp['src']}.xml"))
    stree = sdoc.getElementsByTagName('p:spTree')[0]
    kids = [c for c in stree.childNodes if c.nodeType == 1 and c.tagName not in ('p:nvGrpSpPr', 'p:grpSpPr')]
    srels = hw_rels(imp['src'])
    trels = files[trels_path].decode()
    next_rid = 100
    rid_map = {}
    for idx in imp['keep']:
        el = tdoc.importNode(kids[idx], True)
        xf(el, imp['tf'])
        # image / link relationships
        for node in el.getElementsByTagName('*'):
            for an in ('r:embed', 'r:link', 'r:id'):
                if node.hasAttribute(an):
                    old = node.getAttribute(an)
                    if old not in rid_map:
                        tgt = srels[old]
                        new_media = add_media(tgt)
                        nid = f'rId{next_rid}'
                        next_rid += 1
                        trels = trels.replace('</Relationships>',
                                              f'<Relationship Id="{nid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/{os.path.basename(new_media)}"/></Relationships>')
                        rid_map[old] = nid
                    node.setAttribute(an, rid_map[old])
        # unique shape ids
        for node in el.getElementsByTagName('p:cNvPr'):
            node.setAttribute('id', str(int(node.getAttribute('id')) + 5000))
        for tag in ('a:stCxn', 'a:endCxn'):
            for node in el.getElementsByTagName(tag):
                node.setAttribute('id', str(int(node.getAttribute('id')) + 5000))
        # text fixes
        for t in el.getElementsByTagName('a:t'):
            if t.firstChild:
                v = t.firstChild.data
                for a, b in imp['fix']:
                    if v.strip() == a:
                        v = v.replace(a, b)
                t.firstChild.data = v
        tree.appendChild(el)
    files[tpath] = tdoc.toxml(encoding='UTF-8')
    files[trels_path] = trels.encode()

# page count placeholder
for p in paths:
    files[p] = files[p].replace(b'__TOTAL__', str(m['total']).encode())

# content types
ct = files['[Content_Types].xml'].decode()
for ext, mime in (('png', 'image/png'), ('jpeg', 'image/jpeg'), ('jpg', 'image/jpeg')):
    if f'Extension="{ext}"' not in ct:
        ct = ct.replace('<Default ', f'<Default Extension="{ext}" ContentType="{mime}"/><Default ', 1)
files['[Content_Types].xml'] = ct.encode()

order = ['[Content_Types].xml'] + [n for n in files if n != '[Content_Types].xml']
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for n in order:
        z.writestr(n, files[n])
print('wrote', out, 'media', len(media_added))
