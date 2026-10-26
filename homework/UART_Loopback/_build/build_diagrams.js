// build_diagrams.js — UART Loopback block diagram + ASM chart reference deck
// usage: node build_diagrams.js <out.pptx>     (needs pptxgenjs@3.12.0)
// Coordinates are px on a 1280x720 canvas (px/96 = inch). See diagram_reference.md.
const pptxgen = require('pptxgenjs');
const OUT = process.argv[2] || 'UART_Loopback_Diagrams.pptx';

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
  '01': ['Architecture', '4338CA'],
  '02': ['Timing', '0F766E'],
  '03': ['ASM Chart', '7C3AED'],
  '04': ['Loopback Handshake', 'B45309'],
};
const TOTAL = 10;

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in = 1280 x 720 px
pptx.title = 'UART Loopback - Block Diagram & ASM Chart';
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

// =====================================================================
// 1. Cover + contents
// =====================================================================
function slideCover() {
  const s = pptx.addSlide();
  s.background = { color: WHITE };
  R(s, 0, 0, 520, 720, { fill: INK });
  T(s, 'VERILOG  ·  TEAM PROJECT 02', 56, 150, 420, 24, { size: 12, bold: true, color: '818CF8' });
  T(s, 'UART Loopback', 56, 190, 440, 60, { size: 36, bold: true, color: WHITE });
  T(s, 'Block Diagram  ·  ASM Chart', 56, 252, 440, 36, { size: 18, color: 'CBD5E1' });
  // 8N1 frame motif (0x41 'A', LSB first)
  const bits = [1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1];
  const x0 = 56, bw = 30, hi = 360, lo = 392;
  const pts = [];
  bits.forEach((b, i) => { pts.push([x0 + i * bw, b ? hi : lo]); pts.push([x0 + (i + 1) * bw, b ? hi : lo]); });
  poly(s, pts, { color: '818CF8', w: 2.25 });
  ['', '', 'S', '0', '1', '2', '3', '4', '5', '6', '7', 'P', ''].forEach((t, i) => {
    if (t) T(s, t, x0 + i * bw, 400, bw, 18, { font: MONO, size: 9, color: '94A3B8', align: 'center' });
  });
  T(s, "0x41 'A'  ·  8N1  ·  9600 bps", 56, 424, 400, 20, { font: MONO, size: 11, color: '94A3B8' });
  T(s, '정안성', 56, 620, 300, 24, { size: 14, color: WHITE, bold: true });

  T(s, 'Contents', 600, 120, 400, 36, { size: 22, bold: true });
  const rows = [
    ['01', 'Architecture', 'uart_loopback Block Diagram  ·  Interface  ·  top_ascii System', '2 – 4'],
    ['02', 'Timing', 'Baud Tick  ·  16x Oversampling  ·  Bit Center Sampling', '5'],
    ['03', 'ASM Chart', 'uart_rx ASM  ·  State Table  ·  uart_tx ASM  ·  State Table', '6 – 9'],
    ['04', 'Loopback Handshake', 'rx_done → tx_start  ·  Back-to-Back Margin', '10'],
  ];
  rows.forEach(([n, name, sub, pg], i) => {
    const y = 190 + i * 104, acc = SEC[n][1];
    T(s, n, 600, y, 70, 52, { font: MONO, size: 30, bold: true, color: acc });
    T(s, name, 680, y, 420, 30, { size: 17, bold: true });
    T(s, sub, 680, y + 30, 520, 24, { size: 12, color: MUTED });
    T(s, 'p. ' + pg, 1120, y, 100, 30, { font: MONO, size: 12, color: MUTED, align: 'right' });
    seg(s, 600, y + 76, 1220, y + 76, { color: CARDLINE, w: 1 });
  });
}

// =====================================================================
// 2. uart_loopback block diagram
// =====================================================================
function slideBlock() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'Block Diagram', 'uart_loopback: RX Output Feeds TX Directly', 2);
  R(s, 40, 100, 1200, 480, { fill: CARD, line: CARDLINE, radius: 8 });
  // module boundary
  R(s, 190, 128, 860, 418, { line: '818CF8', lw: 1.5, dash: 'dash', radius: 4 });
  T(s, 'uart_loopback', 202, 134, 200, 20, { font: MONO, size: 12, bold: true, color: '4338CA' });
  T(s, 'uart.v', 202, 152, 200, 16, { font: MONO, size: 10, color: MUTED });

  // blocks
  moduleBox(s, 500, 150, 280, 84, MOD.baud, 'baud_tick_gen', 'U_BAUD_TICK_GEN', 'F_COUNT = 651');
  moduleBox(s, 260, 300, 240, 180, MOD.rx, 'uart_rx', 'U_UART_RX');
  moduleBox(s, 780, 300, 240, 180, MOD.tx, 'uart_tx', 'U_UART_TX');
  badge(s, 488, 138, 1, acc); badge(s, 248, 288, 2, acc); badge(s, 768, 288, 4, acc);
  // pins
  pin(s, 'b_tick', 340, 312, 80, 'center'); pin(s, 'rx', 266, 360, 60, 'left');
  pin(s, 'rx_data[7:0]', 390, 360, 104, 'right'); pin(s, 'rx_done', 410, 420, 84, 'right');
  pin(s, 'b_tick', 860, 312, 80, 'center');
  pin(s, 'tx_data[7:0]', 786, 360, 110, 'left'); pin(s, 'tx_start', 786, 420, 90, 'left');
  pin(s, 'tx', 960, 360, 54, 'right'); pin(s, 'tx_busy', 940, 420, 74, 'right');

  // w_b_tick fan-out
  seg(s, 640, 234, 640, 262, { color: WIRE, w: 1.75 });
  seg(s, 380, 262, 900, 262, { color: WIRE, w: 1.75 });
  seg(s, 380, 262, 380, 300, { color: WIRE, w: 1.75, arrow: true });
  seg(s, 900, 262, 900, 300, { color: WIRE, w: 1.75, arrow: true });
  dot(s, 640, 262, 4.5, WIRE);
  wireLabel(s, 'w_b_tick', 648, 238, 100);

  // rx input
  T(s, 'rx', 56, 351, 110, 18, { font: MONO, size: 13, bold: true, align: 'right' });
  seg(s, 172, 360, 260, 360, { color: WIRE, w: 1.75, arrow: true });
  // clk / rst
  T(s, 'clk', 56, 181, 110, 18, { font: MONO, size: 13, bold: true, align: 'right' });
  T(s, 'rst', 56, 213, 110, 18, { font: MONO, size: 13, bold: true, align: 'right' });
  seg(s, 172, 190, 236, 190, { color: INK, w: 1.25, arrow: true });
  seg(s, 172, 222, 236, 222, { color: INK, w: 1.25, arrow: true });
  T(s, '→ 3 modules', 240, 197, 120, 18, { font: MONO, size: 10.5, color: MUTED });

  // w_rx_data bus (8 bit) + branch to o_rx_data
  seg(s, 500, 360, 780, 360, { color: WIRE, w: 3.5, arrow: true });
  wireLabel(s, 'w_rx_data[7:0]', 540, 337, 160);
  dot(s, 640, 360, 5, WIRE);
  poly(s, [[640, 360], [640, 500], [1096, 500]], { color: WIRE, w: 3.5, arrow: true });
  // w_rx_done + branch to o_rx_done
  seg(s, 500, 420, 780, 420, { color: WIRE, w: 1.75, arrow: true });
  wireLabel(s, 'w_rx_done', 664, 397, 110);
  dot(s, 560, 420, 4.5, WIRE);
  poly(s, [[560, 420], [560, 526], [1096, 526]], { color: WIRE, w: 1.75, arrow: true });
  badge(s, 700, 428, 3, acc, 24);
  // outputs
  seg(s, 1020, 360, 1096, 360, { color: WIRE, w: 1.75, arrow: true });
  T(s, 'tx', 1102, 351, 110, 18, { font: MONO, size: 13, bold: true });
  T(s, 'o_rx_data[7:0]', 1102, 491, 136, 18, { font: MONO, size: 12, bold: true });
  T(s, 'o_rx_done', 1102, 517, 136, 18, { font: MONO, size: 12, bold: true });
  // tx_busy: no connect
  seg(s, 1020, 420, 1052, 420, { color: MUTED, w: 1.25 });
  seg(s, 1046, 414, 1058, 426, { color: ALERT, w: 1.75 }); seg(s, 1046, 426, 1058, 414, { color: ALERT, w: 1.75 });
  T(s, 'NC', 1064, 411, 40, 18, { font: MONO, size: 11, bold: true, color: ALERT });

  // legend
  seg(s, 60, 562, 96, 562, { color: WIRE, w: 1.75 }); T(s, '1-bit', 102, 553, 60, 18, { font: MONO, size: 11, color: SUB });
  seg(s, 170, 562, 206, 562, { color: WIRE, w: 3.5 }); T(s, '8-bit bus', 212, 553, 90, 18, { font: MONO, size: 11, color: SUB });
  dot(s, 318, 562, 4.5, WIRE); T(s, 'branch', 328, 553, 70, 18, { font: MONO, size: 11, color: SUB });
  T(s, '✕ NC = no connect', 408, 553, 170, 18, { font: MONO, size: 11, color: SUB });

  card(s, 40, 592, 594, 38, 1, 'baud_tick_gen', '651 clk마다 1 clk b_tick (9600 × 16)', acc);
  card(s, 646, 592, 594, 38, 2, 'uart_rx', 'start 중앙 정렬 후 16 tick 간격 sampling', acc);
  card(s, 40, 638, 594, 38, 3, 'rx_done → tx_start', 'stop bit 중앙 1 clk pulse → echo 시작', acc);
  card(s, 646, 638, 594, 38, 4, 'uart_tx', 'tx_data latch 후 LSB first 송신', acc);
}

