// build_edgecases.js — UART Loopback edge case analysis deck
// usage: node build_edgecases.js <out.pptx>     (needs pptxgenjs@3.12.0)
// Coordinates are px on a 1280x720 canvas (px/96 = inch). See diagram_reference.md.
const pptxgen = require('pptxgenjs');
const OUT = process.argv[2] || 'UART_Loopback_EdgeCases.pptx';

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
  '00': ['Overview', '334155'],
  '01': ['RX Input', 'B91C1C'],
  '02': ['Loopback Handshake', 'B45309'],
  '03': ['top_ascii Display', '0F766E'],
  '04': ['Fix Plan', '4338CA'],
};
const TOTAL = 11;

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in = 1280 x 720 px
pptx.title = 'UART Loopback - Edge Case Analysis';
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
function moduleBox(s, x, y, w, h, m, name, inst, extra) {
  R(s, x, y, w, h, { fill: m.fill, line: m.line, lw: 1.75, radius: 6 });
  T(s, name, x, y + h / 2 - 26, w, 24, { font: MONO, size: 15, bold: true, align: 'center' });
  T(s, inst, x, y + h / 2 - 2, w, 18, { font: MONO, size: 10, color: MUTED, align: 'center' });
  if (extra) T(s, extra, x, y + h / 2 + 16, w, 18, { font: MONO, size: 10.5, color: m.line, align: 'center', bold: true });
}
function pin(s, text, x, y, w, align, color = SUB) { // port name printed inside a module edge
  T(s, text, x, y - 9, w, 18, { font: MONO, size: 10.5, color, align });
}
function wireLabel(s, text, x, y, w, align = 'left', color = WIRE) {
  T(s, text, x, y, w, 18, { font: MONO, size: 11, bold: true, color, align });
}

// ---------- timeline helpers (time unit = bit, 1 bit = 16 tick = 104.16 us) ----------
const RXC = { IDLE: 'F1F5F9', START: 'FFE4E6', DATA: 'FECDD3', STOP: 'FDA4AF' };
const TXC = { IDLE: 'F1F5F9', START: 'BFDBFE', DATA: 'DBEAFE', STOP: '93C5FD' };
const GOOD = '15803D', PURPLE = '7C3AED';
function axis(x0, pxb) { return (b) => x0 + b * pxb; }
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
function sbar(s, X, y, h, a, b, label, fill, color, size = 10.5) {
  R(s, X(a), y, X(b) - X(a), h, { fill, line: WHITE, lw: 0.75 });
  if (label && X(b) - X(a) > label.length * 6.5) T(s, label, X(a), y, X(b) - X(a), h, { font: MONO, size, bold: true, align: 'center', color: color || INK });
}
function rxFrame(s, X, y, h, t0, dataLabel) { // START 0.5, DATA 8, STOP 1 (bits) from detection
  sbar(s, X, y, h, t0, t0 + 0.5, '', RXC.START);
  sbar(s, X, y, h, t0 + 0.5, t0 + 8.5, dataLabel, RXC.DATA, MOD.rx.line);
  sbar(s, X, y, h, t0 + 8.5, t0 + 9.5, 'STOP', RXC.STOP, MOD.rx.line, 9.5);
}
function txFrame(s, X, y, h, t0, t1, dataLabel) { // full or clipped TX frame (10 bits)
  const parts = [[0, 1, '', TXC.START], [1, 9, dataLabel, TXC.DATA], [9, 10, 'STOP', TXC.STOP]];
  parts.forEach(([a, b, l, f]) => {
    const A = t0 + a, Bb = Math.min(t0 + b, t1);
    if (Bb > A) sbar(s, X, y, h, A, Bb, l, f, MOD.tx.line, l === 'STOP' ? 9.5 : 10.5);
  });
}
function rowLabel(s, text, y, h, x = 40, w = 110, color = INK) {
  T(s, text, x, y, w, h, { font: MONO, size: 12, bold: true, align: 'right', color });
}
function mark(s, X, t, y1, y2, color, label, ly, lw = 120) {
  seg(s, X(t), y1, X(t), y2, { color, w: 1.5, dash: 'dash' });
  if (label) T(s, label, X(t) - lw / 2, ly, lw, 16, { font: MONO, size: 10, bold: true, color, align: 'center' });
}
function xmark(s, x, y, color = ALERT, d = 20) {
  s.addShape(pptx.ShapeType.ellipse, { x: px(x - d / 2), y: px(y - d / 2), w: px(d), h: px(d), fill: { color }, line: { color: WHITE, width: 1 } });
  T(s, '✕', x - d / 2, y - d / 2, d, d, { size: 10, bold: true, color: WHITE, align: 'center' });
}
function okmark(s, x, y, color = GOOD, d = 20) {
  s.addShape(pptx.ShapeType.ellipse, { x: px(x - d / 2), y: px(y - d / 2), w: px(d), h: px(d), fill: { color }, line: { color: WHITE, width: 1 } });
  T(s, '✓', x - d / 2, y - d / 2, d, d, { size: 10, bold: true, color: WHITE, align: 'center' });
}
function panel(s, x, y, w, h, head, acc) {
  R(s, x, y, w, h, { fill: CARD, line: CARDLINE, radius: 8 });
  if (head) T(s, head, x + 16, y + 8, w - 32, 24, { size: 13, bold: true, color: acc });
}
function tableName(s, text, x, y, acc) { T(s, text, x, y, 600, 22, { size: 13, bold: true, color: acc }); }
const F_41 = [[0, 0], [1, 1], [2, 0], [7, 1], [8, 0], [9, 1]]; // 0x41 frame from start edge (stop = 1)

