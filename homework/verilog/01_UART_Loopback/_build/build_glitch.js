// build_glitch.js — tb_uart glitch test: input method, width criteria, xsim result
// usage: node build_glitch.js <out.pptx>     (needs pptxgenjs@3.12.0)
// Coordinates are px on a 1280x720 canvas (px/96 = inch). See diagram_reference.md.
const pptxgen = require('pptxgenjs');
const OUT = process.argv[2] || 'UART_Glitch_Test.pptx';
// ---------- palette / fonts ----------
const KO = '맑은 고딕', MONO = 'Consolas';
const INK = '0F172A', MUTED = '64748B', SUB = '475569', LINE = 'CBD5E1';
const CARD = 'F8FAFC', CARDLINE = 'E2E8F0', WHITE = 'FFFFFF';
const WIRE = '1D4ED8', MARK = 'EA580C', ALERT = 'DC2626';
const MOD = { // module color coding, same on every slide
  rx:   { fill: 'FFF1F2', line: 'BE123C' },
  tx:   { fill: 'EFF6FF', line: '1D4ED8' },
  baud: { fill: 'FEF3C7', line: 'B45309' },
  top:  { fill: 'EEF2FF', line: '4338CA' },
  glue: { fill: 'F1F5F9', line: '475569' },
};
const SEC = { // section number -> [name, accent]
  '01': ['Noise Input', 'B91C1C'],
  '02': ['Width Criteria', '4338CA'],
  '03': ['Result', '0F766E'],
};
const TOTAL = 4;

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in = 1280 x 720 px
pptx.title = 'UART Loopback - Glitch Test';
const px = (v) => v / 96;
// ---------- primitives ----------
function T(s, text, x, y, w, h, o = {}) {
  s.addText(text, {
    x: px(x), y: px(y), w: px(w), h: px(h),
    fontFace: o.font || KO, fontSize: o.size || 12, color: o.color || INK,
    bold: !!o.bold, italic: !!o.italic, align: o.align || 'left', valign: o.valign || 'middle',
    margin: o.margin ?? 0, lineSpacingMultiple: o.ls || 1.0, fill: o.fill ? { color: o.fill } : undefined,
    rotate: o.rotate,
  });
}
function R(s, x, y, w, h, o = {}) {
  const round = o.radius != null;
  s.addShape(round ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x: px(x), y: px(y), w: px(w), h: px(h),
    fill: o.fill ? { color: o.fill } : { type: 'none' },
    line: o.line ? { color: o.line, width: o.lw || 1, dashType: o.dash || 'solid' } : { type: 'none' },
    rectRadius: round ? px(o.radius) : undefined,
  });
}
function seg(s, x1, y1, x2, y2, o = {}) {
  s.addShape(pptx.ShapeType.line, {
    x: px(Math.min(x1, x2)), y: px(Math.min(y1, y2)),
    w: px(Math.abs(x2 - x1)), h: px(Math.abs(y2 - y1)),
    flipH: x2 < x1, flipV: y2 < y1,
    line: {
      color: o.color || INK, width: o.w || 1.25, dashType: o.dash || 'solid',
      endArrowType: o.arrow ? 'triangle' : undefined,
    },
  });
}
function poly(s, pts, o = {}) { // orthogonal polyline, arrow on the last segment only
  for (let i = 0; i < pts.length - 1; i++) {
    seg(s, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], { ...o, arrow: o.arrow && i === pts.length - 2 });
  }
}
function dot(s, x, y, r = 4, color = INK) {
  s.addShape(pptx.ShapeType.ellipse, { x: px(x - r), y: px(y - r), w: px(2 * r), h: px(2 * r), fill: { color }, line: { type: 'none' } });
}
function badge(s, x, y, n, color, d = 26) {
  s.addShape(pptx.ShapeType.ellipse, { x: px(x), y: px(y), w: px(d), h: px(d), fill: { color }, line: { color: WHITE, width: 1.5 } });
  T(s, String(n), x, y, d, d, { font: MONO, size: 11, bold: true, color: WHITE, align: 'center' });
}
function diamond(s, cx, cy, w, h, text, o = {}) {
  s.addShape(pptx.ShapeType.diamond, {
    x: px(cx - w / 2), y: px(cy - h / 2), w: px(w), h: px(h),
    fill: { color: o.fill || WHITE }, line: { color: o.line || INK, width: 1.25 },
  });
  T(s, text, cx - w / 2, cy - h / 2, w, h, { font: MONO, size: o.size || 10, align: 'center', bold: true, color: INK });
}

