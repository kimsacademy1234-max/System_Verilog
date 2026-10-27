#!/usr/bin/env python3
"""Generate SVG figures for UART_QnA.md (Q3). Usage: qna_fig.py <out_dir>"""
import os, sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

FONT = "'Malgun Gothic','맑은 고딕',sans-serif"
MONO = "Consolas,'Courier New',monospace"
C = dict(ink='#0F172A', sub='#64748B', line='#CBD5E1', pale='#F8FAFC', grid='#E2E8F0',
         rx='#BE123C', rxf='#FFF1F2', tx='#1D4ED8', txf='#EFF6FF', tick='#B45309', tickf='#FEF3C7',
         acc='#7C3AED', accf='#F5F3FF', ok='#0F766E', okf='#F0FDFA', bad='#DC2626', badf='#FEF2F2')


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
            f'font-family="{FONT}">\n'
            '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
            'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>\n'
            f'<rect width="{w}" height="{h}" fill="#FFFFFF"/>\n' + body + '</svg>\n')


def t(x, y, s, size=13, fill=C['ink'], anchor='start', weight='normal', mono=False, extra=''):
    fam = f' font-family="{MONO}"' if mono else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
            f'font-weight="{weight}"{fam} {extra}>{s}</text>\n')


def r(x, y, w, h, fill, stroke='none', sw=1, rx=0, extra=''):
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{sw}" rx="{rx}" {extra}/>\n')


def ln(x1, y1, x2, y2, stroke, sw=1.5, dash=None, arrow=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    a = ''
    if arrow == 'end':
        a = ' marker-end="url(#ah)"'
    elif arrow == 'both':
        a = ' marker-start="url(#ah)" marker-end="url(#ah)"'
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" '
            f'stroke-width="{sw}"{d}{a}/>\n')


def title(w, s, sub):
    return t(24, 34, s, 18, weight='bold') + t(24, 56, sub, 12.5, C['sub'])


# ---------------------------------------------------------------- Fig 1
def fig_sample_position():
    W, H = 960, 500
    x0, px = 230, 34          # bit start x, px per tick (16 tick = 544 px)
    x1 = x0 + 16 * px
    b = title(W, '그림 Q3-1. 샘플 위치에 따른 마진 (1 bit = 16 tick)',
              '보라색 = 실제 샘플이 찍힐 수 있는 범위 (async 검출 지연 0~1 tick) · 마진 = 앞/뒤 여유 중 작은 쪽')
    # tick axis
    ya = 92
    for k in range(17):
        x = x0 + k * px
        b += ln(x, ya, x, ya + 6, C['sub'], 1)
        b += t(x, ya - 4, str(k), 11, C['sub'], 'middle', mono=True)
    b += t(x0 - 12, ya + 2, 'tick', 11, C['sub'], 'end', mono=True)
    rows = [(4, '== 3', False), (7, '== 6', False), (8, '== 7', True), (12, '== 11', False)]
    y = 112
    for s, cmp, cur in rows:
        rh = 82
        if cur:
            b += r(14, y - 6, W - 28, rh, C['accf'], C['acc'], 1.2, 8)
        b += t(28, y + 22, f'START {s} tick', 14, weight='bold')
        b += t(28, y + 42, f'b_tick_cnt {cmp}', 12, C['sub'], mono=True)
        if cur:
            b += t(28, y + 62, '현재 설계', 12, C['acc'], weight='bold')
        by = y + 6
        # neighbour bits
        b += r(x0 - 40, by, 40, 26, C['grid'])
        b += r(x1, by, 40, 26, C['grid'])
        b += t(x0 - 20, by + 17, '이전', 10.5, C['sub'], 'middle')
        b += t(x1 + 20, by + 17, '다음', 10.5, C['sub'], 'middle')
        b += r(x0, by, 16 * px, 26, C['pale'], C['line'])
        b += ln(x0 + 8 * px, by, x0 + 8 * px, by + 26, C['line'], 1, '3,3')
        # sample zone
        b += r(x0 + s * px, by - 4, px, 34, C['acc'], extra='fill-opacity="0.85"')
        # rooms
        early, late = s, 16 - s - 1
        ay = by + 44
        if early:
            b += ln(x0 + 2, ay, x0 + s * px - 2, ay, C['ok'], 1.6, arrow='both')
            b += t(x0 + s * px / 2, ay - 5, f'앞 {early}', 12, C['ok'], 'middle', 'bold')
        b += ln(x0 + (s + 1) * px + 2, ay, x1 - 2, ay, C['tick'], 1.6, arrow='both')
        b += t(x0 + (s + 1) * px + late * px / 2, ay - 5, f'뒤 {late}', 12, C['tick'], 'middle', 'bold')
        m = min(early, late)
        col = C['acc'] if cur else C['ink']
        b += t(W - 30, y + 22, '마진', 12, C['sub'], 'end')
        b += t(W - 30, y + 46, f'{m} tick', 17, col, 'end', 'bold', mono=True)
        b += t(W - 30, y + 64, f'({m / 16 * 100:.2f}%)', 12, col, 'end', mono=True)
        y += rh + 10
    b += t(24, H - 14, '7 tick과 8 tick이 마진 7 tick으로 같음 → 지연이 뒤로만 생기므로 이론상 균형점은 7.5 tick, '
           '중앙에서 멀어질수록 작은 쪽 여유가 줄어듦', 12, C['sub'])
    return svg(W, H, b)