// =====================================================================
// 1. Cover
// =====================================================================
function slideCover() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  R(s, 0, 0, 520, 720, { fill: INK });
  T(s, 'VERILOG  ·  TEAM PROJECT 02', 56, 150, 420, 24, { size: 12, bold: true, color: 'FCA5A5' });
  T(s, 'UART Loopback', 56, 190, 440, 60, { size: 36, bold: true, color: WHITE });
  T(s, 'Edge Case Analysis', 56, 252, 440, 36, { size: 18, color: 'CBD5E1' });
  // frame motif with a glitch before the start bit
  const x0 = 56, bw = 30, hi = 360, lo = 392;
  const lv = [1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1];
  const pts = [[x0, hi], [x0 + 14, hi], [x0 + 14, lo], [x0 + 20, lo], [x0 + 20, hi]];
  lv.forEach((b, i) => { if (i === 0) return; pts.push([x0 + i * bw, pts[pts.length - 1][1]]); pts.push([x0 + i * bw, b ? hi : lo]); });
  pts.push([x0 + lv.length * bw, hi]);
  poly(s, pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]), { color: 'FCA5A5', w: 2.25 });
  T(s, 'glitch  ·  framing  ·  break  ·  baud  ·  async', 56, 424, 440, 20, { font: MONO, size: 11, color: '94A3B8' });
  T(s, '정안성', 56, 620, 300, 24, { size: 14, color: WHITE, bold: true });

  T(s, 'Contents', 600, 92, 400, 36, { size: 22, bold: true });
  const rows = [
    ['00', 'Overview', 'Edge Case Map', '2'],
    ['01', 'RX Input', 'Check Points  ·  Glitch  ·  Framing / Break  ·  Baud  ·  Async', '3 – 7'],
    ['02', 'Loopback Handshake', 'Back-to-Back Echo  ·  rx_data Valid Window', '8 – 9'],
    ['03', 'top_ascii Display', 'Non-Hex Byte on FND', '10'],
    ['04', 'Fix Plan', 'RTL Change Map', '11'],
  ];
  rows.forEach(([n, name, sub, pg], i) => {
    const y = 150 + i * 98, acc = SEC[n][1];
    T(s, n, 600, y, 70, 52, { font: MONO, size: 30, bold: true, color: acc });
    T(s, name, 680, y, 420, 30, { size: 17, bold: true });
    T(s, sub, 680, y + 30, 520, 24, { size: 12, color: MUTED });
    T(s, 'p. ' + pg, 1120, y, 100, 30, { font: MONO, size: 12, color: MUTED, align: 'right' });
    seg(s, 600, y + 74, 1220, y + 74, { color: CARDLINE, w: 1 });
  });
}

// =====================================================================
// 2. Edge case map
// =====================================================================
function slideMap() {
  const s = pptx.addSlide();
  const acc = chrome(s, '00', 'Edge Case Map', '9 Edge Cases, None Raises an Error Signal', 2);
  tableName(s, 'Edge Case Map', 40, 100, acc);
  const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, align: 'center' } });
  const id = (t, c) => ({ text: t, options: { fontFace: MONO, bold: true, color: WHITE, fill: { color: c }, align: 'center' } });
  const m = (t, o = {}) => ({ text: t, options: o });
  const RX = SEC['01'][1], HS = SEC['02'][1], DP = SEC['03'][1];
  const rows = [
    ['E1', RX, 'Glitch false start', 'IDLE b_tick 순간 rx = 0\n(1 tick 미만 glitch는 b_tick과 겹칠 때만)', '0xFF byte 수신 · TX echo 0xFF · FND "0" 추가', '코드 분석', '4'],
    ['E2', RX, 'Framing error', 'stop bit = 0', 'byte 정상 처리 + 9.56 bit 시점 false start\n→ phantom 0xFF (echo 없음, FND만 추가)', '코드 분석', '5'],
    ['E3', RX, 'Break', 'rx = 0 유지', '0x00 반복 수신 (996 µs 간격) · echo 2개 중 1개', '코드 분석', '5'],
    ['E4', RX, 'Baud mismatch', 'PC bit 길이 −4.87% 미만 / +6.24% 초과', '옆 bit sampling → bit 오판독, rx_done 정상 발생', '계산', '6'],
    ['E5', RX, 'Async rx', 'b_tick clock edge와 rx edge 겹침', 'metastability · c_state FF 불일치 → 정의되지 않은 state', '코드 분석', '7'],
    ['E6', RX, 'Reset release', 'rst 해제 순간 rx = 0 (frame 중간)', '중간 bit를 start로 처리 → garbage byte, 원래 byte 손실', '코드 분석', '4'],
    ['E7', HS, 'Back-to-back echo', 'PC 실제 속도 > 9600.61 bps + 연속 전송', 'rx_done이 TX STOP 중 도착 → echo 누락', 'xsim (여유 0 tick)', '8'],
    ['E8', HS, 'rx_data valid window', 'rx_done 이후 rx_data 사용', '수신 중 shift 값 노출 (00 → 80 → … → 41)', 'xsim', '9'],
    ['E9', DP, 'Non-hex byte', "'0'~'9', 'A'~'F', 'a'~'f' 외 문자 (CR, LF 포함)", 'FND "0" 표시 → 실제 "0"과 구분 불가', '코드 분석', '10'],
  ];
  const data = [[H('ID'), H('Case'), H('발생 조건'), H('결과'), H('근거'), H('p.')]];
  rows.forEach((r) => data.push([id(r[0], r[1]), m(r[2], { bold: true }), m(r[3]), m(r[4]), m(r[5], { align: 'center' }), m(r[6], { fontFace: MONO, align: 'center' })]));
  s.addTable(data, {
    x: px(40), y: px(130), w: px(1200), colW: [px(60), px(190), px(360), px(410), px(120), px(60)],
    rowH: [px(34), ...Array(9).fill(px(57))], fontFace: KO, fontSize: 12, color: INK, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: CARDLINE }, margin: [0, px(10), 0, px(10)],
  });
}