// ---------- slide chrome ----------
function chrome(s, sec, sub, title, page) {
  const [name, acc] = SEC[sec];
  s.background = { color: WHITE };
  s.addText([
    { text: `${sec}  ·  ${name}`, options: { bold: true, color: acc } },
    { text: `     /     ${sub}`, options: { color: MUTED } },
  ], { x: px(40), y: px(18), w: px(900), h: px(24), fontFace: KO, fontSize: 11, margin: 0, valign: 'middle' });
  T(s, title, 40, 44, 1100, 46, { size: 24, bold: true });
  s.addShape(pptx.ShapeType.ellipse, { x: px(1172), y: px(24), w: px(62), h: px(62), fill: { color: acc }, line: { type: 'none' } });
  T(s, sec, 1172, 24, 62, 62, { font: MONO, size: 18, bold: true, color: WHITE, align: 'center' });
  T(s, '정안성  ·  UART Loopback', 40, 692, 400, 18, { size: 9, color: '94A3B8' });
  T(s, `${page} / ${TOTAL}`, 1140, 692, 100, 18, { size: 9, color: '94A3B8', align: 'right' });
  return acc;
}
function card(s, x, y, w, h, n, head, body, acc) { // numbered explanation card
  R(s, x, y, w, h, { fill: WHITE, line: CARDLINE, radius: 6 });
  badge(s, x + 12, y + (h - 24) / 2, n, acc, 24);
  s.addText([
    { text: head + '   ', options: { bold: true, color: acc, fontFace: MONO } },
    { text: body, options: { color: INK } },
  ], { x: px(x + 46), y: px(y), w: px(w - 56), h: px(h), fontFace: KO, fontSize: 13, margin: 0, valign: 'middle' });
}

// ---------- waveform helpers ----------
const GOOD = '15803D', GOODBG = 'DCFCE7', BADBG = 'FEE2E2';
const RXBAR = 'FECDD3', DATABAR = 'DBEAFE';
function wave(s, X, y, h, changes, t1, o = {}) { // changes: [[t, level], ...], first = start level
  const pts = [];
  changes.forEach(([t, l]) => {
    const yy = l ? y : y + h;
    if (pts.length) pts.push([X(t), pts[pts.length - 1][1]]);
    pts.push([X(t), yy]);
  });
  pts.push([X(t1), pts[pts.length - 1][1]]);
  const clean = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  poly(s, clean, { color: o.color || INK, w: o.w || 2 });
}
function vdash(s, x, y1, y2, color = MARK, w = 1.25) { seg(s, x, y1, x, y2, { color, w, dash: 'dash' }); }
function panel(s, x, y, w, h, head) {
  R(s, x, y, w, h, { fill: CARD, line: CARDLINE, radius: 6 });
  T(s, head, x + 16, y + 10, w - 32, 22, { size: 13, bold: true, color: SUB });
}
function rowLabel(s, text, x, y, w, h, o = {}) {
  T(s, text, x, y, w, h, { font: MONO, size: o.size || 11, bold: o.bold, color: o.color || INK, align: 'left' });
}
function tag(s, text, x, y, w, ok) { // PASS / FAIL style result chip
  R(s, x, y, w, 22, { fill: ok ? GOODBG : BADBG, line: ok ? GOOD : ALERT, lw: 1, radius: 4 });
  T(s, text, x, y, w, 22, { font: MONO, size: 10.5, bold: true, color: ok ? GOOD : ALERT, align: 'center' });
}