// =====================================================================
// 3. Interface table
// =====================================================================
function slideInterface() {
  const s = pptx.addSlide();
  chrome(s, '01', 'Interface', 'Interface: rx_done Doubles as tx_start, tx_busy Left Open', 3);
  const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, align: 'center' } });
  const sig = (t, c) => ({ text: t, options: { fontFace: MONO, bold: true, color: c, align: 'center' } });
  const c = (t, o = {}) => ({ text: t, options: { ...o } });
  const rows = [
    [H('Signal'), H('Width'), H('From  →  To'), H('역할')],
    [sig('clk', INK), c('1', { align: 'center' }), c('외부 입력  →  3 modules'), c('100 MHz system clock')],
    [sig('rst', INK), c('1', { align: 'center' }), c('외부 입력  →  3 modules'), c('active-high, asynchronous reset')],
    [sig('rx', INK), c('1', { align: 'center' }), c('PC  →  uart_rx'), c('직렬 입력, idle = 1, synchronizer 없음')],
    [sig('w_b_tick', MOD.baud.line), c('1', { align: 'center' }), c('baud_tick_gen  →  uart_rx · uart_tx'), c('6.51 µs 주기 1 clk pulse (153.6 kHz)')],
    [sig('w_rx_data', MOD.rx.line), c('8', { align: 'center' }), c('uart_rx  →  uart_tx.tx_data · o_rx_data'), c('수신 byte, rx_done 시점 유효')],
    [sig('w_rx_done', MOD.rx.line), c('1', { align: 'center' }), c('uart_rx  →  uart_tx.tx_start · o_rx_done'), c('stop bit 중앙 1 clk pulse = TX 시작 신호')],
    [sig('tx', MOD.tx.line), c('1', { align: 'center' }), c('uart_tx  →  PC'), c('echo 직렬 출력, idle = 1')],
    [sig('tx_busy', MOD.tx.line), c('1', { align: 'center' }), c('uart_tx  →  미연결 (NC)'), c('START ~ STOP 구간 1, IDLE 복귀 시 0')],
    [sig('o_rx_data', '4338CA'), c('8', { align: 'center' }), c('uart_loopback  →  top_ascii'), c('Ascii_decoder 입력')],
    [sig('o_rx_done', '4338CA'), c('1', { align: 'center' }), c('uart_loopback  →  top_ascii'), c('anode_reg shift enable')],
  ];
  s.addTable(rows, {
    x: px(40), y: px(108), w: px(1200), colW: [px(190), px(110), px(450), px(450)],
    rowH: px(48), fontFace: KO, fontSize: 13, color: INK, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: CARDLINE }, margin: [0, px(10), 0, px(10)],
  });
  T(s, 'Signal 색 = 출발 module  (uart_rx  ·  uart_tx  ·  baud_tick_gen  ·  top port)', 40, 650, 800, 20, { size: 11, color: MUTED });
}