// =====================================================================
// 3. RX check points (root cause of E1 / E2 / E3 / E6)
// =====================================================================
function slideCheckPoints() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'uart_rx Check Points', 'uart_rx Checks Only the Start Edge and 8 Data Centers', 3);
  panel(s, 40, 100, 1200, 300, '0x41 frame  ·  rx를 실제로 확인하는 시점', acc);
  const X = axis(210, 95);
  const names = ['S', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'P'];
  names.forEach((n, i) => {
    seg(s, X(i), 146, X(i), 330, { color: CARDLINE, w: 0.75, dash: 'dash' });
    T(s, n, X(i), 140, 95, 18, { font: MONO, size: 11, bold: true, color: i === 0 || i === 9 ? MOD.rx.line : SUB, align: 'center' });
  });
  seg(s, X(10), 146, X(10), 330, { color: CARDLINE, w: 0.75, dash: 'dash' });
  rowLabel(s, 'rx', 166, 34);
  wave(s, X, 166, 34, [[-0.6, 1], ...F_41], 10.6, { color: MOD.rx.line, w: 2.25 });
  // check markers
  rowLabel(s, '확인', 224, 24, 40, 110, SUB);
  okmark(s, X(0), 236, GOOD);
  T(s, 'edge 검출', X(0) - 70, 252, 70, 16, { size: 10, bold: true, color: GOOD, align: 'right' });
  xmark(s, X(0.5), 236);
  T(s, '재확인 없음', X(0.5) - 40, 252, 80, 16, { size: 10, bold: true, color: ALERT, align: 'center' });
  for (let k = 1; k <= 8; k++) { okmark(s, X(k + 0.5), 236, PURPLE); }
  T(s, 'D0 ~ D7 중앙 sampling 8회', X(1.5), 252, X(8.5) - X(1.5), 16, { size: 10, bold: true, color: PURPLE, align: 'center' });
  xmark(s, X(9.5), 236);
  T(s, 'stop 확인 없음', X(9.5) - 50, 252, 100, 16, { size: 10, bold: true, color: ALERT, align: 'center' });
  // state bar
  rowLabel(s, 'uart_rx', 290, 30);
  sbar(s, X, 290, 30, -0.6, 0, 'IDLE', RXC.IDLE, MOD.rx.line);
  sbar(s, X, 290, 30, 0, 0.5, '', RXC.START);
  sbar(s, X, 290, 30, 0.5, 8.5, 'DATA  ·  128 tick', RXC.DATA, MOD.rx.line);
  sbar(s, X, 290, 30, 8.5, 9.5, 'STOP', RXC.STOP, MOD.rx.line);
  sbar(s, X, 290, 30, 9.5, 10.6, 'IDLE', RXC.IDLE, MOD.rx.line);
  T(s, 'START 8 tick', X(0) - 30, 324, 110, 16, { font: MONO, size: 10, color: MOD.rx.line });
  T(s, 'STOP 16 tick', X(8.5), 324, 95, 16, { font: MONO, size: 10, color: MOD.rx.line, align: 'center' });
  mark(s, X, 9.5, 280, 372, ALERT, 'IDLE 복귀 = 9.5 bit', 374, 160);

  card(s, 40, 414, 1200, 82, 1, 'START 중앙', 'rx 재확인 없음 → glitch · reset 해제 순간의 0도 frame 시작으로 처리  (E1 · E6)', acc);
  card(s, 40, 506, 1200, 82, 2, 'STOP 중앙', 'rx = 1 확인 없음 → stop bit = 0인 frame도 rx_done 발생, error flag 없음  (E2 · E3)', acc);
  card(s, 40, 598, 1200, 82, 3, 'IDLE 복귀 시점', 'stop bit 중앙(9.5 bit)에서 IDLE 복귀 → line이 아직 0일 경우 다음 b_tick에 곧바로 START  (E2 phantom byte · E3 0x00 반복)', acc);
}

// =====================================================================
// 4. E1 glitch false start (+ E6 reset release)
// =====================================================================
function slideGlitch() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'E1 Glitch False Start', 'A Glitch Caught by a b_tick Becomes a 0xFF Byte', 4);
  panel(s, 40, 100, 1200, 292, 'E1  ·  1 tick 이상 glitch 1개 → frame 1개로 처리', acc);
  const X = axis(170, 50);
  rowLabel(s, 'rx', 140, 28);
  wave(s, X, 140, 28, [[-0.4, 1], [0, 0], [0.16, 1]], 20.6, { color: MOD.rx.line, w: 2.25 });
  T(s, 'glitch', X(0.2), 132, 60, 16, { font: MONO, size: 10, bold: true, color: ALERT });
  for (let k = 1; k <= 8; k++) dot(s, X(k + 0.5), 140, 4, PURPLE);
  T(s, 'sampling 8회 모두 1', X(1.5), 112 + 60, X(8.5) - X(1.5), 16, { size: 10, bold: true, color: PURPLE, align: 'center' });
  rowLabel(s, 'uart_rx', 196, 28);
  sbar(s, X, 196, 28, -0.4, 0, '', RXC.IDLE);
  rxFrame(s, X, 196, 28, 0, 'DATA  (rx = 1 × 8)');
  sbar(s, X, 196, 28, 9.5, 20.6, 'IDLE', RXC.IDLE, MOD.rx.line);
  rowLabel(s, 'rx_done', 240, 24);
  mark(s, X, 9.5, 192, 330, ALERT, '', 0);
  T(s, 'rx_data = 0xFF', X(9.5) + 6, 240, 160, 24, { font: MONO, size: 12, bold: true, color: ALERT });
  rowLabel(s, 'uart_tx', 284, 28);
  sbar(s, X, 284, 28, -0.4, 9.5, 'IDLE', TXC.IDLE, MOD.tx.line);
  txFrame(s, X, 284, 28, 9.5, 20.6, 'echo 0xFF');
  rowLabel(s, 'tx', 330, 28);
  wave(s, X, 330, 28, [[-0.4, 1], [9.5, 0], [10.5, 1]], 20.6, { color: MOD.tx.line, w: 2.25 });
  T(s, 'start bit 뒤 8 bit 모두 1', X(10.7), 340, 260, 18, { size: 10.5, bold: true, color: MOD.tx.line });

  // inset: glitch shorter than 1 tick
  panel(s, 40, 406, 590, 274, 'glitch 폭 < 1 tick  ·  b_tick 순간과 겹칠 때만 검출', acc);
  const U = (us) => 150 + us * 17;
  rowLabel(s, 'b_tick', 456, 26, 40, 96);
  [0, 6.51, 13.02, 19.53, 26.04].forEach((t) => {
    poly(s, [[U(t) - 3, 482], [U(t) - 3, 458], [U(t) + 3, 458], [U(t) + 3, 482]], { color: MOD.baud.line, w: 1.75 });
    seg(s, U(t), 486, U(t), 576, { color: MOD.baud.line, w: 1, dash: 'dash' });
  });
  seg(s, U(-0.5), 482, U(27), 482, { color: MOD.baud.line, w: 1.75 });
  rowLabel(s, 'rx', 520, 30, 40, 96);
  wave(s, U, 520, 30, [[-0.5, 1], [5.5, 0], [7.5, 1], [15.5, 0], [17.5, 1]], 27, { color: MOD.rx.line, w: 2.25 });
  T(s, '겹침 → START', U(6.5) - 60, 584, 120, 18, { size: 11, bold: true, color: ALERT, align: 'center' });
  T(s, '사이 → 무시', U(16.5) - 60, 584, 120, 18, { size: 11, bold: true, color: GOOD, align: 'center' });
  T(s, '6.51 µs', U(6.51), 610, U(13.02) - U(6.51), 16, { font: MONO, size: 10, color: MOD.baud.line, align: 'center' });
  seg(s, U(6.51), 628, U(13.02), 628, { color: MOD.baud.line, w: 1 });
  T(s, '검출 확률 = glitch 폭 ÷ 6.51 µs', 60, 644, 540, 24, { size: 13, bold: true, color: INK });

  card(s, 646, 406, 594, 86, 1, 'false start', 'IDLE은 b_tick 순간 rx = 0만 확인, START 중앙 재확인 없음 → glitch 1개로 frame 시작', acc);
  card(s, 646, 500, 594, 86, 2, '결과', 'line = 1 상태로 8 bit sampling → 0xFF + rx_done → TX echo 0xFF, FND "0" 추가 (p.10)', acc);
  card(s, 646, 594, 594, 86, 3, 'E6 reset 해제', 'rst 해제 순간 frame 중간 bit = 0일 경우 같은 경로로 START → garbage byte, 원래 byte 손실', acc);
}