// =====================================================================
// 1. single glitch placement (ns zoom + us view)
// =====================================================================
function slidePlacement() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'Single Glitch', 'Glitch Placed On or Off the RX Sampling Edge', 1);

  // ---- panel A: ns zoom around sampling edge E ----
  panel(s, 40, 104, 770, 262, 'ns 확대  ·  sampling edge E 주변 (E = b_tick = 1인 clk edge)');
  const XA = (t) => 190 + (t + 25) * 9.6; // t in ns, -25 .. 35
  const tA1 = 35;
  // 10 ns clk grid
  for (let t = -20; t <= 30; t += 10) seg(s, XA(t), 156, XA(t), 344, { color: LINE, w: 0.75, dash: 'sysDot' });
  vdash(s, XA(0), 154, 344, MARK, 1.5);
  T(s, 'E', XA(0) + 4, 140, 20, 14, { font: MONO, size: 11, bold: true, color: MARK });
  const rowsA = [
    ['clk', 160, [[-25, 0], [-20, 1], [-15, 0], [-10, 1], [-5, 0], [0, 1], [5, 0], [10, 1], [15, 0], [20, 1], [25, 0], [30, 1]], INK],
    ['b_tick', 204, [[-25, 0], [-10, 1], [0, 0]], MOD.baud.line],
    ['rx off-tick', 250, [[-25, 1], [3, 0]], ALERT],
    ['rx on-tick', 296, [[-25, 1], [-8, 0], [12, 1]], ALERT],
  ];
  rowsA.forEach(([name, y, ch, col]) => {
    rowLabel(s, name, 56, y, 120, 26, { bold: true });
    wave(s, XA, y, 26, ch, tA1, { color: col });
  });
  // annotations
  T(s, 'E + 3 ns', XA(3) + 4, 250 - 2, 90, 14, { font: MONO, size: 10, color: ALERT, bold: true });
  T(s, 'E − 8 ns', XA(-8) - 92, 296 - 2, 88, 14, { font: MONO, size: 10, color: ALERT, bold: true, align: 'right' });
  T(s, 'E + 12 ns', XA(12) + 4, 296 - 2, 90, 14, { font: MONO, size: 10, color: ALERT, bold: true });
  T(s, '(w = 20 ns)', XA(12) + 4, 312, 90, 14, { font: MONO, size: 10, color: MUTED });
  T(s, '점선 = clk edge (10 ns 격자)', 560, 340, 240, 18, { size: 10, color: MUTED, align: 'right' });

  // ---- panel B: us view over one tick ----
  panel(s, 40, 380, 770, 292, 'µs 단위  ·  sampling edge 간격 1 tick = 6,510 ns');
  const XB = (t) => 190 + (t + 0.8) * 55; // t in us, -0.8 .. 8.8
  const tB1 = 8.8;
  [[0, 'E0'], [6.51, 'E1']].forEach(([t, n]) => {
    vdash(s, XB(t), 432, 660, MARK, 1.5);
    T(s, n, XB(t) - 20, 416, 40, 14, { font: MONO, size: 11, bold: true, color: MARK, align: 'center' });
  });
  seg(s, XB(0) + 4, 424, XB(6.51) - 4, 424, { color: MARK, w: 1 });
  T(s, '6,510 ns', (XB(0) + XB(6.51)) / 2 - 50, 410, 100, 14, { font: MONO, size: 10, color: MARK, align: 'center', bold: true });
  // b_tick spikes
  rowLabel(s, 'b_tick', 56, 440, 120, 22, { bold: true });
  wave(s, XB, 440, 22, [[-0.8, 0], [-0.04, 1], [0, 0], [6.47, 1], [6.51, 0]], tB1, { color: MOD.baud.line });
  const rowsB = [
    ['off  w=2,000', 486, [[-0.8, 1], [0.003, 0], [2.003, 1]], true, XB(2.003) + 10],
    ['off  w=6,510', 538, [[-0.8, 1], [0.003, 0], [6.513, 1]], false, XB(6.513) + 10],
    ['on   w=2,000', 590, [[-0.8, 1], [5.512, 0], [7.512, 1]], false, XB(7.512) + 10],
  ];
  rowsB.forEach(([name, y, ch, ok, tx]) => {
    rowLabel(s, 'rx ' + name, 56, y, 130, 26, { bold: true, size: 10.5 });
    wave(s, XB, y, 26, ch, tB1, { color: ALERT });
    tag(s, ok ? 'E 안 덮음 · 무시' : 'E1 덮음 · START', tx, y + 2, 130, ok);
  });
  T(s, '폭 단위 ns', 560, 646, 240, 18, { size: 10, color: MUTED, align: 'right' });

  // ---- right: code + cards ----
  R(s, 830, 104, 410, 262, { fill: '0F172A', radius: 6 });
  T(s, [
    { text: 'task align_glitch(width, on_tick);\n', options: { color: 'E2E8F0' } },
    { text: '  @(posedge dut.w_b_tick);          ', options: { color: 'E2E8F0' } },
    { text: '// E - 10 ns\n', options: { color: '94A3B8' } },
    { text: '  if (on_tick) #(5*TICK + 10 - width/2 + 2);\n', options: { color: 'FCA5A5' } },
    { text: '  else         #(10 + 3);           ', options: { color: '86EFAC' } },
    { text: '// E + 3 ns\n', options: { color: '94A3B8' } },
    { text: 'endtask\n\n', options: { color: 'E2E8F0' } },
    { text: 'task sender_glitch(width, num, gap);\n', options: { color: 'E2E8F0' } },
    { text: '  for (k = 0; k < num; k = k + 1) begin\n', options: { color: 'E2E8F0' } },
    { text: '    rx = 0; #(width); rx = 1;\n', options: { color: 'FCA5A5' } },
    { text: '    if (k < num - 1) #(gap);\n', options: { color: 'E2E8F0' } },
    { text: '  end\n', options: { color: 'E2E8F0' } },
    { text: 'endtask', options: { color: 'E2E8F0' } },
  ], 846, 116, 384, 238, { font: MONO, size: 10, valign: 'top', ls: 1.1 });

  card(s, 830, 380, 410, 92, 1, 'off-tick', 'E + 3 ns에서 low 시작\n폭 6,507 ns 미만 → 다음 E 안 덮음', acc);
  card(s, 830, 480, 410, 92, 2, 'on-tick', 'E 중심 + 2 ns에 low 배치\n폭과 무관하게 E 덮음', acc);
  card(s, 830, 580, 410, 92, 3, '+2 / +3 ns', 'rx edge를 clk 격자 밖에 둠\nTB · RTL race 없음', acc);
}