// =====================================================================
// 4. top_ascii system diagram
// =====================================================================
function slideSystem() {
  const s = pptx.addSlide();
  const acc = chrome(s, '01', 'top_ascii System', 'top_ascii: Each Received Byte Shifts onto the 4-digit FND', 4);
  R(s, 40, 100, 1200, 446, { fill: CARD, line: CARDLINE, radius: 8 });
  T(s, 'top_ascii', 56, 108, 200, 20, { font: MONO, size: 12, bold: true, color: '4338CA' });

  // row 1 : data path
  moduleBox(s, 120, 168, 180, 120, MOD.top, 'uart_loopback', 'U_UART_LOOP', 'uart.v');
  moduleBox(s, 400, 168, 160, 120, MOD.glue, 'Ascii_decoder', 'U_ASCII', 'ASCII → hex');
  moduleBox(s, 650, 168, 150, 120, MOD.glue, 'fnd_decoder', 'U_FND_DEC', 'hex → segment');
  // anode_reg (logic inside top, dashed)
  R(s, 890, 158, 120, 140, { fill: WHITE, line: INK, lw: 1.5, dash: 'dash', radius: 4 });
  T(s, 'anode_reg', 890, 196, 120, 22, { font: MONO, size: 14, bold: true, align: 'center' });
  T(s, '[31:0]', 890, 218, 120, 18, { font: MONO, size: 11, color: MUTED, align: 'center' });
  T(s, '8bit shift', 890, 238, 120, 18, { font: MONO, size: 10.5, color: '4338CA', bold: true, align: 'center' });
  // MUX (trapezoid rotated 90 deg: wide input side left)
  s.addShape(pptx.ShapeType.trapezoid, { x: px(1017), y: px(203), w: px(116), h: px(50), rotate: 90, fill: { color: WHITE }, line: { color: INK, width: 1.5 } });
  T(s, 'MUX', 1048, 210, 54, 18, { font: MONO, size: 11, bold: true, align: 'center' });
  T(s, '4:1', 1048, 228, 54, 16, { font: MONO, size: 10, color: MUTED, align: 'center' });

  // ports left
  T(s, 'rx', 50, 199, 40, 18, { font: MONO, size: 13, bold: true, align: 'right' });
  seg(s, 94, 208, 120, 208, { color: WIRE, w: 1.75, arrow: true });
  T(s, 'tx', 50, 247, 40, 18, { font: MONO, size: 13, bold: true, align: 'right' });
  seg(s, 120, 256, 94, 256, { color: WIRE, w: 1.75, arrow: true });

  // o_rx_data -> Ascii_decoder
  seg(s, 300, 208, 400, 208, { color: WIRE, w: 3.5, arrow: true });
  wireLabel(s, 'o_rx_data', 306, 186, 90);
  // o_rx_done -> Ascii_decoder + anode_reg enable
  seg(s, 300, 256, 400, 256, { color: WIRE, w: 1.75, arrow: true });
  wireLabel(s, 'o_rx_done', 306, 234, 90);
  dot(s, 330, 256, 4.5, WIRE);
  poly(s, [[330, 256], [330, 330], [950, 330], [950, 298]], { color: WIRE, w: 1.75, arrow: true });
  T(s, 'en', 956, 304, 30, 16, { font: MONO, size: 10, color: WIRE, bold: true });
  // hex -> fnd_decoder
  seg(s, 560, 228, 650, 228, { color: WIRE, w: 2.5, arrow: true });
  wireLabel(s, 'w_fnd_hex', 560, 206, 90, 'center');
  T(s, '[3:0]', 575, 230, 60, 16, { font: MONO, size: 9.5, color: MUTED, align: 'center' });
  // font -> anode_reg
  seg(s, 800, 228, 890, 228, { color: WIRE, w: 3.5, arrow: true });
  wireLabel(s, 'w_fnd_font', 800, 206, 90, 'center');
  T(s, '[7:0]', 815, 230, 60, 16, { font: MONO, size: 9.5, color: MUTED, align: 'center' });
  // anode_reg -> MUX (32 bit)
  seg(s, 1010, 228, 1050, 228, { color: WIRE, w: 3.5, arrow: true });
  T(s, '32', 1015, 206, 30, 16, { font: MONO, size: 10, color: WIRE, bold: true, align: 'center' });
  // MUX -> fnd_font
  seg(s, 1100, 228, 1126, 228, { color: WIRE, w: 3.5, arrow: true });
  T(s, 'fnd_font', 1132, 210, 96, 18, { font: MONO, size: 12, bold: true });
  T(s, '[7:0]', 1132, 228, 96, 16, { font: MONO, size: 10.5, color: MUTED });

  // row 2 : scan path
  moduleBox(s, 560, 392, 190, 100, MOD.glue, 'clock_tick_gen', 'U_CLOCK_4K', 'CLK_FRQ = 4000');
  moduleBox(s, 820, 392, 140, 100, MOD.glue, 'counter_4', 'U_COUNT', '0 → 3 반복');
  R(s, 1040, 410, 82, 64, { fill: WHITE, line: INK, lw: 1.5, dash: 'dash', radius: 4 });
  T(s, 'COM', 1040, 424, 82, 18, { font: MONO, size: 12, bold: true, align: 'center' });
  T(s, 'decoder', 1040, 442, 82, 16, { font: MONO, size: 10, color: MUTED, align: 'center' });
  T(s, 'clk', 470, 433, 60, 18, { font: MONO, size: 13, bold: true, align: 'right' });
  seg(s, 534, 442, 560, 442, { color: INK, w: 1.25, arrow: true });
  seg(s, 750, 442, 820, 442, { color: WIRE, w: 1.75, arrow: true });
  wireLabel(s, 'w_clk_4k', 750, 420, 70, 'center');
  seg(s, 960, 442, 1040, 442, { color: WIRE, w: 2.5, arrow: true });
  wireLabel(s, 'w_sel', 962, 420, 50, 'left');
  dot(s, 1006, 442, 4.5, WIRE);
  poly(s, [[1006, 442], [1006, 360], [1075, 360], [1075, 280]], { color: WIRE, w: 2.5, arrow: true });
  T(s, 'sel', 1080, 300, 40, 16, { font: MONO, size: 10, color: WIRE, bold: true });
  seg(s, 1122, 442, 1136, 442, { color: WIRE, w: 2.5, arrow: true });
  T(s, 'fnd_com', 1140, 424, 96, 18, { font: MONO, size: 12, bold: true });
  T(s, '[3:0]', 1140, 442, 96, 16, { font: MONO, size: 10.5, color: MUTED });

  badge(s, 108, 156, 1, acc); badge(s, 388, 156, 2, acc); badge(s, 878, 146, 3, acc); badge(s, 548, 380, 4, acc);
  T(s, '실선 = module instance   ·   점선 = top_ascii 내부 always 블록   ·   clk · rst → 전 module 공통', 56, 516, 900, 20, { size: 11, color: MUTED });

  card(s, 40, 560, 594, 52, 1, 'uart_loopback', '수신 byte echo + o_rx_data · o_rx_done 출력', acc);
  card(s, 646, 560, 594, 52, 2, 'Ascii_decoder', "'0'~'9' · 'A'~'F' · 'a'~'f' → hex, 그 외 0", acc);
  card(s, 40, 620, 594, 52, 3, 'anode_reg', 'rx_done마다 8bit shift → 최근 4글자 표시', acc);
  card(s, 646, 620, 594, 52, 4, 'scan', '4 kHz tick → counter_4 → w_sel → digit · font 선택', acc);
}