# ---------------------------------------------------------------- Fig 2
def fig_assumed_vs_actual():
    W, H = 960, 400
    b = title(W, '그림 Q3-2. 연속 전송 시 async 지연: 가정 vs 실제',
              '세로축 = 각 frame의 샘플 위치가 bit 중앙보다 늦어진 정도 (bit 대비 %), 빨간 선 = 뒤쪽 여유 한계')
    panels = [(40, '가정: frame마다 6.25%씩 누적', 'cum'), (500, '실제: frame마다 새 start edge 기준', 'reset')]
    pw, ph, top = 420, 230, 110
    ymax = 56.25

    def Y(v):
        return top + ph - v / ymax * ph
    for px0, name, mode in panels:
        b += t(px0, top - 22, name, 14, C['bad'] if mode == 'cum' else C['ok'], weight='bold')
        for v in (0, 12.5, 25, 37.5, 50):
            b += ln(px0 + 40, Y(v), px0 + pw, Y(v), C['grid'], 1)
            b += t(px0 + 34, Y(v) + 4, f'{v:g}%', 10.5, C['sub'], 'end', mono=True)
        b += ln(px0 + 40, Y(0), px0 + pw, Y(0), C['sub'], 1.2)
        b += ln(px0 + 40, Y(50 - 6.25), px0 + pw, Y(50 - 6.25), C['bad'], 1.6, '6,4')
        bw, gap = 36, 18
        for k in range(1, 8):
            x = px0 + 52 + (k - 1) * (bw + gap)
            if mode == 'cum':
                v = 6.25 * k
                fill = C['bad'] if v >= 43.75 else C['rx']
                b += r(x, Y(v), bw, Y(0) - Y(v), fill, extra='fill-opacity="0.85"')
                b += t(x + bw / 2, Y(v) - 5, f'{v:g}', 10.5, fill, 'middle', mono=True)
            else:
                b += r(x, Y(6.25), bw, Y(0) - Y(6.25), C['ok'], extra='fill-opacity="0.85"')
            b += t(x + bw / 2, Y(0) + 17, str(k), 11.5, C['sub'], 'middle', mono=True)
        b += t(px0 + 40 + (pw - 40) / 2, Y(0) + 36, 'frame 번호', 11.5, C['sub'], 'middle')
        if mode == 'cum':
            b += t(px0 + 44, Y(43.75) - 8, '뒤쪽 여유 한계 43.75%', 11.5, C['bad'], weight='bold')
            b += t(px0 + pw, Y(0) + 54, '7번째 frame에서 한계 도달 → bit 놓침 (질문의 가정)', 12, C['bad'], 'end')
        else:
            b += t(px0 + 44, Y(43.75) - 8, '뒤쪽 여유 한계 43.75%', 11.5, C['bad'], weight='bold')
            b += t(px0 + 44, Y(6.25) - 8, '매 frame 0~6.25% 안에서만 변함', 11.5, C['ok'], weight='bold')
            b += t(px0 + pw, Y(0) + 54, 'IDLE에서 새 edge를 기다려 카운터를 0부터 다시 셈', 12, C['ok'], 'end')
    return svg(W, H, b)