// =====================================================================
// 2. burst + glitch then data
// =====================================================================
function slideBurstData() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'Burst · Glitch + Data', 'Burst Crosses Sampling Edges, Glitch + Data Shows Byte Loss', 2);

  // ---- panel A: burst (us scale, t = 0 at burst start = E0 + 3 ns) ----
  panel(s, 40, 104, 1200, 232, 'Burst (chattering)  ·  off-tick 시작, t = 0 = E0 + 3 ns');
  const XA = (t) => 230 + (t + 0.6) * 50; // us, -0.6 .. 17
  const tA1 = 16.6;
  [[-0.003, 'E0'], [6.507, 'E1'], [13.017, 'E2']].forEach(([t, n]) => {
    vdash(s, XA(t), 156, 320, MARK, 1.5);
    T(s, n, XA(t) + 4, 140, 30, 14, { font: MONO, size: 11, bold: true, color: MARK });
  });
  const burst = (w, n, g) => { const c = [[-0.6, 1]]; for (let k = 0; k < n; k++) { const t0 = k * (w + g) / 1000; c.push([t0, 0], [t0 + w / 1000, 1]); } return c; };
  rowLabel(s, 'A  200 ns × 5', 56, 168, 170, 20, { bold: true });
  rowLabel(s, '   gap 1,000 ns', 56, 188, 170, 20, { color: MUTED, size: 10.5 });
  wave(s, XA, 168, 34, burst(200, 5, 1000), tA1, { color: ALERT });
  T(s, '총 5.0 µs → E0 ~ E1 사이', XA(5.0) + 12, 174, 220, 22, { size: 11, color: SUB });
  tag(s, 'PASS · 무시', 1086, 174, 140, true);

  rowLabel(s, 'B  1,000 ns × 8', 56, 242, 170, 20, { bold: true });
  rowLabel(s, '   gap 1,000 ns', 56, 262, 170, 20, { color: MUTED, size: 10.5 });
  wave(s, XA, 242, 34, burst(1000, 8, 1000), tA1, { color: ALERT });
  R(s, XA(6.0), 238, XA(7.0) - XA(6.0), 42, { line: ALERT, lw: 2, radius: 3 });
  T(s, '4번째 pulse 6,000 ~ 7,000 ns가 E1 (6,507 ns) 덮음', XA(6.0) - 40, 288, 420, 18, { size: 10.5, color: ALERT, bold: true });
  tag(s, 'FAIL · 0xFF 수신', 1086, 248, 140, false);

  // ---- panel B: glitch + data (bit scale, t = 0 at glitch) ----
  panel(s, 40, 350, 1200, 322, 'Glitch + Data  ·  200 ns glitch → gap → 실제 byte, 단위 bit (1 bit = 104,160 ns)');
  const XB = (b) => 250 + (b + 0.3) * 30; // bit, -0.3 .. 23
  for (let b = 0; b <= 22; b += 2) {
    seg(s, XB(b), 410, XB(b), 416, { color: MUTED, w: 0.75 });
    T(s, String(b), XB(b) - 12, 396, 24, 12, { font: MONO, size: 9, color: MUTED, align: 'center' });
  }
  vdash(s, XB(9.5), 416, 660, MARK, 1.25);
  T(s, '9.5 bit: phantom rx_done · IDLE 복귀', XB(9.5) + 4, 416, 260, 14, { size: 9.5, color: MARK, bold: true });
  const rowsB = [
    // label, on-tick, gap(bit), data, phantom2, ok, result
    ['off · gap 1 · 0x55', false, 1, '0x55', false, true, 'rx_done 1 (55)\necho    1 (55)'],
    ['on  · gap 1 · 0x55', true, 1, '0x55', true, false, 'rx_done 2 (last FF)\necho    1 (AA)'],
    ['on  · gap 1 · 0xD5', true, 1, '0xD5', false, false, 'rx_done 1 (AA)\necho    1 (AA)'],
    ['on  · gap 3 · 0x55', true, 3, '0x55', true, false, 'rx_done 2 (last FE)\necho    1 (AB)'],
    ['on  · gap 12 · 0x55', true, 12, '0x55', false, false, 'rx_done 2 (last 55)\necho    2 (last 55)'],
  ];
  rowsB.forEach(([name, on, g, d, ph2, ok, res], i) => {
    const y = 440 + i * 46;
    rowLabel(s, name, 56, y, 190, 24, { bold: true, size: 10.5 });
    // glitch marker
    seg(s, XB(0), y - 2, XB(0), y + 26, { color: ALERT, w: 2.5 });
    if (on) {
      R(s, XB(0), y, XB(9.5) - XB(0), 11, { fill: RXBAR, line: MOD.rx.line, lw: 0.75 });
      T(s, 'phantom RX', XB(0), y, XB(9.5) - XB(0), 11, { font: MONO, size: 8.5, color: MOD.rx.line, align: 'center', bold: true });
    }
    if (ph2) {
      R(s, XB(9.5), y, XB(19.0) - XB(9.5), 11, { fill: RXBAR, line: MOD.rx.line, lw: 0.75, dash: 'dash' });
      T(s, 'phantom RX 2', XB(9.5), y, XB(19.0) - XB(9.5), 11, { font: MONO, size: 8.5, color: MOD.rx.line, align: 'center', bold: true });
    }
    R(s, XB(g), y + 13, XB(g + 10) - XB(g), 11, { fill: DATABAR, line: MOD.tx.line, lw: 0.75 });
    T(s, d + ' frame', XB(g), y + 13, XB(g + 10) - XB(g), 11, { font: MONO, size: 8.5, color: MOD.tx.line, align: 'center', bold: true });
    T(s, res, 960, y - 3, 200, 30, { font: MONO, size: 10, color: ok ? GOOD : ALERT });
    tag(s, ok ? 'PASS' : 'FAIL', 1166, y + 1, 60, ok);
  });
}