// =====================================================================
// 5. Baud tick / frame sampling timing
// =====================================================================
function slideTiming() {
  const s = pptx.addSlide();
  const acc = chrome(s, '02', 'Baud Tick · Sampling', 'RX Samples Each Bit at Its Center: 8 Ticks, Then Every 16', 5);
  // derivation chain
  const chain = [
    ['F_COUNT', '100 MHz ÷ 153,600', '= 651'],
    ['b_tick 주기', '651 × 10 ns', '= 6.51 µs'],
    ['1 bit', '16 tick', '= 104.16 µs'],
    ['start 중앙', 'START 8 tick', '= 52.08 µs'],
  ];
  chain.forEach(([h, a, b], i) => {
    const x = 40 + i * 304;
    R(s, x, 100, 276, 66, { fill: CARD, line: CARDLINE, radius: 6 });
    T(s, h, x + 14, 104, 250, 20, { size: 11, bold: true, color: acc });
    s.addText([{ text: a + '  ', options: { color: SUB } }, { text: b, options: { bold: true, color: INK } }],
      { x: px(x + 14), y: px(126), w: px(256), h: px(32), fontFace: MONO, fontSize: 14, margin: 0, valign: 'middle' });
    if (i < 3) seg(s, x + 278, 133, x + 302, 133, { color: acc, w: 2, arrow: true });
  });

  // waveform geometry : rx fall at X0, bit width BW
  const X0 = 236, BW = 92, LBL = 40, LW = 128;
  const cen = (i) => X0 + BW / 2 + i * BW;          // i=0 start, 1..8 D0..D7, 9 stop
  const frame = [0, 1, 0, 0, 0, 0, 0, 1, 0, 1];     // 0x41 LSB first
  const rowLabel = (t, y, h) => T(s, t, LBL, y, LW, h, { font: MONO, size: 12, bold: true, align: 'right' });

  // bit names
  ['START', 'D0=1', 'D1=0', 'D2=0', 'D3=0', 'D4=0', 'D5=0', 'D6=1', 'D7=0', 'STOP'].forEach((t, i) =>
    T(s, t, X0 + i * BW, 180, BW, 18, { font: MONO, size: 10.5, bold: true, color: i === 0 || i === 9 ? acc : SUB, align: 'center' }));
  for (let i = 0; i <= 10; i++) seg(s, X0 + i * BW, 182, X0 + i * BW, 238, { color: CARDLINE, w: 0.75 });
  // rx line
  rowLabel('rx', 200, 34);
  const HI = 204, LO = 232;
  const pts = [[X0 - 60, HI], [X0, HI]];
  frame.forEach((b, i) => { pts.push([X0 + i * BW, b ? HI : LO]); pts.push([X0 + (i + 1) * BW, b ? HI : LO]); });
  pts.push([X0 + 10 * BW, HI]); pts.push([X0 + 10 * BW + 40, HI]);
  poly(s, pts, { color: INK, w: 2 });
  T(s, 'rx fall', X0 - 70, 236, 70, 16, { font: MONO, size: 9.5, color: MUTED, align: 'right' });

  // sample markers
  for (let i = 0; i < 10; i++) {
    seg(s, cen(i), 196, cen(i), 470, { color: MARK, w: 1, dash: 'dash' });
    dot(s, cen(i), frame[i] ? HI : LO, 4.5, MARK);
  }

  // c_state bar
  rowLabel('c_state', 256, 30);
  const st = [['IDLE', X0 - 60, X0, 'F1F5F9'], ['START', X0, cen(0), 'FFE4E6'], ['DATA', cen(0), cen(8), 'FECDD3'],
    ['STOP', cen(8), cen(9), 'FDA4AF'], ['IDLE', cen(9), X0 + 10 * BW + 40, 'F1F5F9']];
  st.forEach(([n, a, b, f]) => { R(s, a, 256, b - a, 30, { fill: f, line: WHITE, lw: 1 }); T(s, n, a, 256, b - a, 30, { font: MONO, size: 10.5, bold: true, align: 'center', color: MOD.rx.line }); });

  // tick brackets
  rowLabel('b_tick 수', 300, 36);
  const bracket = (a, b, t1, t2) => {
    seg(s, a + 2, 306, b - 2, 306, { color: SUB, w: 1 });
    seg(s, a + 2, 300, a + 2, 312, { color: SUB, w: 1 }); seg(s, b - 2, 300, b - 2, 312, { color: SUB, w: 1 });
    T(s, t1, (a + b) / 2 - 40, 312, 80, 16, { font: MONO, size: 10, bold: true, align: 'center' });
    if (t2) T(s, t2, (a + b) / 2 - 40, 327, 80, 14, { font: MONO, size: 9, color: MUTED, align: 'center' });
  };
  bracket(X0, cen(0), '8 tick', '52.08 µs');
  for (let i = 0; i < 8; i++) bracket(cen(i), cen(i + 1), '16 tick', '104.16 µs');
  bracket(cen(8), cen(9), '16 tick', '104.16 µs');

  // rx_done
  rowLabel('rx_done', 356, 30);
  poly(s, [[X0 - 60, 380], [cen(9), 380], [cen(9), 360], [cen(9) + 5, 360], [cen(9) + 5, 380], [X0 + 10 * BW + 40, 380]], { color: INK, w: 2 });
  T(s, '1 clk', cen(9) + 10, 356, 60, 16, { font: MONO, size: 10, bold: true, color: ALERT });

  // data_reg bus values (measured)
  rowLabel('data_reg', 404, 30);
  const vals = ['00', '80', '40', '20', '10', '08', '04', '82', '41'];
  R(s, X0 - 60, 406, cen(0) - X0 + 60, 26, { fill: 'F1F5F9', line: LINE, lw: 0.75 });
  T(s, 'prev', X0 - 60, 406, cen(0) - X0 + 60, 26, { font: MONO, size: 9.5, color: MUTED, align: 'center' });
  vals.forEach((v, i) => {
    const a = cen(i), b = i === 8 ? X0 + 10 * BW + 40 : cen(i + 1);
    R(s, a, 406, b - a, 26, { fill: i === 8 ? 'DCFCE7' : WHITE, line: LINE, lw: 0.75 });
    T(s, v, a, 406, b - a, 26, { font: MONO, size: 11, bold: true, align: 'center', color: i === 8 ? '15803D' : INK });
  });

  // time axis (µs from rx fall)
  rowLabel('t (µs)', 446, 24);
  seg(s, X0 - 60, 450, X0 + 10 * BW + 40, 450, { color: SUB, w: 1, arrow: true });
  T(s, '0', X0 - 20, 454, 40, 16, { font: MONO, size: 9.5, color: SUB, align: 'center' });
  seg(s, X0, 446, X0, 454, { color: SUB, w: 1 });
  ['52.08', '156.24', '260.40', '364.56', '468.72', '572.88', '677.04', '781.20', '885.36', '989.52'].forEach((t, i) => {
    seg(s, cen(i), 446, cen(i), 454, { color: SUB, w: 1 });
    T(s, t, cen(i) - 30, 470, 60, 16, { font: MONO, size: 9.5, color: i === 9 ? ALERT : SUB, align: 'center', bold: i === 9 });
  });

  // legend + result
  dot(s, 250, 506, 4.5, MARK); seg(s, 262, 506, 290, 506, { color: MARK, w: 1, dash: 'dash' });
  T(s, 'sampling 시점 (b_tick_cnt 도달)', 296, 497, 300, 18, { size: 11, color: SUB });
  T(s, "예시 frame = 0x41 'A' (LSB first)", 640, 497, 400, 18, { size: 11, color: SUB });

  R(s, 40, 540, 1200, 132, { fill: CARD, line: CARDLINE, radius: 8 });
  T(s, 'xsim 측정 결과 (tb_measure.sv, 0x41 송신)', 60, 552, 600, 22, { size: 13, bold: true, color: acc });
  const res = [
    ['b_tick 주기', '6.51 µs'], ['START 체류', '52.08 µs'], ['sample 간격', '104.16 µs'],
    ['첫 sample', 'rx fall + 156.245 µs'], ['rx_done', 'rx fall + 989.525 µs'], ['data_reg', '0x41 복원'],
  ];
  res.forEach(([k, v], i) => {
    const x = 60 + (i % 3) * 390, y = 582 + Math.floor(i / 3) * 42;
    T(s, k, x, y, 120, 30, { size: 13, color: SUB });
    T(s, v, x + 120, y, 260, 30, { font: MONO, size: 15, bold: true });
  });
}

// =====================================================================
// ASM chart engine
// =====================================================================
// Column k: L = 40 + 300k, cx = L + 105, rail = L + 294, gutter = L + 14
const COLW = 300, ENTRY_Y = 106, RAIL_Y = 118, SB_Y = 130;
function colGeom(k) { const L = 40 + COLW * k; return { L, cx: L + 105, rail: L + 294, gut: L + 14 }; }