// =====================================================================
// 5. E2 framing error / E3 break
// =====================================================================
function slideFraming() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'E2 Framing Error  ·  E3 Break', 'Stop Bit 0 Adds a Phantom Byte, Break Repeats 0x00 Every 996 µs', 5);
  const X = axis(170, 35.5);
  const ticks = (y) => [0, 5, 10, 15, 20, 25, 30].forEach((b) => T(s, b + ' bit', X(b) - 25, y, 50, 14, { font: MONO, size: 9, color: MUTED, align: 'center' }));
  // ---- E2 ----
  panel(s, 40, 100, 1200, 284, 'E2  ·  stop bit = 0 (0x41) → 0x41 정상 처리 + 9.56 bit 시점 false start → phantom 0xFF', acc);
  R(s, X(9), 134, X(10) - X(9), 236, { fill: 'FEE2E2' });
  T(s, 'stop = 0', X(9) - 10, 134, X(10) - X(9) + 20, 16, { font: MONO, size: 9.5, bold: true, color: ALERT, align: 'center' });
  rowLabel(s, 'rx', 154, 26);
  wave(s, X, 154, 26, [[-0.3, 1], [0, 0], [1, 1], [2, 0], [7, 1], [8, 0], [10, 1]], 30.5, { color: MOD.rx.line, w: 2.25 });
  rowLabel(s, 'uart_rx', 198, 26);
  rxFrame(s, X, 198, 26, 0, 'DATA 0x41');
  rxFrame(s, X, 198, 26, 9.5625, 'DATA (rx = 1 × 8)');
  sbar(s, X, 198, 26, 19.0625, 30.5, 'IDLE', RXC.IDLE, MOD.rx.line);
  rowLabel(s, 'rx_done', 240, 24);
  mark(s, X, 9.5, 194, 330, GOOD, '', 0);
  T(s, '0x41', X(9.5) + 4, 240, 60, 24, { font: MONO, size: 12, bold: true, color: GOOD });
  mark(s, X, 19.0625, 194, 330, ALERT, '', 0);
  T(s, '0xFF (phantom)', X(19.0625) + 4, 240, 160, 24, { font: MONO, size: 12, bold: true, color: ALERT });
  rowLabel(s, 'uart_tx', 282, 26);
  sbar(s, X, 282, 26, -0.3, 9.5, 'IDLE', TXC.IDLE, MOD.tx.line);
  txFrame(s, X, 282, 26, 9.5, 30.5, 'echo 0x41');
  sbar(s, X, 282, 26, 19.5, 30.5, 'IDLE', TXC.IDLE, MOD.tx.line);
  xmark(s, X(19.0625), 336);
  T(s, 'TX STOP 중 → tx_start 무시 → phantom은 echo 없음, FND에만 추가', X(19.0625) + 16, 326, 600, 20, { size: 11, bold: true, color: ALERT });
  ticks(352 + 10);

  // ---- E3 ----
  panel(s, 40, 396, 1200, 284, 'E3  ·  break (rx = 0 유지) → 0x00 frame이 153 tick(996 µs)마다 반복, TX는 2개 중 1개만 echo', acc);
  rowLabel(s, 'rx', 446, 26);
  wave(s, X, 446, 26, [[-0.3, 1], [0, 0]], 30.5, { color: MOD.rx.line, w: 2.25 });
  T(s, 'rx = 0 유지', X(12), 426, 200, 18, { font: MONO, size: 10, bold: true, color: MOD.rx.line });
  rowLabel(s, 'uart_rx', 490, 26);
  [0, 9.5625, 19.125].forEach((t) => rxFrame(s, X, 490, 26, t, 'DATA 0x00'));
  sbar(s, X, 490, 26, 28.6875, 29.1875, '', RXC.START);
  sbar(s, X, 490, 26, 29.1875, 30.5, '', RXC.DATA);
  rowLabel(s, 'rx_done', 532, 24);
  [[9.5, GOOD], [19.0625, ALERT], [28.625, GOOD]].forEach(([t, c]) => {
    mark(s, X, t, 486, 622, c, '', 0);
    T(s, '0x00', X(t) + 4, 532, 50, 24, { font: MONO, size: 12, bold: true, color: c });
  });
  rowLabel(s, 'uart_tx', 574, 26);
  sbar(s, X, 574, 26, -0.3, 9.5, 'IDLE', TXC.IDLE, MOD.tx.line);
  txFrame(s, X, 574, 26, 9.5, 30.5, 'echo 0x00');
  sbar(s, X, 574, 26, 19.5, 28.625, 'IDLE', TXC.IDLE, MOD.tx.line);
  txFrame(s, X, 574, 26, 28.625, 30.5, '');
  xmark(s, X(19.0625), 628);
  T(s, 'RX 주기 153 tick < TX frame 160 tick → 2번째마다 TX STOP 중 도착', X(19.0625) + 16, 618, 600, 20, { size: 11, bold: true, color: ALERT });
  ticks(652);
}