# ---------------------------------------------------------------- Fig 3
def fig_resync_timeline():
    W, H = 980, 490
    lx, px = 128, 38            # x of t=0 (edge of 0x31), px per bit
    t0, t1 = -1.6, 21.2

    def X(bit):
        return lx + (bit - t0) * px
    b = title(W, '그림 Q3-3. 0x31 → 0x32 연속 수신: frame마다 start edge에서 다시 맞춤 (xsim)',
              '세로 점선 = 샘플 위치 (bit 중앙) · d = async 검출 지연 0~1 tick, frame마다 새로 정해짐')
    frames = [(0, 0x31), (10, 0x32)]
    # bit grid + labels
    yw_hi, yw_lo = 116, 146
    b += t(24, 136, 'rx (PC)', 13, C['rx'], weight='bold', mono=True)
    pts = [(X(t0), yw_hi)]
    level = 1
    for f0, val in frames:
        bits = [0] + [(val >> i) & 1 for i in range(8)] + [1]
        names = ['S'] + [f'D{i}' for i in range(8)] + ['P']
        for i, (bv, nm) in enumerate(zip(bits, names)):
            xa = X(f0 + i)
            if bv != level:
                pts.append((xa, yw_hi if level else yw_lo))
                pts.append((xa, yw_hi if bv else yw_lo))
                level = bv
            b += ln(xa, 96, xa, 156, C['grid'], 1)
            col = C['rx'] if nm in ('S', 'P') else C['sub']
            b += t(xa + px / 2, 92, nm, 10.5, col, 'middle', mono=True)
            b += t(xa + px / 2, 172, str(bv), 10.5, C['sub'], 'middle', mono=True)
        b += r(X(f0) + 1, 98, 10 * px - 2, 4, C['rxf'])
        b += t(X(f0 + 5), 194, f'frame 0x{val:02X} (LSB first)', 11.5, C['sub'], 'middle')
        # sample lines
        for k in range(8):
            xs = X(f0 + k + 1.5)
            b += ln(xs, 104, xs, 256, C['acc'], 1, '3,3')
            b += f'<circle cx="{xs:.1f}" cy="{yw_hi if (val >> k) & 1 else yw_lo}" r="3.2" fill="{C["acc"]}"/>\n'
    pts.append((X(t1), pts[-1][1]))
    b += ('<polyline fill="none" stroke="%s" stroke-width="2.2" points="%s"/>\n'
          % (C['rx'], ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)))
    # RX state bar
    ys = 222
    b += t(24, ys + 17, 'RX state', 13, weight='bold', mono=True)
    segs = [(t0, 0, 'IDLE', C['pale'])]
    for f0, _ in frames:
        segs += [(f0, f0 + 0.5, 'START', C['tickf']), (f0 + 0.5, f0 + 8.5, 'DATA', C['rxf']),
                 (f0 + 8.5, f0 + 9.5, 'STOP', C['txf'])]
        segs.append((f0 + 9.5, f0 + 10 if f0 == 0 else t1, 'IDLE', C['okf'] if f0 == 0 else C['pale']))
    for a, z, nm, fill in segs:
        b += r(X(a), ys, (z - a) * px, 26, fill, C['line'])
        if (z - a) * px > 30:
            b += t(X(a) + (z - a) * px / 2, ys + 17, nm, 11, C['ink'], 'middle', mono=True)
    b += t(X(0.25), ys + 44, 'START', 10, C['tick'], 'middle', mono=True)
    # d markers at each edge
    for f0, _ in frames:
        b += ln(X(f0), 158, X(f0), ys - 2, C['acc'], 1.4, arrow='end')
        b += t(X(f0) + 4, 210, f'd{1 if f0 == 0 else 2} = 0~1 tick', 10.5, C['acc'], weight='bold')
    # gap annotation
    gy = 290
    b += ln(X(9.5), gy, X(10), gy, C['ok'], 1.6, arrow='both')
    b += ln(X(9.5), ys + 26, X(9.5), gy + 6, C['ok'], 1, '2,2')
    b += ln(X(10), ys + 26, X(10), gy + 6, C['ok'], 1, '2,2')
    b += t(X(9.75), gy + 20, 'IDLE 대기', 11.5, C['ok'], 'middle', 'bold')
    b += t(X(9.75), gy + 36, '8 tick (52.08 µs)', 11.5, C['ok'], 'middle', mono=True)
    # rx_done markers + durations
    by = 360
    for f0, val in frames:
        xd = X(f0 + 9.5)
        b += ln(xd, ys + 26, xd, by - 8, C['tx'], 1.4, arrow='end')
        b += t(xd, by + 6, 'rx_done', 11, C['tx'], 'middle', 'bold', mono=True)
        b += ln(X(f0), by + 26, xd, by + 26, C['ink'], 1.3, arrow='both')
        b += t((X(f0) + xd) / 2, by + 44, 'edge → rx_done = 989.525 µs', 11.5, C['ink'], 'middle', mono=True)
    b += r(24, H - 62, W - 48, 50, C['okf'], C['ok'], 1, 6)
    b += t(36, H - 41, '두 frame 모두 989.525 µs로 동일 (0x41 frame도 동일) → 이전 frame의 지연이 다음 frame으로 넘어가지 않음', 12, C['ok'])
    b += t(36, H - 21, 'STOP을 stop bit 중앙(9.5 bit)에서 끝내서 다음 start edge(10 bit) 전에 IDLE로 복귀', 12, C['ok'])
    return svg(W, H, b)