function stateBox(s, cx, name, actions, color, tint) {
  const w = 164, x = cx - w / 2;
  R(s, x, SB_Y, w, 24, { fill: color });
  T(s, name, x, SB_Y, w, 24, { font: MONO, size: 12.5, bold: true, color: WHITE, align: 'center' });
  R(s, x, SB_Y + 24, w, 42, { fill: tint, line: color, lw: 1.5 });
  T(s, actions.length ? actions.join('\n') : '—', x + 4, SB_Y + 24, w - 8, 42,
    { font: MONO, size: 10, align: 'center', color: actions.length ? INK : MUTED, ls: 0.95 });
}
function condBox(s, x, y, w, h, lines, color, size = 9.5) {
  R(s, x, y, w, h, { fill: WHITE, line: color, lw: 1.25, radius: Math.min(h / 2, 16) });
  T(s, lines.join('\n'), x + 2, y, w - 4, h, { font: MONO, size, align: 'center', ls: 0.95 });
}
function brLabel(s, t, x, y, w = 20) { T(s, t, x, y, w, 14, { font: MONO, size: 10, bold: true, color: MARK, align: 'center' }); }
function entry(s, g, color) { seg(s, g.cx, ENTRY_Y, g.cx, SB_Y, { color, w: 1.5, arrow: true }); }
function railTo(s, g, ys, color) { // loop-back rail on the right edge of a column
  const maxY = Math.max(...ys);
  poly(s, [[g.rail, maxY], [g.rail, RAIL_Y], [g.cx, RAIL_Y]], { color, w: 1.25 });
  dot(s, g.cx, RAIL_Y, 3.5, color);
  ys.forEach((y) => { if (y !== maxY) dot(s, g.rail, y, 3.5, color); });
}
function nextCol(s, from, toG, color) { // exit down -> gutter of next column -> entry
  poly(s, [[from.x, from.y], [from.x, 566], [toG.gut, 566], [toG.gut, ENTRY_Y], [toG.cx, ENTRY_Y]], { color, w: 1.5 });
}
function asmLegend(s, color, tint) {
  const y = 626;
  R(s, 40, y - 8, 1200, 54, { fill: CARD, line: CARDLINE, radius: 6 });
  R(s, 60, y + 2, 40, 10, { fill: color }); R(s, 60, y + 12, 40, 16, { fill: tint, line: color, lw: 1 });
  T(s, 'State box (무조건 동작)', 108, y + 2, 240, 26, { size: 11, color: SUB });
  s.addShape(pptx.ShapeType.diamond, { x: px(360), y: px(y + 1), w: px(40), h: px(28), fill: { color: WHITE }, line: { color: INK, width: 1 } });
  T(s, 'Decision box', 408, y + 2, 110, 26, { size: 11, color: SUB });
  R(s, 524, y + 5, 44, 20, { fill: WHITE, line: color, lw: 1, radius: 10 });
  T(s, 'Conditional output box', 576, y + 2, 170, 26, { size: 11, color: SUB });
  dot(s, 762, y + 15, 4, color);
  T(s, 'path merge', 772, y + 2, 90, 26, { size: 11, color: SUB });
  T(s, '←  다음 clock edge 갱신   ·   T / F  조건 참 / 거짓', 880, y + 2, 350, 26, { font: KO, size: 11, color: SUB });
}

// =====================================================================
// 6. uart_rx ASM
// =====================================================================
function slideRxAsm() {
  const s = pptx.addSlide();
  chrome(s, '03', 'uart_rx ASM', 'uart_rx ASM: Align to Start Center, Then Sample Every 16 Ticks', 6);
  const C = MOD.rx.line, TINT = MOD.rx.fill;
  const g = [0, 1, 2, 3].map(colGeom);
  const D1 = 228, D2 = 300;

  // IDLE
  entry(s, g[0], C);
  stateBox(s, g[0].cx, 'IDLE', ['b_tick_cnt ← 0', 'rx_done ← 0'], C, TINT);
  seg(s, g[0].cx, 196, g[0].cx, D1 - 24, { color: C, w: 1.5, arrow: true });
  diamond(s, g[0].cx, D1, 104, 48, 'b_tick');
  seg(s, g[0].cx, D1 + 24, g[0].cx, D2 - 24, { color: C, w: 1.5, arrow: true }); brLabel(s, '1', g[0].cx + 2, D1 + 26);
  diamond(s, g[0].cx, D2, 104, 48, 'rx');
  seg(s, g[0].cx + 52, D1, g[0].rail, D1, { color: C, w: 1.25 }); brLabel(s, '0', g[0].cx + 56, D1 - 16);
  seg(s, g[0].cx + 52, D2, g[0].rail, D2, { color: C, w: 1.25 }); brLabel(s, '1', g[0].cx + 56, D2 - 16);
  railTo(s, g[0], [D1, D2], C);
  brLabel(s, '0', g[0].cx + 2, D2 + 26);
  nextCol(s, { x: g[0].cx, y: D2 + 24 }, g[1], C);
  // reset arrow
  seg(s, g[0].cx, 92, g[0].cx, ENTRY_Y, { color: INK, w: 1.5 });
  T(s, 'rst', g[0].cx - 40, 88, 34, 16, { font: MONO, size: 10.5, bold: true, align: 'right' });

  // START / DATA / STOP common top part
  const common = (k, name, cnt, acts) => {
    entry(s, g[k], C);
    stateBox(s, g[k].cx, name, acts, C, TINT);
    seg(s, g[k].cx, 196, g[k].cx, D1 - 24, { color: C, w: 1.5, arrow: true });
    diamond(s, g[k].cx, D1, 104, 48, 'b_tick');
    seg(s, g[k].cx, D1 + 24, g[k].cx, D2 - 32, { color: C, w: 1.5, arrow: true }); brLabel(s, '1', g[k].cx + 2, D1 + 26);
    diamond(s, g[k].cx, D2, 124, 64, `b_tick_cnt\n== ${cnt}`);
    seg(s, g[k].cx + 52, D1, g[k].rail, D1, { color: C, w: 1.25 }); brLabel(s, '0', g[k].cx + 56, D1 - 16);
    // F : increment
    seg(s, g[k].cx + 62, D2, g[k].L + 184, D2, { color: C, w: 1.25, arrow: true }); brLabel(s, 'F', g[k].L + 168, D2 + 2, 14);
    condBox(s, g[k].L + 184, D2 - 22, 104, 44, ['b_tick_cnt ←', 'b_tick_cnt + 1'], C, 9);
    seg(s, g[k].L + 288, D2, g[k].rail, D2, { color: C, w: 1.25 });
    seg(s, g[k].cx, D2 + 32, g[k].cx, 350, { color: C, w: 1.5, arrow: true }); brLabel(s, 'T', g[k].cx + 2, D2 + 34);
  };

  // START
  common(1, 'START', 7, []);
  condBox(s, g[1].cx - 80, 350, 160, 56, ['b_tick_cnt ← 0', 'bit_cnt ← 0', 'data_reg ← 0'], C);
  railTo(s, g[1], [D1, D2], C);
  nextCol(s, { x: g[1].cx, y: 406 }, g[2], C);

  // DATA
  common(2, 'DATA', 15, []);
  condBox(s, g[2].cx - 80, 350, 160, 56, ['b_tick_cnt ← 0', 'data_reg ←', '{rx, data_reg[7:1]}'], C);
  const D3 = 456;
  seg(s, g[2].cx, 406, g[2].cx, D3 - 30, { color: C, w: 1.5, arrow: true });
  diamond(s, g[2].cx, D3, 124, 60, 'bit_cnt\n== 7');
  seg(s, g[2].cx + 62, D3, g[2].L + 184, D3, { color: C, w: 1.25, arrow: true }); brLabel(s, 'F', g[2].L + 168, D3 + 2, 14);
  condBox(s, g[2].L + 184, D3 - 22, 104, 44, ['bit_cnt ←', 'bit_cnt + 1'], C, 9);
  seg(s, g[2].L + 288, D3, g[2].rail, D3, { color: C, w: 1.25 });
  railTo(s, g[2], [D1, D2, D3], C);
  brLabel(s, 'T', g[2].cx + 2, D3 + 32);
  nextCol(s, { x: g[2].cx, y: D3 + 30 }, g[3], C);

  // STOP
  common(3, 'STOP', 15, []);
  condBox(s, g[3].cx - 70, 350, 140, 34, ['rx_done ← 1'], C);
  railTo(s, g[3], [D1, D2], C);
  poly(s, [[g[3].cx, 384], [g[3].cx, 600], [g[0].gut, 600], [g[0].gut, ENTRY_Y], [g[0].cx, ENTRY_Y]], { color: C, w: 1.5 });

  // per-column duration chips
  [['rx fall 검출', 0], ['8 tick · 52.08 µs', 1], ['16 tick × 8 · 833.28 µs', 2], ['16 tick · 104.16 µs', 3]].forEach(([t, k]) =>
    T(s, t, g[k].L + 116, 574, 182, 18, { font: MONO, size: 10.5, bold: true, color: C }));
  asmLegend(s, C, TINT);
}