// =====================================================================
// 3. width criteria
// =====================================================================
function slideWidth() {
  const s = pptx.addSlide();
  const acc = chrome(s, '02', 'Glitch Width', 'Widths Set by clk, Tick and Half-bit Boundaries', 3);

  // log ruler 10 ns .. 104,160 ns
  const L0 = 1, L1 = Math.log10(104160);
  const X = (w) => 110 + (Math.log10(w) - L0) / (L1 - L0) * 1080;
  const yR = 214;
  R(s, X(10), yR - 10, X(6510) - X(10), 20, { fill: GOODBG });
  R(s, X(6510), yR - 10, X(52080) - X(6510), 20, { fill: 'FEF3C7' });
  R(s, X(52080), yR - 10, X(104160) - X(52080), 20, { fill: 'E2E8F0' });
  T(s, '1 tick 미만 · 위치에 따라 결과 갈림', X(10), yR - 10, X(6510) - X(10), 20, { size: 11, bold: true, color: GOOD, align: 'center' });
  T(s, '1 tick 이상 · 항상 START', X(6510), yR - 10, X(52080) - X(6510), 20, { size: 11, bold: true, color: MOD.baud.line, align: 'center' });
  T(s, 'start bit', X(52080), yR - 10, X(104160) - X(52080), 20, { size: 10, bold: true, color: SUB, align: 'center' });
  [[10, 'clk 10', 'left'], [6510, 'tick 6,510', 'center'], [52080, 'half bit 52,080', 'right'], [104160, 'bit 104,160', 'right']].forEach(([w, n, al]) => {
    seg(s, X(w), yR - 20, X(w), yR + 36, { color: INK, w: 1.75 });
    const x0 = al === 'left' ? X(w) - 4 : w === 104160 ? 1240 - 140 : al === 'right' ? X(w) - 136 : X(w) - 70;
    T(s, n, x0, yR + 38, 140, 16, { font: MONO, size: 10.5, bold: true, align: al });
  });
  [20, 200, 2000, 6000, 6510, 13020, 26040, 50000].forEach((w, i) => {
    dot(s, X(w), yR - 30, 5, ALERT);
    seg(s, X(w), yR - 25, X(w), yR - 10, { color: ALERT, w: 1 });
    T(s, w.toLocaleString('en-US'), X(w) - 40, yR - 52 - (i === 4 ? 14 : 0), 80, 14, { font: MONO, size: 10, bold: true, color: ALERT, align: 'center' });
  });
  T(s, '단위 ns · log scale', 1040, 116, 200, 16, { size: 10, color: MUTED, align: 'right' });

  const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, align: 'center' } });
  const m = (t, o = {}) => ({ text: t, options: o });
  const c = (t, o = {}) => ({ text: t, options: { fontFace: MONO, align: 'center', ...o } });
  const NZ = { color: GOOD, bold: true }, BD = { color: MOD.baud.line, bold: true };
  const rows = [
    ['20', '2 clk', 'RTL sim은 rx를 clk edge(10 ns)에서만 봄 → 10 ns 미만 pulse는 clk edge 사이에 숨을 수 있음 → clk edge를 확실히 덮는 최소 폭', '짧은 noise', NZ],
    ['200', '20 clk', '1 tick 안 10배 간격 sweep', '짧은 noise', NZ],
    ['2,000', '200 clk', '1 tick 안 10배 간격 sweep', '짧은 noise', NZ],
    ['6,000', '1 tick − 510', 'off-tick이 E를 피하는 최대 폭 6,507 ns 바로 아래', '짧은 noise', NZ],
    ['6,510', '1 tick', 'sampling edge 간격과 같은 폭 → 모든 위치에서 E 1개 이상 덮음', '경계 확인', BD],
    ['13,020', '2 tick', 'E 2개 이상 덮음', '경계 확인', BD],
    ['26,040', '4 tick (1/4 bit)', 'RX START 대기 8 tick의 중간', '경계 확인', BD],
    ['50,000', 'half bit 미만', 'half bit 52,080 ns = START 대기 8 tick → START 중앙 재확인 설계가 거를 수 있는 상한 바로 아래 · PASS 기준 상한', '경계 확인', BD],
  ];
  const data = [[H('폭 (ns)'), H('환산'), H('선정 근거'), H('구분')]];
  rows.forEach((r) => data.push([c(r[0], { bold: true }), c(r[1]), m(r[2]), m(r[3], { align: 'center', ...r[4] })]));
  s.addTable(data, {
    x: px(40), y: px(286), w: px(1200), colW: [px(110), px(170), px(780), px(140)],
    rowH: [px(32), ...Array(8).fill(px(44))], fontFace: KO, fontSize: 12, color: INK, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: CARDLINE }, margin: [0, px(10), 0, px(10)],
  });
}