// =====================================================================
// 6. E4 baud mismatch tolerance
// =====================================================================
function slideBaud() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'E4 Baud Mismatch', 'RX Accepts −4.87% to +6.24% Bit Length, Then Misreads Silently', 6);
  // derivation chain
  const steps = [
    ['D7 sample 시점', 'start edge 후 8.5 bit + d   (d = 검출 지연 0 ~ 1 tick)'],
    ['정상 조건', '송신 D7 구간  [ 8·Ts , 9·Ts )  안에서 sampling'],
    ['빠른 송신 한계  (d = 1 tick)', '8.5 × 104.16 + 6.51 < 9·Ts  →  Ts > 99.10 µs'],
    ['느린 송신 한계  (d = 0)', '8.5 × 104.16 ≥ 8·Ts  →  Ts ≤ 110.67 µs'],
  ];
  steps.forEach(([h, b], i) => {
    const y = 104 + i * 92;
    R(s, 40, y, 580, 78, { fill: WHITE, line: CARDLINE, radius: 6 });
    badge(s, 52, y + 27, i + 1, acc, 24);
    T(s, h, 88, y + 8, 520, 24, { size: 13, bold: true, color: acc });
    T(s, b, 88, y + 36, 520, 30, { font: MONO, size: 12.5 });
    if (i < 3) seg(s, 330, y + 78, 330, y + 92, { color: acc, w: 1.5, arrow: true });
  });
  // number line
  panel(s, 640, 104, 600, 354, 'PC bit 길이 변화  (9600 bps = 104.17 µs 기준)', acc);
  const P = (pct) => 940 + pct * 33;
  const yL = 270;
  R(s, P(-8.5), yL - 18, P(-4.87) - P(-8.5), 36, { fill: 'FEE2E2' });
  R(s, P(-4.87), yL - 18, P(6.24) - P(-4.87), 36, { fill: 'DCFCE7' });
  R(s, P(6.24), yL - 18, P(8.5) - P(6.24), 36, { fill: 'FEE2E2' });
  T(s, '정상 수신', P(-4.87), yL - 18, P(6.24) - P(-4.87), 36, { size: 13, bold: true, color: GOOD, align: 'center' });
  T(s, '오판독', P(-8.5), yL - 18, P(-4.87) - P(-8.5), 36, { size: 11, bold: true, color: ALERT, align: 'center' });
  T(s, '오판독', P(6.24), yL - 18, P(8.5) - P(6.24), 36, { size: 11, bold: true, color: ALERT, align: 'center' });
  seg(s, P(-8.5), yL + 30, P(8.5), yL + 30, { color: SUB, w: 1 });
  [-8, -6, -4, -2, 0, 2, 4, 6, 8].forEach((v) => {
    seg(s, P(v), yL + 26, P(v), yL + 34, { color: SUB, w: 1 });
    T(s, (v > 0 ? '+' : '') + v + '%', P(v) - 24, yL + 38, 48, 16, { font: MONO, size: 10, color: SUB, align: 'center' });
  });
  [[-4.87, '−4.87%', '99.10 µs', '빠른 송신'], [6.24, '+6.24%', '110.67 µs', '느린 송신']].forEach(([v, a, b, c]) => {
    seg(s, P(v), yL - 60, P(v), yL + 20, { color: ALERT, w: 1.5, dash: 'dash' });
    T(s, a, P(v) - 50, yL - 94, 100, 18, { font: MONO, size: 13, bold: true, color: ALERT, align: 'center' });
    T(s, b + '  ·  ' + c, P(v) - 80, yL - 74, 160, 16, { font: MONO, size: 10, color: SUB, align: 'center' });
  });
  seg(s, P(0.0064), yL + 64, P(0.0064), yL + 22, { color: INK, w: 1.5, arrow: true });
  T(s, 'FPGA 9600.61 bps  (bit −0.0064%)', P(0) - 150, yL + 68, 300, 18, { font: MONO, size: 11, bold: true, color: INK, align: 'center' });
  T(s, 'd 위치에 따른 한계 변동 :  빠른 쪽 d = 0 → −5.56%  ·  느린 쪽 d = 1 tick → +7.02%', 656, 400, 570, 40, { size: 11.5, color: INK });

  card(s, 40, 478, 1200, 62, 1, '한계 밖', '옆 bit 값을 sampling, rx_done은 정상 발생 → 오류 표시 없음, 출력 byte만 틀림', acc);
  card(s, 40, 548, 1200, 62, 2, '숨는 오판독', '인접 bit 값이 같을 경우 결과 byte 동일 → 0x55 같은 교번 pattern에서만 드러남', acc);
  card(s, 40, 618, 1200, 62, 3, '현재 오차', 'FPGA 분주 반올림 +0.0064% → D7까지 누적 0.05% bit, 한계까지 여유 충분 → PC 측 clock 오차가 지배', acc);
}