// =====================================================================
// 8. uart_tx ASM
// =====================================================================
function slideTxAsm() {
  const s = pptx.addSlide();
  chrome(s, '03', 'uart_tx ASM', 'uart_tx ASM: Hold Each Bit for 16 Ticks, LSB First', 8);
  const C = MOD.tx.line, TINT = MOD.tx.fill;
  const g = [0, 1, 2, 3].map(colGeom);
  const D1 = 228, D2 = 300;

  // IDLE
  entry(s, g[0], C);
  stateBox(s, g[0].cx, 'IDLE', ['tx ← 1', 'tx_busy ← 0'], C, TINT);
  seg(s, g[0].cx, 196, g[0].cx, D1 - 24, { color: C, w: 1.5, arrow: true });
  diamond(s, g[0].cx, D1, 112, 48, 'tx_start');
  seg(s, g[0].cx + 56, D1, g[0].rail, D1, { color: C, w: 1.25 }); brLabel(s, '0', g[0].cx + 60, D1 - 16);
  railTo(s, g[0], [D1], C);
  seg(s, g[0].cx, D1 + 24, g[0].cx, 278, { color: C, w: 1.5, arrow: true }); brLabel(s, '1', g[0].cx + 2, D1 + 26);
  condBox(s, g[0].cx - 80, 278, 160, 56, ['bit_count ← 0', 'b_tick_cnt ← 0', 'data_reg ← tx_data'], C);
  nextCol(s, { x: g[0].cx, y: 334 }, g[1], C);
  seg(s, g[0].cx, 92, g[0].cx, ENTRY_Y, { color: INK, w: 1.5 });
  T(s, 'rst', g[0].cx - 40, 88, 34, 16, { font: MONO, size: 10.5, bold: true, align: 'right' });

  const common = (k, name, acts) => {
    entry(s, g[k], C);
    stateBox(s, g[k].cx, name, acts, C, TINT);
    seg(s, g[k].cx, 196, g[k].cx, D1 - 24, { color: C, w: 1.5, arrow: true });
    diamond(s, g[k].cx, D1, 104, 48, 'b_tick');
    seg(s, g[k].cx, D1 + 24, g[k].cx, D2 - 32, { color: C, w: 1.5, arrow: true }); brLabel(s, '1', g[k].cx + 2, D1 + 26);
    diamond(s, g[k].cx, D2, 124, 64, 'b_tick_cnt\n== 15');
    seg(s, g[k].cx + 52, D1, g[k].rail, D1, { color: C, w: 1.25 }); brLabel(s, '0', g[k].cx + 56, D1 - 16);
    seg(s, g[k].cx + 62, D2, g[k].L + 184, D2, { color: C, w: 1.25, arrow: true }); brLabel(s, 'F', g[k].L + 168, D2 + 2, 14);
    condBox(s, g[k].L + 184, D2 - 22, 104, 44, ['b_tick_cnt ←', 'b_tick_cnt + 1'], C, 9);
    seg(s, g[k].L + 288, D2, g[k].rail, D2, { color: C, w: 1.25 });
    seg(s, g[k].cx, D2 + 32, g[k].cx, 350, { color: C, w: 1.5, arrow: true }); brLabel(s, 'T', g[k].cx + 2, D2 + 34);
    condBox(s, g[k].cx - 70, 350, 140, 34, ['b_tick_cnt ← 0'], C);
  };

  common(1, 'START', ['tx ← 0', 'tx_busy ← 1']);
  railTo(s, g[1], [D1, D2], C);
  nextCol(s, { x: g[1].cx, y: 384 }, g[2], C);

  common(2, 'DATA', ['tx ← data_reg[0]']);
  const D3 = 432;
  seg(s, g[2].cx, 384, g[2].cx, D3 - 30, { color: C, w: 1.5, arrow: true });
  diamond(s, g[2].cx, D3, 124, 60, 'bit_count\n== 7');
  poly(s, [[g[2].cx + 62, D3], [g[2].L + 221, D3], [g[2].L + 221, 474]], { color: C, w: 1.25, arrow: true });
  brLabel(s, 'F', g[2].L + 168, D3 - 16, 14);
  condBox(s, g[2].L + 156, 474, 130, 68, ['data_reg ←', '{0, data_reg[7:1]}', 'bit_count ←', 'bit_count + 1'], C, 9);
  seg(s, g[2].L + 286, 508, g[2].rail, 508, { color: C, w: 1.25 });
  poly(s, [[g[2].rail, 508], [g[2].rail, RAIL_Y], [g[2].cx, RAIL_Y]], { color: C, w: 1.25 });
  dot(s, g[2].cx, RAIL_Y, 3.5, C); dot(s, g[2].rail, D1, 3.5, C); dot(s, g[2].rail, D2, 3.5, C);
  brLabel(s, 'T', g[2].cx + 2, D3 + 32);
  nextCol(s, { x: g[2].cx, y: D3 + 30 }, g[3], C);

  common(3, 'STOP', ['tx ← 1']);
  railTo(s, g[3], [D1, D2], C);
  poly(s, [[g[3].cx, 384], [g[3].cx, 600], [g[0].gut, 600], [g[0].gut, ENTRY_Y], [g[0].cx, ENTRY_Y]], { color: C, w: 1.5 });

  [['rx_done 대기', 0], ['16 tick · 104.15 µs', 1], ['16 tick × 8 · 833.28 µs', 2], ['16 tick · 104.16 µs', 3]].forEach(([t, k]) =>
    T(s, t, g[k].L + 116, 574, 182, 18, { font: MONO, size: 10.5, bold: true, color: C }));
  asmLegend(s, C, TINT);
}