// =====================================================================
// 4. xsim result
// =====================================================================
function slideResult() {
  const s = pptx.addSlide();
  const acc = chrome(s, '03', 'xsim Result', 'Glitch Ignored Only When No Sampling Edge Is Covered', 4);

  const chip = (x, w, head, val, color) => {
    R(s, x, 104, w, 60, { fill: WHITE, line: CARDLINE, radius: 6 });
    T(s, head, x + 16, 110, w - 32, 20, { size: 11, color: MUTED });
    T(s, val, x + 16, 130, w - 32, 28, { font: MONO, size: 17, bold: true, color });
  };
  chip(40, 390, '기존 256 byte loopback', 'pass 256 / fail 0', GOOD);
  chip(445, 390, 'glitch 23 case', 'pass 6 / fail 17', ALERT);
  chip(850, 390, '가짜 byte', '0xFF (line = 1 sampling)', ALERT);

  const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, align: 'center' } });
  const m = (t, o = {}) => ({ text: t, options: o });
  const c = (t, o = {}) => ({ text: t, options: { fontFace: MONO, align: 'center', ...o } });
  const P = c('PASS', { bold: true, color: GOOD, fill: { color: GOODBG } });
  const F = c('FAIL', { bold: true, color: ALERT, fill: { color: BADBG } });
  const rows = [
    ['single', '20 · 200 · 2,000 · 6,000', 'off-tick', '0', '0', P, '4'],
    ['single', '20 · 200 · 2,000 · 6,000', 'on-tick', '1 (FF)', '1 (FF)', F, '4'],
    ['single', '6,510 · 13,020 · 26,040 · 50,000', 'off · on', '1 (FF)', '1 (FF)', F, '8'],
    ['burst', '200 × 5, gap 1,000', 'off-tick', '0', '0', P, '1'],
    ['burst', '1,000 × 8, gap 1,000', 'off-tick', '1 (FF)', '1 (FF)', F, '1'],
    ['glitch + data', '200 → 1 bit → 0x55', 'off-tick', '1 (55)', '1 (55)', P, '1'],
    ['glitch + data', '200 → 1 bit → 0x55', 'on-tick', '2 (last FF)', '1 (AA)', F, '1'],
    ['glitch + data', '200 → 1 bit → 0xD5', 'on-tick', '1 (AA)', '1 (AA)', F, '1'],
    ['glitch + data', '200 → 3 bit → 0x55', 'on-tick', '2 (last FE)', '1 (AB)', F, '1'],
    ['glitch + data', '200 → 12 bit → 0x55', 'on-tick', '2 (last 55)', '2 (last 55)', F, '1'],
  ];
  const data = [[H('입력'), H('폭 (ns) · 조건'), H('위치'), H('rx_done'), H('tx echo'), H('판정'), H('case')]];
  rows.forEach((r) => data.push([m(r[0], { bold: true }), c(r[1]), c(r[2]), c(r[3]), c(r[4]), r[5], c(r[6])]));
  s.addTable(data, {
    x: px(40), y: px(180), w: px(1200), colW: [px(160), px(330), px(130), px(170), px(170), px(120), px(120)],
    rowH: [px(32), ...Array(10).fill(px(44))], fontFace: KO, fontSize: 12, color: INK, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: CARDLINE }, margin: [0, px(10), 0, px(10)],
  });
  T(s, 'Glitch Test Result  ·  xsim 2020.2, tb_uart.v', 40, 662, 600, 18, { size: 10, color: MUTED });
}

// ---------- build ----------
slidePlacement();
slideBurstData();
slideWidth();
slideResult();
pptx.writeFile({ fileName: OUT }).then((f) => console.log('wrote', f));