// =====================================================================
// 7. E5 async rx
// =====================================================================
function slideAsync() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'E5 Async rx', 'rx Feeds Several FSM Flip-Flops Without a Synchronizer', 7);
  // ---- structure ----
  panel(s, 40, 100, 590, 360, 'rx 경로  ·  synchronizer 없이 next-state logic 직결', acc);
  T(s, 'rx', 56, 262, 50, 30, { font: MONO, size: 15, bold: true, color: MOD.rx.line });
  seg(s, 90, 277, 170, 277, { color: WIRE, w: 2, arrow: true });
  R(s, 170, 222, 140, 110, { fill: MOD.glue.fill, line: MOD.glue.line, lw: 1.5, radius: 6 });
  T(s, 'next-state\nlogic', 170, 222, 140, 110, { font: MONO, size: 12.5, bold: true, align: 'center' });
  const ffs = [['c_state  bit A', 160, '경로 짧음'], ['c_state  bit B', 252, '경로 김'], ['c_state  bit C', 344, '']];
  ffs.forEach(([n, y, d], i) => {
    poly(s, [[310, 277], [350, 277], [350, y + 26], [430, y + 26]], { color: WIRE, w: 1.75, arrow: true });
    R(s, 430, y, 170, 52, { fill: MOD.rx.fill, line: MOD.rx.line, lw: 1.5, radius: 4 });
    T(s, n, 430, y, 170, 52, { font: MONO, size: 12, bold: true, align: 'center' });
    if (d) T(s, d, 352, y + 6, 76, 16, { size: 9.5, color: MUTED, align: 'center' });
  });
  dot(s, 350, 277, 4, WIRE);
  seg(s, 515, 430, 515, 396, { color: INK, w: 1.5 });
  poly(s, [[400, 430], [620, 430]], { color: INK, w: 1.5 });
  T(s, 'clk (공통)', 400, 434, 200, 18, { font: MONO, size: 11, color: INK });
  [160, 252, 344].forEach((y) => seg(s, 590, 430, 590, y + 52, { color: INK, w: 1, dash: 'dash' }));

  // ---- timing ----
  panel(s, 650, 100, 590, 360, 'clock edge 1개 · FF마다 다른 결과', acc);
  const ex = 900;
  R(s, ex - 22, 140, 44, 290, { fill: 'FEF3C7' });
  T(s, 'setup / hold', ex - 60, 432, 120, 16, { size: 10, bold: true, color: MOD.baud.line, align: 'center' });
  rowLabel(s, 'clk', 150, 30, 660, 90);
  poly(s, [[760, 180], [ex, 180], [ex, 150], [1060, 150], [1060, 180], [1220, 180]], { color: INK, w: 2 });
  rowLabel(s, 'rx', 210, 30, 660, 90);
  poly(s, [[760, 210], [ex + 6, 210], [ex + 6, 240], [1220, 240]], { color: MOD.rx.line, w: 2.25 });
  rowLabel(s, 'bit A', 276, 30, 660, 90);
  poly(s, [[760, 306], [ex + 30, 306], [ex + 30, 276], [1220, 276]], { color: INK, w: 2 });
  T(s, '1  (START)', 1100, 256, 120, 18, { font: MONO, size: 11, bold: true, color: INK });
  rowLabel(s, 'bit B', 326, 30, 660, 90);
  poly(s, [[760, 356], [1220, 356]], { color: INK, w: 2 });
  T(s, '0  (IDLE 유지)', 1080, 334, 140, 18, { font: MONO, size: 11, bold: true, color: INK });
  rowLabel(s, 'bit C', 376, 30, 660, 90);
  poly(s, [[760, 406], [ex + 30, 406], [ex + 30, 391], [1010, 391], [1010, 376], [1220, 376]], { color: ALERT, w: 2 });
  T(s, '중간 전압 후 늦게 결정', 960, 410, 220, 16, { size: 10, bold: true, color: ALERT });
  T(s, 'A · B 불일치 → IDLE ~ STOP 어디에도 없는 state 값', 670, 108 + 24, 560, 16, { size: 11, bold: true, color: ALERT });

  card(s, 40, 474, 594, 100, 1, '발생 시점', 'IDLE에서 b_tick = 1인 clock edge와 rx falling edge가 겹칠 때 (위험 edge = 6.51 µs마다 1개)', acc);
  card(s, 646, 474, 594, 100, 2, '결과', 'case default 없음 + n_state 기본값 = c_state → 정의되지 않은 state가 reset까지 유지 가능 (Vivado FSM encoding에 따라 다름)', acc);
  card(s, 40, 582, 594, 100, 3, 'sim 한계', 'RTL sim은 0 / 1만 표현 → xsim 재현 불가, 보드에서 드문 간헐 고장으로만 발생', acc);
  card(s, 646, 582, 594, 100, 4, '해결', '2-FF synchronizer + ASYNC_REG → rx가 FF 1개로만 진입, 지연 20 ns (1 tick 6.51 µs 대비 무시 수준)', acc);
}

// =====================================================================
// 8. E7 back-to-back echo drop
// =====================================================================
function slideBackToBack() {
  const s = pptx.addSlide();
  const acc = chrome(s, '02', 'E7 Back-to-Back Echo', 'Echo Drops When the PC Runs Faster Than 9600.61 bps', 8);
  const W = 280, STOPW = 28, X0 = 330;
  const lanes = [
    ['PC = FPGA', 'xsim TB  ·  104.16 µs', 280, '여유 0 tick', MOD.baud.line],
    ['PC 느림', '9600.00 bps', 302, '여유 증가', GOOD],
    ['PC 빠름', '> 9600.61 bps', 262, '', ALERT],
  ];
  lanes.forEach(([name, sub, per, gapLabel, col], li) => {
    const y = 100 + li * 132;
    panel(s, 40, y, 1200, 120, '', acc);
    T(s, name, 56, y + 24, 230, 26, { size: 15, bold: true, color: col });
    T(s, sub, 56, y + 52, 230, 20, { font: MONO, size: 11, color: SUB });
    T(s, 'rx_done', 220, y + 20, 100, 20, { font: MONO, size: 11, color: MOD.rx.line, align: 'right' });
    T(s, 'uart_tx', 220, y + 70, 100, 24, { font: MONO, size: 11, color: MOD.tx.line, align: 'right' });
    let free = 0;
    for (let k = 0; X0 + k * per <= X0 + 3 * W + 10; k++) {
      const x = X0 + k * per;
      const ok = x >= free;
      seg(s, x, y + 14, x, y + 44, { color: ok ? MOD.rx.line : ALERT, w: 2.5 });
      if (ok) {
        const w = Math.min(W, 1224 - x);
        R(s, x, y + 66, Math.min(W - STOPW, w), 30, { fill: TXC.DATA, line: MOD.tx.line, lw: 1 });
        T(s, 'START + DATA', x, y + 66, Math.min(W - STOPW, w), 30, { font: MONO, size: 10.5, bold: true, color: MOD.tx.line, align: 'center' });
        if (w > W - STOPW) { R(s, x + W - STOPW, y + 66, Math.min(STOPW, w - (W - STOPW)), 30, { fill: TXC.STOP, line: MOD.tx.line, lw: 1 }); T(s, 'P', x + W - STOPW, y + 66, STOPW, 30, { font: MONO, size: 10, bold: true, align: 'center' }); }
        seg(s, x, y + 44, x, y + 66, { color: MOD.tx.line, w: 1, dash: 'dash' });
        if (k > 0 && gapLabel) T(s, gapLabel, x - 60, y + 98, 120, 18, { size: 10.5, bold: true, color: col, align: 'center' });
        free = x + W;
      } else {
        xmark(s, x, y + 54, ALERT, 18);
        T(s, 'TX STOP 중 → 무시', x + 12, y + 14, 160, 18, { size: 11, bold: true, color: ALERT });
      }
    }
  });
  T(s, '← 160 tick →', X0, 100 + 2, W, 14, { font: MONO, size: 9.5, color: MOD.tx.line, align: 'center' });
  card(s, 40, 500, 1200, 56, 1, 'TX 고정 길이', 'TX frame = 160 tick, rx_done 간격 = PC frame 길이 10 × Ts → 두 값 차이가 frame마다 누적', acc);
  card(s, 40, 562, 1200, 56, 2, 'xsim 여유 0', 'TB bit = FPGA bit (104.16 µs) → TX IDLE 복귀와 2번째 rx_done 동일 edge 4,426,825 ns', acc);
  card(s, 40, 624, 1200, 56, 3, 'echo 누락', 'PC가 빠를 경우 누적 차이 1 tick 도달 시점에 rx_done이 TX STOP 중 도착 → tx_start 무시 (tx_busy 미연결, buffer 없음)', acc);
}