// =====================================================================
// 7 / 9. state tables
// =====================================================================
function stateTable(s, color, rows) {
  const H = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: INK }, align: 'center' } });
  const st = (t) => ({ text: t, options: { fontFace: MONO, bold: true, color: WHITE, fill: { color }, align: 'center' } });
  const m = (t) => ({ text: t, options: { fontFace: MONO } });
  const data = [[H('State'), H('State box 동작'), H('탈출 조건'), H('체류 시간 (xsim 측정)'), H('다음 State · 조건부 동작')]];
  rows.forEach((r) => data.push([st(r[0]), m(r[1]), m(r[2]), m(r[3]), m(r[4])]));
  s.addTable(data, {
    x: px(40), y: px(104), w: px(1200), colW: [px(120), px(250), px(280), px(250), px(300)],
    rowH: px(52), fontFace: KO, fontSize: 12.5, color: INK, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: CARDLINE }, margin: [0, px(10), 0, px(10)],
  });
}
function slideRxTable() {
  const s = pptx.addSlide();
  const acc = chrome(s, '03', 'uart_rx State Table', 'uart_rx: 8 + 128 + 16 Ticks from Start Edge to rx_done', 7);
  stateTable(s, MOD.rx.line, [
    ['IDLE', 'b_tick_cnt ← 0\nrx_done ← 0', 'b_tick = 1  &  rx = 0', 'rx fall 후 다음 b_tick\n(최대 1 tick)', 'START'],
    ['START', '—', 'b_tick_cnt = 7  (8 tick)', '52.08 µs', 'DATA\nbit_cnt ← 0 · data_reg ← 0'],
    ['DATA', '—', 'b_tick_cnt = 15\n&  bit_cnt = 7', '833.28 µs  (104.16 × 8)', 'STOP\n매 bit data_reg shift'],
    ['STOP', '—', 'b_tick_cnt = 15  (16 tick)', '104.16 µs', 'IDLE\nrx_done ← 1'],
  ]);
  card(s, 40, 384, 1200, 62, 1, 'Start 중앙 정렬', 'START 8 tick → start bit 중앙, 이후 16 tick 간격 → 모든 bit 중앙 sampling (첫 sample = 1.5 bit 지점)', acc);
  card(s, 40, 456, 1200, 62, 2, 'LSB first shift', 'data_reg ← {rx, data_reg[7:1]} 8회 → 첫 수신 bit(D0)가 bit 0 위치  (0x41 : 80 → 40 → … → 82 → 41)', acc);
  card(s, 40, 528, 1200, 62, 3, 'rx_done 1 clk', 'STOP 16번째 tick에 1, IDLE 진입 다음 clock에 0 → 10 ns pulse = TX 시작 신호', acc);
  card(s, 40, 600, 1200, 62, 4, 'rx 재검사 없음', 'START 중앙 rx = 0 · STOP rx = 1 확인 생략 → glitch start · framing error 미검출', acc);
}
function slideTxTable() {
  const s = pptx.addSlide();
  const acc = chrome(s, '03', 'uart_tx State Table', 'uart_tx: tx_start Checked Only in IDLE, Bits Held 16 Ticks', 9);
  stateTable(s, MOD.tx.line, [
    ['IDLE', 'tx ← 1\ntx_busy ← 0', 'tx_start = 1', 'rx_done까지 대기', 'START\ndata_reg ← tx_data · 카운터 0'],
    ['START', 'tx ← 0\ntx_busy ← 1', 'b_tick_cnt = 15  (16 tick)', '104.15 µs', 'DATA\nb_tick_cnt ← 0'],
    ['DATA', 'tx ← data_reg[0]', 'b_tick_cnt = 15\n&  bit_count = 7', '833.28 µs  (104.16 × 8)', 'STOP\nbit마다 data_reg shift'],
    ['STOP', 'tx ← 1', 'b_tick_cnt = 15  (16 tick)', '104.16 µs', 'IDLE'],
  ]);
  card(s, 40, 384, 1200, 62, 1, 'tx_data latch', 'IDLE에서 tx_start 시점 tx_data → data_reg 복사 → 이후 RX data_reg 변경과 무관', acc);
  card(s, 40, 456, 1200, 62, 2, 'START 104.15 µs', 'START 진입 = rx_done 다음 clock → 16번째 tick까지 10,415 clk, 이후 bit는 104.16 µs', acc);
  card(s, 40, 528, 1200, 62, 3, 'tx register 출력', 'tx = tx_reg → state 전환보다 1 clk 늦게 line 변화', acc);
  card(s, 40, 600, 1200, 62, 4, 'tx_busy 미사용', 'tx_start는 IDLE에서만 검사 → START ~ STOP 중 들어온 rx_done 무시', acc);
}