# ---------------------------------------------------------------- Fig 4
def fig_tx_echo():
    W, H = 980, 540
    lx, px = 190, 1.17           # x of tick 0, px per tick
    b = title(W, '그림 Q3-4. 연속 전송에서 실제로 쌓이는 곳: loopback TX (코드 기준, 속도 차이 4%로 과장)',
              'TX는 frame 하나에 160 tick 사용, tx_start(= rx_done)는 IDLE에서만 확인 · rx_done 간격 = PC frame 간격')

    def X(tk):
        return lx + tk * px
    cases = [('PC = FPGA', '(xsim TB)', 160, C['tick']),
             ('PC가 느림', '(정확한 9600 bps)', 166, C['ok']),
             ('PC가 빠름', '(조금이라도)', 154, C['bad'])]
    y = 84
    # axis
    for tk in range(0, 641, 80):
        b += ln(X(tk), y, X(tk), y + 5, C['sub'], 1)
        b += t(X(tk), y - 3, str(tk), 10.5, C['sub'], 'middle', mono=True)
    b += t(lx - 10, y + 2, 'tick', 10.5, C['sub'], 'end', mono=True)
    y += 20
    for name, sub, period, col in cases:
        b += r(14, y - 4, W - 28, 128, C['pale'], C['grid'], 1, 8)
        b += t(28, y + 22, name, 14, col, weight='bold')
        b += t(28, y + 40, sub, 11.5, C['sub'])
        b += t(lx - 10, y + 64, 'rx_done', 11, C['tx'], 'end', mono=True)
        b += t(lx - 10, y + 98, 'TX', 11, C['tx'], 'end', mono=True)
        tx_free, n, note = 0, 0, ''
        while n * period <= 480:
            rd = n * period
            accepted = rd >= tx_free
            xr = X(rd)
            if accepted:
                b += ln(xr, y + 54, xr, y + 72, C['tx'], 2.4)
                b += r(xr, y + 84, 144 * px, 22, C['txf'], C['tx'], 1)
                b += t(xr + 72 * px, y + 99, 'START + DATA', 10.5, C['tx'], 'middle', mono=True)
                b += r(xr + 144 * px, y + 84, 16 * px, 22, C['tx'], extra='fill-opacity="0.35"')
                b += t(xr + 152 * px, y + 99, 'P', 10.5, C['ink'], 'middle', mono=True)
                b += ln(xr, y + 72, xr, y + 84, C['tx'], 1, '2,2')
                prev_end = rd + 160
                tx_free = rd + 160
            else:
                b += ln(xr, y + 54, xr, y + 72, C['bad'], 2.4)
                b += t(xr, y + 52, '✕', 15, C['bad'], 'middle', 'bold')
                b += ln(xr, y + 74, xr, y + 108, C['bad'], 1.2, '3,2')
            if n > 0 and accepted and name != 'PC가 빠름':
                slack = period - 160
                b += t(xr, y + 122, '여유 0 tick' if slack == 0 else '여유 생김', 10.5, col, 'middle', 'bold')
            n += 1
        if name == 'PC가 빠름':
            b += t(X(154) + 8, y + 22, 'TX가 아직 STOP → tx_start 무시 → 그 byte echo 누락', 11.5, C['bad'], weight='bold')
        y += 138
    b += t(24, H - 12, '실제 차이가 작으면 rx_done 간격이 대부분 160 tick, 가끔 159 tick → 159 tick이 나오는 frame마다 echo 1 byte 누락 '
           '(xsim 미검증, 코드 구조 기준 추론)', 11.5, C['sub'])
    return svg(W, H, b)


figs = {'q3_1_sample_position.svg': fig_sample_position(),
        'q3_2_assumed_vs_actual.svg': fig_assumed_vs_actual(),
        'q3_3_resync_timeline.svg': fig_resync_timeline(),
        'q3_4_tx_echo.svg': fig_tx_echo()}
for name, s in figs.items():
    with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
        f.write(s)
    print(name)