// =====================================================================
// 9. E8 rx_data valid window
// =====================================================================
function slideRxData() {
  const s = pptx.addSlide();
  const acc = chrome(s, '02', 'E8 rx_data Valid Window', 'rx_data Is Valid Only at the 10 ns rx_done Pulse', 9);
  panel(s, 40, 100, 1200, 300, '0x41 수신 중 o_rx_data  (xsim, 시간 = rx fall 기준 µs)', acc);
  const X = axis(210, 95);
  rowLabel(s, 'rx', 146, 28);
  wave(s, X, 146, 28, [[-0.6, 1], ...F_41], 10.6, { color: MOD.rx.line, w: 2.25 });
  rowLabel(s, 'uart_rx', 196, 28);
  sbar(s, X, 196, 28, -0.6, 0, 'IDLE', RXC.IDLE, MOD.rx.line);
  rxFrame(s, X, 196, 28, 0, 'DATA');
  sbar(s, X, 196, 28, 9.5, 10.6, 'IDLE', RXC.IDLE, MOD.rx.line);
  rowLabel(s, 'o_rx_data', 246, 34);
  const vals = [[-0.6, 0.5, '이전 byte', 'E2E8F0'], [0.5, 1.5, '00', 'FEF3C7'], [1.5, 2.5, '80'], [2.5, 3.5, '40'], [3.5, 4.5, '20'], [4.5, 5.5, '10'], [5.5, 6.5, '08'], [6.5, 7.5, '04'], [7.5, 8.5, '82'], [8.5, 10.6, '41', 'DCFCE7']];
  vals.forEach(([a, b, t, f]) => {
    R(s, X(a), 246, X(b) - X(a), 34, { fill: f || 'FFF7ED', line: WHITE, lw: 1 });
    T(s, t, X(a), 246, X(b) - X(a), 34, { font: MONO, size: 12, bold: true, align: 'center', color: f === 'DCFCE7' ? GOOD : INK });
  });
  ['52.09', '156.25', '260.41', '364.57', '468.73', '572.89', '677.05', '781.21', '885.37'].forEach((t, i) => {
    T(s, t, X(i + 0.5) - 40, 284, 80, 14, { font: MONO, size: 9.5, color: SUB, align: 'center' });
  });
  rowLabel(s, 'o_rx_done', 316, 28);
  poly(s, [[X(-0.6), 344], [X(9.5), 344], [X(9.5), 316], [X(9.5) + 4, 316], [X(9.5) + 4, 344], [X(10.6), 344]], { color: ALERT, w: 2 });
  T(s, '989.53  ·  10 ns', X(9.5) + 10, 316, 150, 18, { font: MONO, size: 10.5, bold: true, color: ALERT });
  mark(s, X, 9.5, 240, 372, GOOD, '유효 시점', 374, 100);

  card(s, 40, 414, 594, 128, 1, 'data_reg 직결', 'o_rx_data = data_reg → 수신 중 shift 값 그대로 출력 (00 → 80 → 40 → … → 82 → 41)', acc);
  card(s, 646, 414, 594, 128, 2, '이전 byte 소실', 'DATA 진입 시 data_reg ← 0 → 직전 byte는 다음 start edge 후 52.09 µs까지만 유지', acc);
  card(s, 40, 552, 594, 128, 3, '현재 소비자 정상', 'uart_tx = tx_start 시점 latch, top_ascii = rx_done 시점 shift → 둘 다 rx_done 순간 값 사용', acc);
  card(s, 646, 552, 594, 128, 4, '10 ns pulse', 'rx_done 1 clk → 늦게 읽는 logic, 다른 clock domain은 byte 누락', acc);
}