// =====================================================================
// 10. Loopback handshake
// =====================================================================
function slideHandshake() {
  const s = pptx.addSlide();
  const acc = chrome(s, '04', 'rx_done → tx_start', 'Echo Starts 2 Clocks After rx_done, Back-to-Back Margin 0', 10);

  // ---- left : clock-level ----
  R(s, 40, 100, 590, 440, { fill: CARD, line: CARDLINE, radius: 8 });
  T(s, 'Clock level  ·  1st frame (0x41)', 56, 108, 400, 22, { size: 13, bold: true, color: acc });
  const X = 180, CW = 62, N = 7; // 7 clk cycles, edge k at X + k*CW
  const E = (k) => X + k * CW;
  const rows = ['clk', 'b_tick', 'RX c_state', 'rx_done', 'TX c_state', 'tx'];
  const RY = (i) => 160 + i * 52; // row top, height 30
  rows.forEach((r, i) => T(s, r, 52, RY(i), 118, 30, { font: MONO, size: 12, bold: true, align: 'right' }));
  // clk
  const cp = [[E(0), RY(0) + 28]];
  for (let k = 0; k < N; k++) { cp.push([E(k), RY(0) + 2]); cp.push([E(k) + CW / 2, RY(0) + 2]); cp.push([E(k) + CW / 2, RY(0) + 28]); cp.push([E(k + 1), RY(0) + 28]); }
  poly(s, cp, { color: INK, w: 1.5 });
  const level = (i, hiFrom, hiTo) => { // single pulse/level waveform on row i
    const hi = RY(i) + 2, lo = RY(i) + 28, p = [[E(0), lo]];
    if (hiFrom != null) { p.push([E(hiFrom), lo]); p.push([E(hiFrom), hi]); p.push([hiTo == null ? E(N) : E(hiTo), hi]); if (hiTo != null) { p.push([E(hiTo), lo]); p.push([E(N), lo]); } } else p.push([E(N), lo]);
    poly(s, p, { color: INK, w: 2 });
  };
  const levelInv = (i, loFrom) => { const hi = RY(i) + 2, lo = RY(i) + 28; poly(s, [[E(0), hi], [E(loFrom), hi], [E(loFrom), lo], [E(N), lo]], { color: INK, w: 2 }); };
  level(1, 1, 2);            // b_tick high one clk before edge 2
  level(3, 2, 3);            // rx_done high edge2..edge3
  levelInv(5, 4);            // tx falls at edge 4
  const bus = (i, segs) => segs.forEach(([a, b, t, f, c]) => {
    R(s, E(a), RY(i) + 2, E(b) - E(a), 26, { fill: f, line: WHITE, lw: 1 });
    T(s, t, E(a), RY(i) + 2, E(b) - E(a), 26, { font: MONO, size: 10.5, bold: true, align: 'center', color: c });
  });
  bus(2, [[0, 2, 'STOP', 'FDA4AF', MOD.rx.line], [2, N, 'IDLE', 'F1F5F9', MOD.rx.line]]);
  bus(4, [[0, 3, 'IDLE', 'F1F5F9', MOD.tx.line], [3, N, 'START', 'BFDBFE', MOD.tx.line]]);
  // edge markers
  [[2, 't0'], [3, '+10 ns'], [4, '+20 ns']].forEach(([k, t], j) => {
    seg(s, E(k), 150, E(k), 476, { color: MARK, w: 1.25, dash: 'dash' });
    badge(s, E(k) - 12, 478, j + 1, acc, 24);
    T(s, t, E(k) - 30, 503, 60, 16, { font: MONO, size: 10.5, bold: true, color: j === 0 ? INK : MARK, align: 'center' });
  });
  T(s, 't0 = 1,093,705 ns', 56, 503, 170, 16, { font: MONO, size: 10.5, bold: true, color: INK });

  // ---- right : frame-level back-to-back ----
  R(s, 650, 100, 590, 440, { fill: CARD, line: CARDLINE, radius: 8 });
  T(s, 'Frame level  ·  back-to-back 0x31 → 0x32', 666, 108, 520, 22, { size: 13, bold: true, color: acc });
  const T0 = 2300, T1 = 5550, XA = 760, XB = 1220;
  const tx = (us) => XA + (us - T0) * (XB - XA) / (T1 - T0);
  T(s, 'RX', 666, 178, 80, 34, { font: MONO, size: 13, bold: true, align: 'right' });
  T(s, 'TX', 666, 268, 80, 34, { font: MONO, size: 13, bold: true, align: 'right' });
  const fseg = (y, a, b, t, f, c) => { R(s, tx(a), y, tx(b) - tx(a), 34, { fill: f, line: WHITE, lw: 0.75 }); if (t && tx(b) - tx(a) > 40) T(s, t, tx(a), y, tx(b) - tx(a), 34, { font: MONO, size: 9.5, bold: true, align: 'center', color: c }); };
  // RX (measured, us)
  fseg(178, T0, 2395.705, 'IDLE', 'F1F5F9', MOD.rx.line);
  fseg(178, 2395.705, 2447.785, '', 'FFE4E6'); fseg(178, 2447.785, 3281.065, 'DATA 0x31', 'FECDD3', MOD.rx.line); fseg(178, 3281.065, 3385.225, '', 'FDA4AF');
  fseg(178, 3385.225, 3437.305, '', 'F1F5F9');
  fseg(178, 3437.305, 3489.385, '', 'FFE4E6'); fseg(178, 3489.385, 4322.665, 'DATA 0x32', 'FECDD3', MOD.rx.line); fseg(178, 4322.665, 4426.825, '', 'FDA4AF');
  fseg(178, 4426.825, T1, 'IDLE', 'F1F5F9', MOD.rx.line);
  // TX
  fseg(268, T0, 3385.235, 'IDLE', 'F1F5F9', MOD.tx.line);
  fseg(268, 3385.235, 3489.385, '', 'BFDBFE'); fseg(268, 3489.385, 4322.665, 'echo 0x31', 'DBEAFE', MOD.tx.line); fseg(268, 4322.665, 4426.825, '', '93C5FD');
  fseg(268, 4426.835, 4530.985, '', 'BFDBFE'); fseg(268, 4530.985, 5364.265, 'echo 0x32', 'DBEAFE', MOD.tx.line); fseg(268, 5364.265, T1, '', '93C5FD');
  // rx_done markers
  [[3385.225, 'rx_done'], [4426.825, 'rx_done']].forEach(([t, l]) => {
    seg(s, tx(t), 150, tx(t), 330, { color: ALERT, w: 1.5, dash: t > 4000 ? 'solid' : 'dash' });
    T(s, l, tx(t) - 40, 140, 80, 14, { font: MONO, size: 9.5, bold: true, color: ALERT, align: 'center' });
  });
  // state legend
  [['START', 'FFE4E6', 'BFDBFE'], ['STOP', 'FDA4AF', '93C5FD']].forEach(([n, a, b], i) => {
    const x = 770 + i * 150;
    R(s, x, 362, 18, 14, { fill: a }); R(s, x + 20, 362, 18, 14, { fill: b });
    T(s, n, x + 44, 360, 80, 18, { font: MONO, size: 10, color: SUB });
  });
  // time axis
  seg(s, XA, 330, XB, 330, { color: SUB, w: 1, arrow: true });
  [2500, 3000, 3500, 4000, 4500, 5000].forEach((t) => {
    seg(s, tx(t), 326, tx(t), 334, { color: SUB, w: 1 });
    T(s, String(t), tx(t) - 30, 336, 60, 16, { font: MONO, size: 9.5, color: SUB, align: 'center' });
  });
  T(s, 't (µs)', XB - 60, 360, 60, 16, { font: MONO, size: 9.5, color: SUB, align: 'right' });
  // zoom callout
  R(s, 666, 392, 558, 136, { fill: WHITE, line: ALERT, lw: 1.25, radius: 6 });
  T(s, '4,426,825 ns  동일 clock edge', 682, 400, 520, 22, { font: MONO, size: 13, bold: true, color: ALERT });
  const ev = [['RX', 'STOP → IDLE,  rx_done ← 1'], ['TX', 'STOP → IDLE'], ['+10 ns', 'TX IDLE → START (tx_start 검사 통과)']];
  ev.forEach(([k, v], i) => {
    T(s, k, 682, 428 + i * 30, 70, 26, { font: MONO, size: 12, bold: true, color: i === 0 ? MOD.rx.line : MOD.tx.line });
    T(s, v, 752, 428 + i * 30, 460, 26, { font: MONO, size: 12 });
  });

  card(s, 40, 556, 1200, 36, 1, 'rx_done 1 clk', 'RX STOP → IDLE edge에서 1, 다음 edge에서 0 → 10 ns pulse', acc);
  card(s, 40, 598, 1200, 36, 2, 'tx +2 clk', 'IDLE에서 tx_start 검사 → START +1 clk, tx register 출력 +1 clk → rx_done 후 20 ns', acc);
  card(s, 40, 640, 1200, 36, 3, '여유 0 tick', 'TX IDLE 복귀 = 다음 rx_done 동일 edge · rx_done이 1 tick 앞설 경우 TX STOP 중 → tx_start 무시', acc);
}

// ---------- build ----------
slideCover();
slideBlock();
slideInterface();
slideSystem();
slideTiming();
slideRxAsm();
slideRxTable();
slideTxAsm();
slideTxTable();
slideHandshake();
pptx.writeFile({ fileName: OUT }).then((f) => console.log('wrote', f));