// =====================================================================
// 10. E9 non-hex byte on FND
// =====================================================================
function slideNonHex() {
  const s = pptx.addSlide();
  const acc = chrome(s, '03', 'E9 Non-Hex Byte', 'Non-Hex Bytes Show as 0 on the FND, Same as a Real 0', 10);
  tableName(s, 'Ascii_decoder Mapping', 40, 100, acc);
  const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, align: 'center' } });
  const m = (t, o = {}) => ({ text: t, options: { fontFace: MONO, align: 'center', ...o } });
  const bad = { color: ALERT, bold: true, fill: { color: 'FEF2F2' } };
  s.addTable([
    [H('입력 byte'), H('o_fnd_hex'), H('FND')],
    [m("'0' ~ '9'  (0x30 ~ 0x39)"), m('0 ~ 9'), m('0 ~ 9')],
    [m("'A' ~ 'F'  (0x41 ~ 0x46)"), m('A ~ F'), m('A ~ F')],
    [m("'a' ~ 'f'  (0x61 ~ 0x66)"), m('A ~ F'), m('A ~ F')],
    [m('CR 0x0D · LF 0x0A', bad), m('default 0', bad), m('0', bad)],
    [m('0x00 · 0xFF · 기타', bad), m('default 0', bad), m('0', bad)],
  ], {
    x: px(40), y: px(130), w: px(560), colW: [px(270), px(150), px(140)], rowH: px(52),
    fontFace: KO, fontSize: 13, color: INK, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: CARDLINE },
  });
  // sequence
  panel(s, 630, 100, 610, 400, '터미널 입력 "12" + Enter (CR + LF)', acc);
  T(s, 'anode_reg   [31:24]  [23:16]  [15:8]  [7:0]', 800, 134, 430, 18, { font: MONO, size: 10, color: SUB });
  const seq = [['reset', '0000', ''], ["'1'", '0001', ''], ["'2'", '0012', ''], ['CR', '0120', 'r'], ['LF', '1200', 'r']];
  seq.forEach(([inp, d, flag], i) => {
    const y = 160 + i * 66;
    R(s, 650, y, 120, 50, { fill: flag ? 'FEF2F2' : WHITE, line: flag ? ALERT : CARDLINE, radius: 6 });
    T(s, inp, 650, y, 120, 50, { font: MONO, size: 14, bold: true, align: 'center', color: flag ? ALERT : INK });
    seg(s, 774, y + 25, 800, y + 25, { color: SUB, w: 1.25, arrow: true });
    [...d].forEach((ch, k) => {
      const x = 808 + k * 92, isNew = k === 3 && i > 0;
      R(s, x, y, 80, 50, { fill: '111827', line: isNew ? (flag ? ALERT : GOOD) : '111827', lw: 2, radius: 4 });
      T(s, ch, x, y, 80, 50, { font: MONO, size: 26, bold: true, align: 'center', color: isNew && flag ? 'F87171' : 'FCA5A5' });
    });
  });
  card(s, 40, 470, 570, 64, 1, 'default = 0', 'hex 외 byte 전부 FND "0" → 실제 "0" 입력과 동일', acc);
  card(s, 40, 542, 570, 64, 2, 'Enter 입력', '터미널 설정에 따라 CR / LF / CR+LF → Enter마다 "0" 1~2개 추가', acc);
  card(s, 40, 614, 1200, 66, 3, '오류 은폐', 'E1 ~ E3 garbage byte (0xFF, 0x00)와 reset 값 C0C0C0C0 ("0000")도 같은 "0" → 수신 오류가 화면상 구분 불가', acc);
  card(s, 630, 514, 610, 92, 4, 'shift 기준', 'rx_done마다 anode_reg 8 bit shift → hex 여부와 무관하게 이전 글자 1개 밀려남', acc);
}

// =====================================================================
// 11. Fix map
// =====================================================================
function slideFix() {
  const s = pptx.addSlide();
  const acc = chrome(s, '04', 'RTL Change Map', '7 RTL Changes Cover 8 of 9 Cases, Baud Limit Remains', 11);
  tableName(s, 'RTL Change Map', 40, 100, acc);
  const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, align: 'center' } });
  const f = (t) => ({ text: t, options: { fontFace: MONO, bold: true, color: WHITE, fill: { color: acc }, align: 'center' } });
  const m = (t, o = {}) => ({ text: t, options: o });
  const rows = [
    ['F1', 'rx 2-FF synchronizer', 'uart_rx 입력', 'rx → FF 2단 → FSM, ASYNC_REG 지정', 'E5', 'FF 2'],
    ['F2', 'START 중앙 재확인', 'uart_rx START', '8 tick 시점 rx = 1일 경우 IDLE 복귀', 'E1 · E6', 'comparator 1'],
    ['F3', 'STOP 확인 + framing_err', 'uart_rx STOP', 'stop 중앙 rx = 0일 경우 rx_done 대신 framing_err, rx = 1 복귀 후 IDLE 재대기', 'E2 · E3', 'FF 1 · 출력 1'],
    ['F4', 'TX 입력 buffer', 'uart_loopback', 'rx_data를 1 byte buffer(또는 FIFO)에 저장, tx_busy = 0 시점에 전송', 'E7', 'register 8 · valid 1'],
    ['F5', 'rx_data 출력 register', 'uart_rx 출력', 'rx_done 시점 data_reg → 출력 register latch', 'E8', 'register 8'],
    ['F6', 'non-hex byte 무시', 'Ascii_decoder · top_ascii', 'hex 문자일 때만 anode_reg shift', 'E9', 'valid 1'],
    ['F7', 'case default → IDLE', 'uart_rx · uart_tx', '정의되지 않은 state → IDLE 복귀', 'E5 회복', '없음'],
  ];
  const data = [[H('Fix'), H('변경'), H('위치'), H('동작'), H('해결'), H('추가 HW')]];
  rows.forEach((r) => data.push([f(r[0]), m(r[1], { bold: true }), m(r[2], { fontFace: MONO }), m(r[3]), m(r[4], { fontFace: MONO, bold: true, color: GOOD, align: 'center' }), m(r[5], { align: 'center' })]));
  data.push([
    { text: '—', options: { fontFace: MONO, bold: true, color: WHITE, fill: { color: MUTED }, align: 'center' } },
    m('baud 한계', { bold: true }), m('UART 구조', { fontFace: MONO }), m('−4.87% / +6.24% 한계 유지, 한계 밖 frame은 F3 framing_err로 일부 검출'),
    m('E4', { fontFace: MONO, bold: true, color: ALERT, align: 'center' }), m('—', { align: 'center' }),
  ]);
  s.addTable(data, {
    x: px(40), y: px(130), w: px(1200), colW: [px(60), px(230), px(200), px(450), px(110), px(150)],
    rowH: [px(34), ...Array(8).fill(px(62))], fontFace: KO, fontSize: 12.5, color: INK, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: CARDLINE }, margin: [0, px(10), 0, px(10)],
  });
}

// ---------- build ----------
slideCover();
slideMap();
slideCheckPoints();
slideGlitch();
slideFraming();
slideBaud();
slideAsync();
slideBackToBack();
slideRxData();
slideNonHex();
slideFix();
pptx.writeFile({ fileName: OUT }).then((f) => console.log('wrote', f));
