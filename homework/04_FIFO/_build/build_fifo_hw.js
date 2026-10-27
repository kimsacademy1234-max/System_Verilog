// build_fifo_hw.js — FIFO homework deck. Helpers / shared slides copied from 02_UART_FIFO/_build/build_fifo.js
// usage: node build_final.js <base.pptx> <import_map.json>
//   base.pptx       : every slide; slides built from the user's HW deck get chrome + labels only
//   import_map.json : which HW-deck shapes import_hw.py copies onto those slides
// Coordinates are px on a 1280x720 canvas (px/96 = inch).
const fs = require('fs');
const pptxgen = require(process.env.PPTXGEN || 'pptxgenjs');
const OUT = process.argv[2] || 'base.pptx';
const MAP = process.argv[3] || 'import_map.json';

// ---------- palette / fonts ----------
const KO = '맑은 고딕', MONO = 'Consolas';
const INK = '0F172A', MUTED = '64748B', SUB = '475569', LINE = 'CBD5E1';
const CARD = 'F8FAFC', CARDLINE = 'E2E8F0', WHITE = 'FFFFFF';
const WIRE = '1D4ED8', MARK = 'EA580C', ALERT = 'DC2626', GOOD = '15803D';
const GOODBG = 'DCFCE7', BADBG = 'FEE2E2';
const MOD = {
  rx:   { fill: 'FFF1F2', line: 'BE123C' },
  tx:   { fill: 'EFF6FF', line: '1D4ED8' },
  baud: { fill: 'FEF3C7', line: 'B45309' },
  top:  { fill: 'EEF2FF', line: '4338CA' },
  glue: { fill: 'F1F5F9', line: '475569' },
  pc:   { fill: 'F0FDF4', line: '15803D' },
};
const SEC = { // section id -> [name, accent]
  '00': ['Summary', '334155'],
  '01': ['목적', '0F766E'],
  '02': ['Reference', '0369A1'],
  '03': ['블록 다이어그램', '4338CA'],
  '04': ['동작 설계', '7C3AED'],
  '05': ['시뮬레이션', 'B45309'],
  '06': ['트러블 슈팅', 'B91C1C'],
  '07': ['결론 · 고찰', '1E293B'],
  'A':  ['APPENDIX', '64748B'],
};

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in = 1280 x 720 px
pptx.title = 'FIFO';
pptx.author = '정안성';
pptx.theme = { headFontFace: KO, bodyFontFace: KO };
const px = (v) => v / 96;

// ---------- global transform (lets older slide bodies shrink into the body area) ----------
let G = { s: 1, dx: 0, dy: 0 };
const gx = (v) => px(G.dx + G.s * v), gy = (v) => px(G.dy + G.s * v), gl = (v) => px(G.s * v);
const gf = (f) => Math.max(8, Math.round(f * G.s * 2) / 2);
function within(top, bottom, newTop, newBottom, fn) { // map [top,bottom] onto [newTop,newBottom]
  const s = Math.min(1, (newBottom - newTop) / (bottom - top));
  const old = G; G = { s, dx: 640 * (1 - s), dy: newTop - top * s };
  try { fn(); } finally { G = old; }
}

// ---------- primitives ----------
function T(s, text, x, y, w, h, o = {}) {
  s.addText(text, {
    x: gx(x), y: gy(y), w: gl(w), h: gl(h),
    fontFace: o.font || KO, fontSize: gf(o.size || 12), color: o.color || INK,
    bold: !!o.bold, italic: !!o.italic, align: o.align || 'left', valign: o.valign || 'middle',
    margin: o.margin ?? 0, lineSpacingMultiple: o.ls || 1.0, fill: o.fill ? { color: o.fill } : undefined,
    paraSpaceAfter: o.psa, isTextBox: true,
  });
}
function R(s, x, y, w, h, o = {}) {
  const round = o.radius != null;
  s.addShape(round ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
    x: gx(x), y: gy(y), w: gl(w), h: gl(h),
    fill: o.fill ? { color: o.fill } : { type: 'none' },
    line: o.line ? { color: o.line, width: o.lw || 1, dashType: o.dash || 'solid' } : { type: 'none' },
    rectRadius: round ? gl(o.radius) : undefined,
  });
}
function seg(s, x1, y1, x2, y2, o = {}) {
  s.addShape(pptx.ShapeType.line, {
    x: gx(Math.min(x1, x2)), y: gy(Math.min(y1, y2)),
    w: gl(Math.abs(x2 - x1)), h: gl(Math.abs(y2 - y1)),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color: o.color || INK, width: o.w || 1.25, dashType: o.dash || 'solid', endArrowType: o.arrow ? 'triangle' : undefined },
  });
}
function poly(s, pts, o = {}) {
  for (let i = 0; i < pts.length - 1; i++) seg(s, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], { ...o, arrow: o.arrow && i === pts.length - 2 });
}
function shape(s, type, x, y, w, h, o = {}) {
  s.addShape(type, {
    x: gx(x), y: gy(y), w: gl(w), h: gl(h), rotate: o.rotate,
    fill: o.fill ? { color: o.fill } : { type: 'none' },
    line: o.line ? { color: o.line, width: o.lw || 1 } : { type: 'none' },
  });
}
function dot(s, x, y, r = 4, color = INK) { shape(s, pptx.ShapeType.ellipse, x - r, y - r, 2 * r, 2 * r, { fill: color }); }
function badge(s, x, y, n, color, d = 26) {
  shape(s, pptx.ShapeType.ellipse, x, y, d, d, { fill: color, line: WHITE, lw: 1.5 });
  T(s, String(n), x, y, d, d, { font: MONO, size: d > 24 ? 11 : 10, bold: true, color: WHITE, align: 'center' });
}
function diamond(s, cx, cy, w, h, text, o = {}) {
  shape(s, pptx.ShapeType.diamond, cx - w / 2, cy - h / 2, w, h, { fill: o.fill || WHITE, line: o.line || INK, lw: 1.25 });
  T(s, text, cx - w / 2, cy - h / 2, w, h, { font: MONO, size: o.size || 10, align: 'center', bold: true });
}
// "**x**" -> highlighted run
function rich(str, base = {}, hi = { color: ALERT }) {
  return str.split('**').map((t, i) => ({ text: t, options: i % 2 ? { ...base, ...hi } : { ...base } })).filter((r) => r.text);
}

// ---------- slide registry ----------
const slides = [];     // {sec, page}
const importMap = [];  // filled by import slides
let PAGE = 0, TOTAL = 0;
function newSlide(sec) { const s = pptx.addSlide(); PAGE += 1; slides.push({ sec, page: PAGE }); return s; }

// ---------- chrome + 결론 ----------
const CY2 = 162; // body top when the 결론 has two lines
function chrome(s, sec, sub, title) {
  const [name, acc] = SEC[sec];
  s.background = { color: WHITE };
  s.addText([
    { text: `${sec}  ·  ${name}`, options: { bold: true, color: acc } },
    { text: `     /     ${sub}`, options: { color: MUTED } },
  ], { x: px(40), y: px(18), w: px(900), h: px(24), fontFace: KO, fontSize: 11, margin: 0, valign: 'middle', isTextBox: true });
  T(s, title, 40, 44, 1110, 46, { size: 24, bold: true });
  shape(s, pptx.ShapeType.ellipse, 1172, 24, 62, 62, { fill: acc });
  T(s, sec, 1172, 24, 62, 62, { font: MONO, size: sec.length > 1 ? 18 : 22, bold: true, color: WHITE, align: 'center' });
  T(s, '정안성  ·  FIFO', 40, 694, 400, 16, { size: 9, color: '94A3B8' });
  T(s, `${PAGE} / __TOTAL__`, 1140, 694, 100, 16, { size: 9, color: '94A3B8', align: 'right' });
  return acc;
}
function concl(s, lines) {
  R(s, 40, 101, 58, 26, { fill: ALERT, radius: 13 });
  T(s, '결론', 40, 101, 58, 26, { size: 12, bold: true, color: WHITE, align: 'center' });
  lines.forEach((ln, i) => {
    s.addText(rich('·  ' + ln, { bold: true, color: INK }), {
      x: px(110), y: px(100 + i * 27), w: px(1130), h: px(28), fontFace: KO, fontSize: 15, margin: 0, valign: 'middle', isTextBox: true,
    });
  });
}
function head(s, sec, sub, title, lines) { const acc = chrome(s, sec, sub, title); concl(s, lines); return acc; }
function label(s, text, x, y, w, acc) { // section label inside a slide: "① 현상"
  T(s, text, x, y, w, 26, { size: 16, bold: true, color: acc });
}
function card(s, x, y, w, h, n, headTxt, body, acc, size = 13) {
  R(s, x, y, w, h, { fill: WHITE, line: CARDLINE, radius: 6 });
  badge(s, x + 12, y + (h - 24) / 2, n, acc, 24);
  s.addText([
    { text: headTxt + '   ', options: { bold: true, color: acc, fontFace: MONO } },
    { text: body, options: { color: INK } },
  ], { x: gx(x + 46), y: gy(y), w: gl(w - 56), h: gl(h), fontFace: KO, fontSize: gf(size), margin: 0, valign: 'middle', isTextBox: true });
}
function tag(s, text, x, y, w, ok, h = 22) {
  R(s, x, y, w, h, { fill: ok ? GOODBG : BADBG, line: ok ? GOOD : ALERT, lw: 1, radius: 4 });
  T(s, text, x, y, w, h, { font: MONO, size: 10.5, bold: true, color: ok ? GOOD : ALERT, align: 'center' });
}
function table(s, rows, x, y, w, colW, rowH, o = {}) {
  s.addTable(rows, {
    x: gx(x), y: gy(y), w: gl(w), colW: colW.map(gl), rowH: Array.isArray(rowH) ? rowH.map(gl) : gl(rowH),
    fontFace: KO, fontSize: gf(o.size || 12), color: INK, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: CARDLINE }, margin: [0, gl(8), 0, gl(8)],
  });
}
const TH = (t, fill = INK) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: fill }, align: 'center' } });
const TC = (t, o = {}) => ({ text: t, options: o });
const TM = (t, o = {}) => ({ text: t, options: { fontFace: MONO, align: 'center', ...o } });
const PASS = (t = 'PASS') => TM(t, { bold: true, color: GOOD, fill: { color: GOODBG } });
const FAIL = (t = 'FAIL') => TM(t, { bold: true, color: ALERT, fill: { color: BADBG } });

function moduleBox(s, x, y, w, h, m, name, inst, extra) {
  R(s, x, y, w, h, { fill: m.fill, line: m.line, lw: 1.75, radius: 6 });
  T(s, name, x, y + h / 2 - 26, w, 24, { font: MONO, size: 15, bold: true, align: 'center' });
  if (inst) T(s, inst, x, y + h / 2 - 2, w, 18, { font: MONO, size: 10, color: MUTED, align: 'center' });
  if (extra) T(s, extra, x, y + h / 2 + 16, w, 18, { font: MONO, size: 10.5, color: m.line, align: 'center', bold: true });
}
function pin(s, text, x, y, w, align, color = SUB) { T(s, text, x, y - 9, w, 18, { font: MONO, size: 10.5, color, align }); }
function wireLabel(s, text, x, y, w, align = 'left', color = WIRE) { T(s, text, x, y, w, 18, { font: MONO, size: 11, bold: true, color, align }); }
function chip(s, text, x, y, w, color = INK, fill = 'FEF9C3') { // value chip on a wire
  R(s, x, y, w, 20, { fill, line: color, lw: 1, radius: 4 });
  T(s, text, x, y, w, 20, { font: MONO, size: 10.5, bold: true, color, align: 'center' });
}

// =====================================================================
// cover
// =====================================================================
function slideCover() {
  const s = pptx.addSlide(); PAGE += 1; slides.push({ sec: 'cover', page: PAGE });
  s.background = { color: WHITE };
  R(s, 0, 0, 560, 720, { fill: INK });
  T(s, 'VERILOG  ·  TEAM PROJECT 02', 64, 170, 440, 24, { size: 12, bold: true, color: '818CF8' });
  T(s, 'UART Loopback', 64, 206, 460, 64, { size: 40, bold: true, color: WHITE });
  T(s, '설계 · 시뮬레이션 검증 · 보드 시연', 64, 272, 460, 32, { size: 17, color: 'CBD5E1' });
  // 8N1 frame motif : '0' = 0x30, LSB first
  const bits = [1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1];
  const x0 = 64, bw = 32, hi = 380, lo = 412, pts = [];
  bits.forEach((b, i) => { pts.push([x0 + i * bw, b ? hi : lo]); pts.push([x0 + (i + 1) * bw, b ? hi : lo]); });
  poly(s, pts, { color: '818CF8', w: 2.25 });
  ['', '', 'S', '0', '1', '2', '3', '4', '5', '6', '7', 'P', ''].forEach((t, i) => {
    if (t) T(s, t, x0 + i * bw, 420, bw, 18, { font: MONO, size: 9, color: '94A3B8', align: 'center' });
  });
  T(s, "0x30 '0'  ·  8N1  ·  9600 bps", 64, 446, 400, 20, { font: MONO, size: 11, color: '94A3B8' });
  T(s, '정안성', 64, 600, 300, 26, { size: 15, color: WHITE, bold: true });
  T(s, '2026. 10', 64, 628, 300, 20, { size: 11, color: '94A3B8' });
  // right : spec stack
  const specs = [['clk', '100 MHz', 'Basys-3'], ['baud', '9600 bps', '8N1 · LSB first'], ['oversampling', '16x', 'b_tick 6.51 µs'], ['sampling', 'ONE BIT mode', 'bit 중앙 1회']];
  specs.forEach(([k, v, d], i) => {
    const y = 170 + i * 110;
    T(s, k, 640, y, 300, 22, { font: MONO, size: 12, color: MUTED });
    T(s, v, 640, y + 22, 520, 44, { size: 28, bold: true });
    T(s, d, 640, y + 66, 520, 22, { size: 13, color: SUB });
    if (i < 3) seg(s, 640, y + 98, 1200, y + 98, { color: CARDLINE, w: 1 });
  });
}

// =====================================================================
// contents
// =====================================================================
const CONTENTS = [ // id, title, subtitle (pages filled after build)
  ['00', 'Summary', '핵심 수치 · 시나리오 결과'],
  ['01', '목적', 'FIFO 설계 목표 · 검증 항목'],
  ['02', 'Reference', 'FIFO 개념 · register_file vs BRAM'],
  ['03', '블록 다이어그램', 'fifo 내부 (control_unit · register_file)'],
  ['04', '동작 설계', 'control_unit 동작표 · 예상 타이밍'],
  ['05', '시뮬레이션', 'TB 구조 · 시나리오 · S1 ~ S5'],
  ['06', '트러블 슈팅', '검증 중 확인한 경계 동작'],
  ['07', '결론 · 고찰', '결론 · 고찰 · 개선 방향'],
  ['A', 'APPENDIX', 'TB 로그'],
];
function slideContents() {
  const s = pptx.addSlide(); PAGE += 1; slides.push({ sec: 'contents', page: PAGE });
  s.background = { color: WHITE };
  T(s, 'Contents', 56, 64, 400, 56, { size: 34 });
  T(s, 'DEPTH 4 FIFO\npush · pop · 경계 상태 검증', 56, 128, 420, 52, { size: 13, color: SUB, ls: 1.1 });
  T(s, `${PAGE} / __TOTAL__`, 1140, 694, 100, 16, { size: 9, color: '94A3B8', align: 'right' });
  s.__contents = true;
  slides[slides.length - 1].obj = s;
}
function fillContents() {
  const s = slides.find((x) => x.sec === 'contents').obj;
  CONTENTS.forEach(([id, name, sub], i) => {
    const pages = slides.filter((x) => x.sec === id).map((x) => x.page);
    const pg = pages.length > 1 ? `${pages[0]} – ${pages[pages.length - 1]}` : `${pages[0]}`;
    const y = 52 + i * 62, acc = SEC[id][1];
    T(s, id, 520, y, 64, 44, { font: MONO, size: 22, bold: true, color: acc });
    T(s, name, 596, y, 420, 26, { size: 17, bold: true });
    T(s, sub, 596, y + 26, 520, 20, { size: 11.5, color: MUTED });
    T(s, 'p. ' + pg, 1110, y + 4, 120, 22, { font: MONO, size: 12, color: MUTED, align: 'right' });
    seg(s, 520, y + 54, 1230, y + 54, { color: CARDLINE, w: 1 });
  });
}

// =====================================================================
// 00 summary
// =====================================================================
function slideSummary() {
  const s = newSlide('00');
  const acc = head(s, '00', 'Summary', '16x Oversampling UART Loopback 구현 · 검증 결과', [
    'uart_rx 출력을 uart_tx 입력에 직결 → PC 송신 byte를 그대로 echo · FND 4자리 표시',
    '256 byte echo · START glitch 23 case **모두 PASS**, data bit glitch는 bit 중앙 **64 case FAIL** (ONE BIT mode)',
  ]);
  const stats = [
    ['16x', 'Oversampling', 'b_tick 6.51 µs · 1 bit = 16 tick', INK],
    ['100 MHz', '동작 주파수', '÷ 651 → 153.6 kHz b_tick → 9600.6 bps', INK],
    ['43.75 %', 'Sampling margin', 'start 검출 지연 1 tick 반영 (늦은 쪽)', INK],
    ['256 / 256', 'Loopback echo', '0x00 ~ 0xFF 송신 = echo', GOOD],
    ['23 / 23', 'START glitch', '수정 전 6 / 23 → 수정 후 전부 PASS', GOOD],
    ['256 / 320', 'Data bit glitch', 'bit 중앙 sampling edge 64 case FAIL', ALERT],
  ];
  stats.forEach(([v, k, d], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 40 + col * 404, y = 184 + row * 240;
    R(s, x, y, 384, 210, { fill: CARD, line: CARDLINE, radius: 8 });
    T(s, k, x + 24, y + 18, 340, 24, { size: 15, bold: true, color: SUB });
    T(s, v, x + 24, y + 50, 340, 84, { size: 46, bold: true, color: stats[i][3] });
    seg(s, x + 24, y + 146, x + 360, y + 146, { color: CARDLINE, w: 1 });
    T(s, d, x + 24, y + 156, 340, 40, { size: 13, color: SUB });
  });
}

// =====================================================================
// 01 목적
// =====================================================================
function slideGoal() {
  const s = newSlide('01');
  const acc = head(s, '01', '목적', 'PC ↔ FPGA UART 송수신 구현 · Loopback으로 RX · TX 동시 검증', [
    '받은 byte를 그대로 되돌려 보내는 loopback → echo 하나로 uart_rx · uart_tx 둘 다 확인',
    '수신 문자를 FND에 표시 · glitch가 들어와도 가짜 byte를 받지 않는 RX',
  ]);
  // flow strip
  const fl = [['PC', 'sender', MOD.pc], ['uart_rx', 'bit 중앙 sampling', MOD.rx], ['uart_tx', 'LSB first 송신', MOD.tx], ['PC', 'receiver', MOD.pc]];
  fl.forEach(([n, d, m], i) => {
    const x = 120 + i * 270;
    R(s, x, 178, 200, 70, { fill: m.fill, line: m.line, lw: 1.75, radius: 8 });
    T(s, n, x, 184, 200, 30, { font: MONO, size: 16, bold: true, align: 'center' });
    T(s, d, x, 214, 200, 24, { size: 12, color: SUB, align: 'center' });
    if (i < 3) seg(s, x + 204, 213, x + 266, 213, { color: WIRE, w: 2.5, arrow: true });
  });
  T(s, 'rx', 324, 190, 60, 16, { font: MONO, size: 11, bold: true, color: WIRE, align: 'center' });
  T(s, 'rx_done', 594, 192, 60, 16, { font: MONO, size: 10.5, bold: true, color: WIRE, align: 'center' });
  T(s, 'tx', 864, 190, 60, 16, { font: MONO, size: 11, bold: true, color: WIRE, align: 'center' });
  const rows = [
    [TH('#'), TH('대상'), TH('목표 동작'), TH('검증')],
    [TM('1'), TM('uart_rx', { bold: true, color: MOD.rx.line }), TC('rx fall → START 8 tick으로 bit 중앙 정렬 → 16 tick마다 1 bit → rx_done'), TC('시나리오 #1 · #2')],
    [TM('2'), TM('uart_tx', { bold: true, color: MOD.tx.line }), TC('tx_start → START · D0 ~ D7 (LSB first) · STOP 각 16 tick'), TC('시나리오 #3')],
    [TM('3'), TM('uart_loopback', { bold: true, color: MOD.top.line }), TC('rx_done → tx_start, rx_data → tx_data 직결 → echo'), TC('시나리오 #3 · 256 case')],
    [TM('4'), TM('top_ascii', { bold: true, color: SUB }), TC("ASCII → hex → FND 4자리 shift, hex 외 문자 '-'"), TC('보드 시연')],
    [TM('5'), TC('glitch 내성', { bold: true, color: ALERT, align: 'center' }), TC('START 구간 glitch → IDLE 복귀, 가짜 byte 없음'), TC('시나리오 #4 · #5')],
  ];
  table(s, rows, 40, 282, 1200, [60, 220, 690, 230], [36, 64, 64, 64, 64, 64], { size: 14 });
}

// =====================================================================
// 02 UART reference
// =====================================================================
function frameWave(s, X0, BW, HI, LO, bits, labels, color = INK) {
  const pts = [[X0 - 40, HI], [X0, HI]];
  bits.forEach((b, i) => { pts.push([X0 + i * BW, b ? HI : LO]); pts.push([X0 + (i + 1) * BW, b ? HI : LO]); });
  pts.push([X0 + bits.length * BW, HI]); pts.push([X0 + bits.length * BW + 40, HI]);
  poly(s, pts, { color, w: 2.25 });
  labels.forEach((t, i) => T(s, t, X0 + i * BW, LO + 6, BW, 18, { font: MONO, size: 10.5, bold: true, color: i === 0 || i === labels.length - 1 ? ALERT : SUB, align: 'center' }));
  for (let i = 0; i <= bits.length; i++) seg(s, X0 + i * BW, HI - 8, X0 + i * BW, LO + 4, { color: CARDLINE, w: 0.75 });
}
function slideProtocol() {
  const s = newSlide('02');
  const acc = head(s, '02', '프로토콜', 'UART: Clock 없이 Start Bit로 시점을 맞추는 비동기 직렬 통신', [
    'TX · RX 선이 따로 → 송신 · 수신 동시 가능 (**full-duplex**), 공유 clock 없음 → 양쪽이 baud만 약속',
    '8N1 frame = START(0) → D0 ~ D7 (LSB first) → STOP(1), 이 설계는 bit 중앙 1회 sampling (**ONE BIT mode**)',
  ]);
  // left : wiring
  R(s, 40, 176, 400, 300, { fill: CARD, line: CARDLINE, radius: 8 });
  label(s, '연결', 60, 186, 200, acc);
  R(s, 70, 230, 120, 200, { fill: MOD.pc.fill, line: MOD.pc.line, lw: 1.75, radius: 6 });
  T(s, 'PC', 70, 236, 120, 24, { font: MONO, size: 15, bold: true, align: 'center' });
  T(s, 'USB-UART', 70, 260, 120, 18, { font: MONO, size: 10, color: MUTED, align: 'center' });
  R(s, 290, 230, 120, 200, { fill: MOD.top.fill, line: MOD.top.line, lw: 1.75, radius: 6 });
  T(s, 'FPGA', 290, 236, 120, 24, { font: MONO, size: 15, bold: true, align: 'center' });
  T(s, 'Basys-3', 290, 260, 120, 18, { font: MONO, size: 10, color: MUTED, align: 'center' });
  pin(s, 'TX', 150, 310, 36, 'right'); pin(s, 'rx', 296, 310, 36, 'left');
  pin(s, 'RX', 150, 370, 36, 'right'); pin(s, 'tx', 296, 370, 36, 'left');
  seg(s, 190, 310, 290, 310, { color: WIRE, w: 2, arrow: true });
  seg(s, 290, 370, 190, 370, { color: WIRE, w: 2, arrow: true });
  T(s, '송신', 210, 290, 60, 16, { size: 10.5, color: WIRE, align: 'center', bold: true });
  T(s, '수신', 210, 374, 60, 16, { size: 10.5, color: WIRE, align: 'center', bold: true });
  T(s, '선 2개 → 동시 송수신', 70, 440, 340, 24, { size: 13, bold: true, color: acc, align: 'center' });

  // right : frame
  R(s, 460, 176, 780, 300, { fill: CARD, line: CARDLINE, radius: 8 });
  label(s, "8N1 frame  ·  '0' = 0x30", 480, 186, 400, acc);
  const bits = [0, 0, 0, 0, 0, 1, 1, 0, 0, 1]; // start, D0..D7 (0x30 LSB first), stop
  const lbl = ['START', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'STOP'];
  const X0 = 540, BW = 64;
  frameWave(s, X0, BW, 246, 296, bits, lbl);
  ['0', '0', '0', '0', '0', '1', '1', '0', '0', '1'].forEach((v, i) => T(s, v, X0 + i * BW, 226, BW, 16, { font: MONO, size: 11, bold: true, color: i === 0 || i === 9 ? ALERT : INK, align: 'center' }));
  T(s, 'IDLE', X0 - 76, 226, 34, 16, { font: MONO, size: 10, color: MUTED, align: 'right' });
  // sample markers
  for (let i = 0; i < 10; i++) { const c = X0 + BW / 2 + i * BW; seg(s, c, 330, c, 344, { color: MARK, w: 1.5 }); dot(s, c, 330, 4, MARK); }
  T(s, 'bit 중앙 1회 sampling (ONE BIT mode)', X0, 348, 640, 18, { size: 11.5, bold: true, color: MARK });
  // compare strip : one-bit vs 3-sample
  const bx = 480, by = 384;
  T(s, '1 bit = 16 tick', bx, by, 140, 20, { font: MONO, size: 11, bold: true, color: SUB });
  const tick = 22, tx0 = 640;
  [['ONE BIT', [8]], ['3-sample 다수결', [7, 8, 9]]].forEach(([n, arr], r) => {
    const y = by + 4 + r * 40;
    T(s, n, bx, y + 14, 150, 18, { size: 11.5, bold: true, color: r === 0 ? MARK : SUB });
    R(s, tx0, y + 12, 16 * tick, 22, { fill: WHITE, line: LINE, lw: 1 });
    for (let k = 1; k < 16; k++) seg(s, tx0 + k * tick, y + 12, tx0 + k * tick, y + 34, { color: CARDLINE, w: 0.5 });
    arr.forEach((k) => R(s, tx0 + k * tick - 5, y + 16, 10, 14, { fill: r === 0 ? MARK : SUB }));
    T(s, r === 0 ? '이 설계' : '일반 UART 옵션', tx0 + 16 * tick + 12, y + 14, 140, 18, { size: 11, color: r === 0 ? MARK : MUTED, bold: r === 0 });
  });

  // bottom cards
  card(s, 40, 498, 590, 80, 1, 'Start bit', '1 → 0 falling edge = frame 시작\n이 edge로 bit 경계 재정렬', acc, 14);
  card(s, 650, 498, 590, 80, 2, 'Stop bit', '항상 1 → 다음 falling edge 보장\n오차가 frame마다 초기화', acc, 14);
  card(s, 40, 594, 590, 80, 3, 'LSB first', "D0부터 송신 → 0x30은 0,0,0,0,1,1,0,0\nRX는 MSB에 넣고 오른쪽 shift", acc, 14);
  card(s, 650, 594, 590, 80, 4, 'ONE BIT mode', 'bit 중앙 sample 1개로 판정\nbit 중앙 glitch에 취약 (부록)', acc, 14);
}

function slideTiming() {
  const s = newSlide('02');
  const acc = head(s, '02', '동작 주파수 · 16x Oversampling', '100 MHz ÷ 651 = b_tick, 16 tick = 1 bit (104.16 µs)', [
    'F_COUNT = 100 MHz ÷ (9600 × 16) = **651** → b_tick 6.51 µs, 1 bit = 16 tick = 104.16 µs (9600.6 bps)',
    'START 8 tick 대기로 bit 중앙 정렬 → 이후 16 tick마다 sampling, rx_done은 STOP 중앙',
  ]);
  within(100, 672, CY2, 684, () => {
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
      T(s, [{ text: a + '  ', options: { color: SUB } }, { text: b, options: { bold: true, color: INK } }], x + 14, 126, 256, 32, { font: MONO, size: 14 });
      if (i < 3) seg(s, x + 278, 133, x + 302, 133, { color: acc, w: 2, arrow: true });
    });
    const X0 = 236, BW = 92, LBL = 40, LW = 128;
    const cen = (i) => X0 + BW / 2 + i * BW;
    const frame = [0, 0, 0, 0, 0, 1, 1, 0, 0, 1]; // 0x30
    const rowLabel = (t, y, h) => T(s, t, LBL, y, LW, h, { font: MONO, size: 12, bold: true, align: 'right' });
    ['START', 'D0=0', 'D1=0', 'D2=0', 'D3=0', 'D4=1', 'D5=1', 'D6=0', 'D7=0', 'STOP'].forEach((t, i) =>
      T(s, t, X0 + i * BW, 180, BW, 18, { font: MONO, size: 10.5, bold: true, color: i === 0 || i === 9 ? acc : SUB, align: 'center' }));
    for (let i = 0; i <= 10; i++) seg(s, X0 + i * BW, 182, X0 + i * BW, 238, { color: CARDLINE, w: 0.75 });
    rowLabel('rx', 200, 34);
    const HI = 204, LO = 232;
    const pts = [[X0 - 60, HI], [X0, HI]];
    frame.forEach((b, i) => { pts.push([X0 + i * BW, b ? HI : LO]); pts.push([X0 + (i + 1) * BW, b ? HI : LO]); });
    pts.push([X0 + 10 * BW, HI]); pts.push([X0 + 10 * BW + 40, HI]);
    poly(s, pts, { color: INK, w: 2 });
    for (let i = 0; i < 10; i++) { seg(s, cen(i), 196, cen(i), 470, { color: MARK, w: 1, dash: 'dash' }); dot(s, cen(i), frame[i] ? HI : LO, 4.5, MARK); }
    rowLabel('c_state', 256, 30);
    const st = [['IDLE', X0 - 60, X0, 'F1F5F9'], ['START', X0, cen(0), 'FFE4E6'], ['DATA', cen(0), cen(8), 'FECDD3'],
      ['STOP', cen(8), cen(9), 'FDA4AF'], ['IDLE', cen(9), X0 + 10 * BW + 40, 'F1F5F9']];
    st.forEach(([n, a, b, f]) => { R(s, a, 256, b - a, 30, { fill: f, line: WHITE, lw: 1 }); T(s, n, a, 256, b - a, 30, { font: MONO, size: 10.5, bold: true, align: 'center', color: MOD.rx.line }); });
    rowLabel('b_tick 수', 300, 36);
    const bracket = (a, b, t1, t2) => {
      seg(s, a + 2, 306, b - 2, 306, { color: SUB, w: 1 });
      seg(s, a + 2, 300, a + 2, 312, { color: SUB, w: 1 }); seg(s, b - 2, 300, b - 2, 312, { color: SUB, w: 1 });
      T(s, t1, (a + b) / 2 - 40, 312, 80, 16, { font: MONO, size: 10, bold: true, align: 'center' });
      if (t2) T(s, t2, (a + b) / 2 - 40, 327, 80, 14, { font: MONO, size: 9, color: MUTED, align: 'center' });
    };
    bracket(X0, cen(0), '8 tick', '52.08 µs');
    for (let i = 0; i < 9; i++) bracket(cen(i), cen(i + 1), '16 tick', '104.16 µs');
    rowLabel('rx_done', 356, 30);
    poly(s, [[X0 - 60, 380], [cen(9), 380], [cen(9), 360], [cen(9) + 5, 360], [cen(9) + 5, 380], [X0 + 10 * BW + 40, 380]], { color: INK, w: 2 });
    T(s, '1 clk', cen(9) + 10, 356, 60, 16, { font: MONO, size: 10, bold: true, color: ALERT });
    rowLabel('data_reg', 404, 30);
    const vals = ['00', '00', '00', '00', '00', '80', 'C0', '60', '30'];
    R(s, X0 - 60, 406, cen(0) - X0 + 60, 26, { fill: 'F1F5F9', line: LINE, lw: 0.75 });
    T(s, 'prev', X0 - 60, 406, cen(0) - X0 + 60, 26, { font: MONO, size: 9.5, color: MUTED, align: 'center' });
    vals.forEach((v, i) => {
      const a = cen(i), b = i === 8 ? X0 + 10 * BW + 40 : cen(i + 1);
      R(s, a, 406, b - a, 26, { fill: i === 8 ? GOODBG : WHITE, line: LINE, lw: 0.75 });
      T(s, v, a, 406, b - a, 26, { font: MONO, size: 11, bold: true, align: 'center', color: i === 8 ? GOOD : INK });
    });
    rowLabel('t (µs)', 446, 24);
    seg(s, X0 - 60, 450, X0 + 10 * BW + 40, 450, { color: SUB, w: 1, arrow: true });
    T(s, '0', X0 - 20, 454, 40, 16, { font: MONO, size: 9.5, color: SUB, align: 'center' });
    seg(s, X0, 446, X0, 454, { color: SUB, w: 1 });
    ['52.08', '156.24', '260.40', '364.56', '468.72', '572.88', '677.04', '781.20', '885.36', '989.52'].forEach((t, i) => {
      seg(s, cen(i), 446, cen(i), 454, { color: SUB, w: 1 });
      T(s, t, cen(i) - 30, 470, 60, 16, { font: MONO, size: 9.5, color: i === 9 ? ALERT : SUB, align: 'center', bold: i === 9 });
    });
    dot(s, 250, 506, 4.5, MARK); seg(s, 262, 506, 290, 506, { color: MARK, w: 1, dash: 'dash' });
    T(s, 'sampling 시점 (b_tick_cnt 도달)', 296, 497, 300, 18, { size: 11, color: SUB });
    T(s, "예시 frame = 0x30 '0' (LSB first)", 640, 497, 400, 18, { size: 11, color: SUB });
    R(s, 40, 536, 1200, 136, { fill: CARD, line: CARDLINE, radius: 8 });
    T(s, 'xsim 측정 (tb_measure.sv)', 60, 546, 600, 22, { size: 13, bold: true, color: acc });
    const res = [['b_tick 주기', '6.51 µs'], ['START 체류', '52.08 µs'], ['sample 간격', '104.16 µs'],
      ['첫 sample', 'rx fall + 156.245 µs'], ['rx_done', 'rx fall + 989.525 µs'], ['TX 시작', 'rx_done + 10 ns']];
    res.forEach(([k, v], i) => {
      const x = 60 + (i % 3) * 390, y = 576 + Math.floor(i / 3) * 44;
      T(s, k, x, y, 120, 30, { size: 13, color: SUB });
      T(s, v, x + 120, y, 260, 30, { font: MONO, size: 15, bold: true });
    });
  });
}

function slideMargin() {
  const s = newSlide('A');
  const acc = head(s, 'A', 'Margin', 'Sampling Margin: Start 검출 지연 최대 1 tick → 늦은 쪽 43.75 %', [
    'Margin = sampling 시점에서 bit 경계까지 남은 거리, bit 중앙 sampling = 양쪽 8 tick (50 %)',
    'rx fall은 b_tick 순간에만 검출 → 0 ~ 1 tick 늦게 START → 늦은 쪽 **7 tick = 43.75 %**',
  ]);
  const TK = 46, X0 = 300; // 1 tick = 52 px, bit from X0 to X0 + 16 TK
  const bitRow = (y, d, title, color) => {
    T(s, title, 40, y + 22, 160, 44, { size: 14, bold: true, color, align: 'right' });
    // previous / next bit stubs
    R(s, X0 - 2 * TK, y + 20, 2 * TK, 48, { fill: 'F1F5F9', line: LINE, lw: 0.75 });
    R(s, X0 + 16 * TK, y + 20, 2 * TK, 48, { fill: 'F1F5F9', line: LINE, lw: 0.75 });
    R(s, X0, y + 20, 16 * TK, 48, { fill: 'EFF6FF', line: WIRE, lw: 1.5 });
    for (let k = 1; k < 16; k++) seg(s, X0 + k * TK, y + 20, X0 + k * TK, y + 68, { color: 'BFDBFE', w: 0.75 });
    T(s, '이전 bit', X0 - 2 * TK, y + 20, 2 * TK, 48, { size: 10.5, color: MUTED, align: 'center' });
    T(s, '다음 bit', X0 + 16 * TK, y + 20, 2 * TK, 48, { size: 10.5, color: MUTED, align: 'center' });
    for (let k = 0; k <= 16; k += 4) T(s, String(k), X0 + k * TK - 20, y + 70, 40, 16, { font: MONO, size: 10, color: MUTED, align: 'center' });
    const sx = X0 + (8 + d) * TK;
    seg(s, sx, y + 6, sx, y + 82, { color: MARK, w: 2.5 }); dot(s, sx, y + 6, 6, MARK);
    // margin arrows
    seg(s, X0 + 4, y + 104, sx - 4, y + 104, { color: GOOD, w: 2, arrow: true });
    seg(s, sx - 4, y + 104, X0 + 4, y + 104, { color: GOOD, w: 2, arrow: true });
    seg(s, sx + 4, y + 104, X0 + 16 * TK - 4, y + 104, { color: d ? ALERT : GOOD, w: 2, arrow: true });
    seg(s, X0 + 16 * TK - 4, y + 104, sx + 4, y + 104, { color: d ? ALERT : GOOD, w: 2, arrow: true });
    T(s, `${8 + d} tick`, X0, y + 108, (8 + d) * TK, 22, { font: MONO, size: 14, bold: true, color: GOOD, align: 'center' });
    T(s, `${8 - d} tick = ${((8 - d) / 16 * 100).toFixed(2)} %`, sx, y + 108, (8 - d) * TK, 22, { font: MONO, size: 14, bold: true, color: d ? ALERT : GOOD, align: 'center' });
  };
  bitRow(176, 0, '검출 지연 0\n(edge = b_tick)', GOOD);
  bitRow(330, 1, '검출 지연 1 tick\n(worst)', ALERT);
  T(s, 'sampling 시점', X0 + 8 * TK + 12, 172, 160, 18, { size: 11, bold: true, color: MARK });
  card(s, 40, 500, 390, 84, 1, '지연 원인', 'b_tick = 1 순간만 rx 확인\n→ 최대 1 tick 늦게 START', acc, 13.5);
  card(s, 445, 500, 390, 84, 2, '늦은 쪽', 'sample이 오른쪽으로 밀림\n→ 다음 bit까지 7 tick (43.75 %)', acc, 13.5);
  card(s, 850, 500, 390, 84, 3, '이른 쪽', '왼쪽 여유는 8 ~ 9 tick\n→ 최소 50 % 유지', acc, 13.5);
  card(s, 40, 596, 1200, 76, 4, '누적 X', 'START마다 falling edge로 다시 정렬 → 지연은 frame마다 초기화, xsim에서 모든 frame rx fall → rx_done 989.525 µs 동일', acc, 13.5);
}

function slideWhy16() {
  const s = newSlide('A');
  const acc = head(s, 'A', '16x 선택 이유', '16x: Margin · Baud 정확도 · 최대 속도의 균형점', [
    'Oversampling N을 키워도 worst margin = 50 − 100/N %로 조금씩만 증가 (16x 43.75 % → 32x 46.88 %)',
    'N이 클수록 F_COUNT 정수 내림 오차 ↑ (32x **+0.16 %**) · 같은 clk에서 최대 baud = clk ÷ N ↓',
  ]);
  const Ns = [4, 8, 16, 32, 64];
  const margin = Ns.map((n) => +(50 - 100 / n).toFixed(2));
  s.addChart(pptx.ChartType.bar, [{ name: 'worst margin (%)', labels: Ns.map((n) => n + 'x'), values: margin }], {
    x: px(40), y: px(176), w: px(560), h: px(400), barDir: 'col',
    chartColors: ['94A3B8', '94A3B8', '0369A1', '94A3B8', '94A3B8'], varyColors: true,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFontSize: 13, dataLabelFontBold: true, dataLabelColor: INK, dataLabelFontFace: KO, dataLabelFormatCode: '0.00',
    valAxisMinVal: 0, valAxisMaxVal: 60, valAxisMajorUnit: 10, valAxisLabelFontSize: 11, catAxisLabelFontSize: 13,
    catAxisLabelColor: SUB, valAxisLabelColor: MUTED, valGridLine: { color: 'E2E8F0', size: 0.75 }, catGridLine: { style: 'none' },
    showLegend: false, showTitle: true, title: 'Worst sampling margin (%) = 50 − 100 / N', titleFontSize: 13, titleColor: SUB, titleFontFace: KO,
    catAxisLabelFontFace: KO, valAxisLabelFontFace: KO,
  });
  // table : F_COUNT, actual baud, error, max baud
  const rows = [[TH('N'), TH('F_COUNT'), TH('실제 baud'), TH('오차'), TH('최대 baud')]];
  Ns.forEach((n) => {
    const exact = 100e6 / (9600 * n), f = Math.floor(exact), baud = 100e6 / (f * n), err = (baud / 9600 - 1) * 100;
    const hi = n === 16 ? { bold: true, fill: { color: 'E0F2FE' } } : {};
    rows.push([TM(n + 'x', hi), TM(`${exact.toFixed(2)} → ${f}`, hi), TM(baud.toFixed(2), hi),
      TM((err >= 0 ? '+' : '') + err.toFixed(err < 0.01 ? 4 : 2) + ' %', { ...hi, color: err > 0.1 ? ALERT : INK }), TM((100 / n).toFixed(n > 16 ? 3 : 2) + ' Mbps', hi)]);
  });
  T(s, 'F_COUNT = 100 MHz ÷ (9600 × N), Verilog 정수 나눗셈 내림', 630, 180, 610, 22, { size: 13, bold: true, color: acc });
  table(s, rows, 630, 210, 610, [70, 160, 130, 110, 140], 46, { size: 13 });
  card(s, 630, 500, 610, 76, 1, '16x', 'margin 43.75 % · 오차 +0.0064 % · 최대 6.25 Mbps\n→ 9600 bps에 충분, 업계 표준 배수', acc, 13.5);
  card(s, 40, 596, 1200, 76, 2, '더 키울 경우', '32x: margin +3.1 %p 대신 baud 오차 25배 · 최대 속도 절반 → 노이즈 대책은 N보다 sample 다수결', acc, 13.5);
}

// =====================================================================
// 03 block diagrams
// =====================================================================
function slideBlock() {
  const s = newSlide('03');
  const acc = head(s, '03', 'uart_loopback', 'RX 출력이 TX 입력으로 직결된 Loopback 구조', [
    "PC sender가 보낸 '0'(0x30)을 uart_rx가 복원 → rx_data · rx_done이 uart_tx의 tx_data · tx_start로 직결",
    'baud_tick_gen 하나를 RX · TX가 공유 (b_tick 6.51 µs) → PC receiver로 0x30 그대로 echo',
  ]);
  // PC
  R(s, 50, 172, 240, 500, { fill: MOD.pc.fill, line: MOD.pc.line, lw: 1.75, radius: 8 });
  T(s, 'PC (Computer)', 50, 180, 240, 24, { font: MONO, size: 15, bold: true, align: 'center' });
  R(s, 74, 222, 192, 118, { fill: WHITE, line: MOD.pc.line, lw: 1.25, radius: 6 });
  T(s, 'sender', 74, 232, 192, 22, { font: MONO, size: 14, bold: true, align: 'center' });
  T(s, "task  '0' → 0x30", 74, 258, 192, 20, { font: MONO, size: 11, color: SUB, align: 'center' });
  pin(s, 'TX', 222, 300, 40, 'right', INK);
  R(s, 74, 504, 192, 118, { fill: WHITE, line: MOD.pc.line, lw: 1.25, radius: 6 });
  T(s, 'receiver', 74, 514, 192, 22, { font: MONO, size: 14, bold: true, align: 'center' });
  T(s, '0x30 수신', 74, 540, 192, 20, { font: MONO, size: 11, color: SUB, align: 'center' });
  pin(s, 'RX', 222, 580, 40, 'right', INK);
  // uart_loopback boundary
  R(s, 380, 172, 590, 500, { line: '818CF8', lw: 1.5, dash: 'dash', radius: 6 });
  T(s, 'uart_loopback  (uart.v)', 396, 178, 300, 20, { font: MONO, size: 12, bold: true, color: '4338CA' });
  T(s, 'clk · rst → 3 modules', 700, 178, 250, 20, { font: MONO, size: 11, color: MUTED, align: 'right' });
  // modules
  R(s, 440, 220, 300, 130, { fill: MOD.rx.fill, line: MOD.rx.line, lw: 1.75, radius: 6 });
  T(s, 'uart_rx', 440, 262, 300, 24, { font: MONO, size: 16, bold: true, align: 'center' });
  T(s, 'U_UART_RX', 440, 286, 300, 16, { font: MONO, size: 10, color: MUTED, align: 'center' });
  pin(s, 'rx', 446, 300, 40, 'left'); pin(s, 'rx_data', 650, 246, 84, 'right'); pin(s, 'rx_done', 650, 300, 84, 'right'); pin(s, 'b_tick', 550, 340, 80, 'center');
  R(s, 500, 384, 180, 70, { fill: MOD.baud.fill, line: MOD.baud.line, lw: 1.75, radius: 6 });
  T(s, 'baud_tick_gen', 500, 396, 180, 22, { font: MONO, size: 14, bold: true, align: 'center' });
  T(s, 'F_COUNT = 651', 500, 420, 180, 18, { font: MONO, size: 10.5, bold: true, color: MOD.baud.line, align: 'center' });
  R(s, 440, 490, 300, 150, { fill: MOD.tx.fill, line: MOD.tx.line, lw: 1.75, radius: 6 });
  T(s, 'uart_tx', 440, 548, 300, 24, { font: MONO, size: 16, bold: true, align: 'center' });
  T(s, 'U_UART_TX', 440, 572, 300, 16, { font: MONO, size: 10, color: MUTED, align: 'center' });
  pin(s, 'b_tick', 550, 502, 80, 'center'); pin(s, 'tx', 446, 580, 40, 'left');
  pin(s, 'tx_start', 650, 530, 84, 'right'); pin(s, 'tx_busy', 650, 580, 84, 'right'); pin(s, 'tx_data', 650, 620, 84, 'right');
  // b_tick fan-out
  seg(s, 590, 384, 590, 350, { color: WIRE, w: 1.75, arrow: true });
  seg(s, 590, 454, 590, 490, { color: WIRE, w: 1.75, arrow: true });
  wireLabel(s, 'w_b_tick', 598, 360, 90); wireLabel(s, 'w_b_tick', 598, 462, 90);
  // rx in
  seg(s, 266, 300, 440, 300, { color: WIRE, w: 2, arrow: true });
  chip(s, '0x30', 318, 276, 56, WIRE);
  // nested U routes : rx_data (outer) -> tx_data, rx_done (inner) -> tx_start
  poly(s, [[740, 246], [900, 246], [900, 620], [740, 620]], { color: WIRE, w: 3.5, arrow: true });
  poly(s, [[740, 300], [840, 300], [840, 530], [740, 530]], { color: WIRE, w: 1.75, arrow: true });
  wireLabel(s, 'w_rx_data[7:0]', 760, 224, 140); chip(s, '0x30', 906, 420, 52, WIRE);
  wireLabel(s, 'w_rx_done', 760, 278, 90); T(s, '1 clk', 846, 420, 50, 16, { font: MONO, size: 10.5, bold: true, color: ALERT });
  // tx_busy NC
  seg(s, 740, 580, 776, 580, { color: MUTED, w: 1.25 });
  seg(s, 770, 574, 782, 586, { color: ALERT, w: 1.75 }); seg(s, 770, 586, 782, 574, { color: ALERT, w: 1.75 });
  T(s, 'NC', 786, 571, 30, 18, { font: MONO, size: 10.5, bold: true, color: ALERT });
  // tx out
  seg(s, 440, 580, 266, 580, { color: WIRE, w: 2, arrow: true });
  chip(s, '0x30', 318, 556, 56, WIRE);
  // step cards
  const steps = [['sender', "'0' → 0x30\nframe 송신"], ['uart_rx', 'bit 중앙 sampling\n→ rx_data 0x30'], ['rx_done', 'STOP 중앙 1 clk\n= tx_start'], ['uart_tx', '0x30 LSB first\n→ receiver']];
  steps.forEach(([h, b], i) => {
    const y = 172 + i * 128;
    R(s, 1000, y, 240, 116, { fill: CARD, line: CARDLINE, radius: 8 });
    badge(s, 1014, y + 12, i + 1, acc, 26);
    T(s, h, 1050, y + 12, 180, 26, { font: MONO, size: 14, bold: true, color: acc });
    T(s, b, 1016, y + 46, 216, 56, { size: 13.5, ls: 1.1 });
  });
  badge(s, 72, 210, 1, acc, 22); badge(s, 428, 208, 2, acc, 22); badge(s, 852, 308, 3, acc, 22); badge(s, 428, 478, 4, acc, 22);
}

function slideSystem() {
  const s = newSlide('03');
  const acc = head(s, '03', 'top_ascii', 'top_ascii: rx_done마다 수신 문자를 FND 4자리로 Shift', [
    'rx_done마다 ASCII → hex → 7-seg font 변환 후 anode_reg 8 bit shift → 최근 4글자 표시',
    "hex 외 문자 (CR · LF 등)는 8'hFF → fnd_decoder default **'-'**, reset 값도 '----'",
  ]);
  within(100, 546, CY2, 600, () => {
    R(s, 40, 100, 1200, 446, { fill: CARD, line: CARDLINE, radius: 8 });
    T(s, 'top_ascii', 56, 108, 200, 20, { font: MONO, size: 12, bold: true, color: '4338CA' });
    moduleBox(s, 120, 168, 180, 120, MOD.top, 'uart_loopback', 'U_UART_LOOP', 'uart.v');
    moduleBox(s, 400, 168, 160, 120, MOD.glue, 'Ascii_decoder', 'U_ASCII', 'ASCII → hex');
    moduleBox(s, 650, 168, 150, 120, MOD.glue, 'fnd_decoder', 'U_FND_DEC', 'hex → segment');
    R(s, 890, 158, 120, 140, { fill: WHITE, line: INK, lw: 1.5, dash: 'dash', radius: 4 });
    T(s, 'anode_reg', 890, 196, 120, 22, { font: MONO, size: 14, bold: true, align: 'center' });
    T(s, '[31:0]', 890, 218, 120, 18, { font: MONO, size: 11, color: MUTED, align: 'center' });
    T(s, '8bit shift', 890, 238, 120, 18, { font: MONO, size: 10.5, color: '4338CA', bold: true, align: 'center' });
    shape(s, pptx.ShapeType.trapezoid, 1017, 203, 116, 50, { rotate: 90, fill: WHITE, line: INK, lw: 1.5 });
    T(s, 'MUX', 1048, 210, 54, 18, { font: MONO, size: 11, bold: true, align: 'center' });
    T(s, '4:1', 1048, 228, 54, 16, { font: MONO, size: 10, color: MUTED, align: 'center' });
    T(s, 'rx', 50, 199, 40, 18, { font: MONO, size: 13, bold: true, align: 'right' });
    seg(s, 94, 208, 120, 208, { color: WIRE, w: 1.75, arrow: true });
    T(s, 'tx', 50, 247, 40, 18, { font: MONO, size: 13, bold: true, align: 'right' });
    seg(s, 120, 256, 94, 256, { color: WIRE, w: 1.75, arrow: true });
    seg(s, 300, 208, 400, 208, { color: WIRE, w: 3.5, arrow: true });
    wireLabel(s, 'o_rx_data', 306, 186, 90);
    seg(s, 300, 256, 400, 256, { color: WIRE, w: 1.75, arrow: true });
    wireLabel(s, 'o_rx_done', 306, 234, 90);
    dot(s, 330, 256, 4.5, WIRE);
    poly(s, [[330, 256], [330, 330], [950, 330], [950, 298]], { color: WIRE, w: 1.75, arrow: true });
    T(s, 'en', 956, 304, 30, 16, { font: MONO, size: 10, color: WIRE, bold: true });
    seg(s, 560, 228, 650, 228, { color: WIRE, w: 3.5, arrow: true });
    wireLabel(s, 'w_fnd_hex', 560, 206, 90, 'center');
    T(s, '[7:0]', 575, 230, 60, 16, { font: MONO, size: 9.5, color: MUTED, align: 'center' });
    seg(s, 800, 228, 890, 228, { color: WIRE, w: 3.5, arrow: true });
    wireLabel(s, 'w_fnd_font', 800, 206, 90, 'center');
    T(s, '[7:0]', 815, 230, 60, 16, { font: MONO, size: 9.5, color: MUTED, align: 'center' });
    seg(s, 1010, 228, 1050, 228, { color: WIRE, w: 3.5, arrow: true });
    T(s, '32', 1015, 206, 30, 16, { font: MONO, size: 10, color: WIRE, bold: true, align: 'center' });
    seg(s, 1100, 228, 1126, 228, { color: WIRE, w: 3.5, arrow: true });
    T(s, 'fnd_font', 1132, 210, 96, 18, { font: MONO, size: 12, bold: true });
    T(s, '[7:0]', 1132, 228, 96, 16, { font: MONO, size: 10.5, color: MUTED });
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
    // mini FND : '0' '1' '2' '3' sample
    T(s, '실선 = module instance   ·   점선 = top_ascii 내부 always 블록', 56, 516, 700, 20, { size: 11, color: MUTED });
  });
  card(s, 40, 612, 290, 62, 1, 'echo', 'rx_data · rx_done', acc, 13);
  card(s, 343, 612, 290, 62, 2, 'decode', "hex 외 → 8'hFF", acc, 13);
  card(s, 646, 612, 290, 62, 3, 'shift', 'rx_done마다 8 bit', acc, 13);
  card(s, 949, 612, 291, 62, 4, 'scan', '4 kHz digit 선택', acc, 13);
}

// =====================================================================
// 04 ASM charts
// =====================================================================
const COLW = 300, ENTRY_Y = 106, RAIL_Y = 118, SB_Y = 130;
function colGeom(k) { const L = 40 + COLW * k; return { L, cx: L + 105, rail: L + 294, gut: L + 14 }; }
function stateBox(s, cx, name, actions, color, tint) {
  const w = 164, x = cx - w / 2;
  R(s, x, SB_Y, w, 24, { fill: color });
  T(s, name, x, SB_Y, w, 24, { font: MONO, size: 12.5, bold: true, color: WHITE, align: 'center' });
  R(s, x, SB_Y + 24, w, 42, { fill: tint, line: color, lw: 1.5 });
  T(s, actions.length ? actions.join('\n') : '—', x + 4, SB_Y + 24, w - 8, 42, { font: MONO, size: 10, align: 'center', color: actions.length ? INK : MUTED, ls: 0.95 });
}
function condBox(s, x, y, w, h, lines, color, size = 9.5) {
  R(s, x, y, w, h, { fill: WHITE, line: color, lw: 1.25, radius: Math.min(h / 2, 16) });
  T(s, lines.join('\n'), x + 2, y, w - 4, h, { font: MONO, size, align: 'center', ls: 0.95 });
}
function brLabel(s, t, x, y, w = 20) { T(s, t, x, y, w, 14, { font: MONO, size: 10, bold: true, color: MARK, align: 'center' }); }
function entry(s, g, color) { seg(s, g.cx, ENTRY_Y, g.cx, SB_Y, { color, w: 1.5, arrow: true }); }
function railTo(s, g, ys, color) {
  const maxY = Math.max(...ys);
  poly(s, [[g.rail, maxY], [g.rail, RAIL_Y], [g.cx, RAIL_Y]], { color, w: 1.25 });
  dot(s, g.cx, RAIL_Y, 3.5, color);
  ys.forEach((y) => { if (y !== maxY) dot(s, g.rail, y, 3.5, color); });
}
function nextCol(s, from, toG, color) { poly(s, [[from.x, from.y], [from.x, 566], [toG.gut, 566], [toG.gut, ENTRY_Y], [toG.cx, ENTRY_Y]], { color, w: 1.5 }); }
function asmLegend(s, color, tint) { // compact one-line legend
  const y = 616;
  R(s, 60, y + 2, 40, 10, { fill: color }); R(s, 60, y + 12, 40, 14, { fill: tint, line: color, lw: 1 });
  T(s, 'State box', 108, y + 2, 120, 24, { size: 11, color: SUB });
  shape(s, pptx.ShapeType.diamond, 230, y + 1, 40, 26, { fill: WHITE, line: INK, lw: 1 });
  T(s, 'Decision box', 278, y + 2, 120, 24, { size: 11, color: SUB });
  R(s, 400, y + 4, 44, 20, { fill: WHITE, line: color, lw: 1, radius: 10 });
  T(s, 'Conditional output', 452, y + 2, 170, 24, { size: 11, color: SUB });
  dot(s, 632, y + 14, 4, color);
  T(s, 'path merge', 642, y + 2, 100, 24, { size: 11, color: SUB });
  T(s, '←  다음 clock edge 갱신   ·   T / F  조건 참 / 거짓', 770, y + 2, 440, 24, { size: 11, color: SUB });
}
function slideRxAsm() {
  const s = newSlide('A');
  const acc = head(s, 'A', 'uart_rx ASM', 'uart_rx ASM: START 중앙 정렬 후 16 tick마다 Sampling', [
    'rx fall 검출 → START 8 tick 동안 rx = 0 유지 확인, **rx = 1일 경우 IDLE 복귀** (glitch 거름) → bit 중앙 도달',
    'DATA에서 16 tick마다 1 bit shift (8회) → STOP 중앙에서 rx_done 1 clk',
  ]);
  within(84, 642, CY2 - 4, 688, () => {
    const C = MOD.rx.line, TINT = MOD.rx.fill;
    const g = [0, 1, 2, 3].map(colGeom);
    const D1 = 228, D2 = 300;
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
    seg(s, g[0].cx, 92, g[0].cx, ENTRY_Y, { color: INK, w: 1.5 });
    T(s, 'rst', g[0].cx - 40, 88, 34, 16, { font: MONO, size: 10.5, bold: true, align: 'right' });

    // START : rx re-check every clock, then b_tick / count
    {
      const k = 1, L = g[k].L, cx = g[k].cx, R0 = 226, RB = 304, RC = 376;
      entry(s, g[k], C);
      stateBox(s, cx, 'START', [], C, TINT);
      seg(s, cx, 196, cx, R0 - 22, { color: C, w: 1.5, arrow: true });
      diamond(s, cx, R0, 92, 44, 'rx', { line: ALERT });
      // rx = 1 -> abort to IDLE
      seg(s, cx + 46, R0, L + 172, R0, { color: ALERT, w: 1.25, arrow: true }); brLabel(s, '1', cx + 50, R0 - 16);
      condBox(s, L + 172, R0 - 28, 112, 56, ['b_tick_cnt ← 0', 'bit_cnt ← 0', 'data_reg ← 0'], ALERT, 8.5);
      seg(s, L + 228, R0 + 28, L + 228, R0 + 40, { color: ALERT, w: 1.25, arrow: true });
      R(s, L + 190, R0 + 40, 76, 20, { fill: BADBG, line: ALERT, lw: 1.25, radius: 10 });
      T(s, '→ IDLE', L + 190, R0 + 40, 76, 20, { font: MONO, size: 9.5, bold: true, color: ALERT, align: 'center' });
      seg(s, cx, R0 + 22, cx, RB - 24, { color: C, w: 1.5, arrow: true }); brLabel(s, '0', cx + 2, R0 + 24);
      diamond(s, cx, RB, 104, 48, 'b_tick');
      seg(s, cx + 52, RB, g[k].rail, RB, { color: C, w: 1.25 }); brLabel(s, '0', cx + 56, RB - 16);
      seg(s, cx, RB + 24, cx, RC - 32, { color: C, w: 1.5, arrow: true }); brLabel(s, '1', cx + 2, RB + 26);
      diamond(s, cx, RC, 124, 64, 'b_tick_cnt\n== 7');
      seg(s, cx + 62, RC, L + 184, RC, { color: C, w: 1.25, arrow: true }); brLabel(s, 'F', L + 168, RC + 2, 14);
      condBox(s, L + 184, RC - 22, 104, 44, ['b_tick_cnt ←', 'b_tick_cnt + 1'], C, 9);
      seg(s, L + 288, RC, g[k].rail, RC, { color: C, w: 1.25 });
      seg(s, cx, RC + 32, cx, 424, { color: C, w: 1.5, arrow: true }); brLabel(s, 'T', cx + 2, RC + 34);
      condBox(s, cx - 80, 424, 160, 56, ['b_tick_cnt ← 0', 'bit_cnt ← 0', 'data_reg ← 0'], C);
      railTo(s, g[k], [RB, RC], C);
      nextCol(s, { x: cx, y: 480 }, g[2], C);
    }

    const common = (k, name, cnt) => {
      entry(s, g[k], C);
      stateBox(s, g[k].cx, name, [], C, TINT);
      seg(s, g[k].cx, 196, g[k].cx, D1 - 24, { color: C, w: 1.5, arrow: true });
      diamond(s, g[k].cx, D1, 104, 48, 'b_tick');
      seg(s, g[k].cx, D1 + 24, g[k].cx, D2 - 32, { color: C, w: 1.5, arrow: true }); brLabel(s, '1', g[k].cx + 2, D1 + 26);
      diamond(s, g[k].cx, D2, 124, 64, `b_tick_cnt\n== ${cnt}`);
      seg(s, g[k].cx + 52, D1, g[k].rail, D1, { color: C, w: 1.25 }); brLabel(s, '0', g[k].cx + 56, D1 - 16);
      seg(s, g[k].cx + 62, D2, g[k].L + 184, D2, { color: C, w: 1.25, arrow: true }); brLabel(s, 'F', g[k].L + 168, D2 + 2, 14);
      condBox(s, g[k].L + 184, D2 - 22, 104, 44, ['b_tick_cnt ←', 'b_tick_cnt + 1'], C, 9);
      seg(s, g[k].L + 288, D2, g[k].rail, D2, { color: C, w: 1.25 });
      seg(s, g[k].cx, D2 + 32, g[k].cx, 350, { color: C, w: 1.5, arrow: true }); brLabel(s, 'T', g[k].cx + 2, D2 + 34);
    };
    common(2, 'DATA', 15);
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
    common(3, 'STOP', 15);
    condBox(s, g[3].cx - 70, 350, 140, 34, ['rx_done ← 1'], C);
    railTo(s, g[3], [D1, D2], C);
    poly(s, [[g[3].cx, 384], [g[3].cx, 600], [g[0].gut, 600], [g[0].gut, ENTRY_Y], [g[0].cx, ENTRY_Y]], { color: C, w: 1.5 });
    [['rx fall 검출', 0], ['8 tick · 52.08 µs', 1], ['16 tick × 8 · 833.28 µs', 2], ['16 tick · 104.16 µs', 3]].forEach(([t, k]) =>
      T(s, t, g[k].L + 116, 574, 182, 18, { font: MONO, size: 10.5, bold: true, color: C }));
    asmLegend(s, C, TINT);
  });
}
function slideTxAsm() {
  const s = newSlide('A');
  const acc = head(s, 'A', 'uart_tx ASM', 'uart_tx ASM: tx_start 후 각 Bit 16 tick 유지, LSB First', [
    'IDLE에서 tx_start = 1 → tx_data latch → START(0) · D0 ~ D7 · STOP(1) 각 16 tick 송신',
    'tx_start는 IDLE에서만 확인, tx_busy는 START ~ STOP 동안 1',
  ]);
  within(84, 642, CY2 - 4, 688, () => {
    const C = MOD.tx.line, TINT = MOD.tx.fill;
    const g = [0, 1, 2, 3].map(colGeom);
    const D1 = 228, D2 = 300;
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
  });
}

// =====================================================================
// 05 simulation
// =====================================================================
const P = {}; // page numbers of referenced slides (filled during build)
function slideScenario() {
  const s = newSlide('05');
  const acc = head(s, '05', '시나리오', 'UART_LOOPBACK 검증 시나리오', [
    '시나리오 5개 — RX 타이밍 · Data sampling · TX echo (256 case) · START glitch (23 case) · Data bit glitch (320 case)',
    '#1 ~ #4 기대값 일치, #5는 bit 중앙 glitch **64 case FAIL** → ONE BIT mode 한계 (고찰)',
  ]);
  s.__scenario = true; slides[slides.length - 1].obj = s;
}
function fillScenario() {
  const s = slides.find((x) => x.obj && x.obj.__scenario).obj;
  const pg = (k) => `p. ${P[k]}`;
  const name = (t, p) => TC([{ text: t, options: { bold: true, breakLine: true } }, { text: p, options: { fontSize: 10, color: MUTED } }]);
  const rows = [
    [TH('#', '1E40AF'), TH('시나리오', '1E40AF'), TH('입력 (Stimulus)', '1E40AF'), TH('확인 신호', '1E40AF'), TH('예상 결과', '1E40AF'), TH('결과', '1E40AF')],
    [TM('1', { bold: true, color: '1E40AF' }), name('rx 프로토콜 동작 타이밍 분석', pg('sim1')), TC('rx 1 → 0 후 9600 bps 간격 데이터 송신 (sender), stop 0 → 1'), TC('rx, c_state, b_tick_cnt, state 간 타이밍'), TC('rx 1 → 0 후 다음 b_tick에서 START, b_tick_cnt == 7에서 DATA'), PASS('일치')],
    [TM('2', { bold: true, color: '1E40AF' }), name('Data sampling', pg('sim2')), TC("8'h00 ~ 8'hFF 256 case input (rx sender)"), TC('rx, rx_data_reg, tx, tx_data_reg'), TC("DATA 구간 b_tick_cnt == 15마다 rx_data shift, LSB부터 채움"), PASS('일치')],
    [TM('3', { bold: true, color: '1E40AF' }), name('TX 송신 · Loopback echo', pg('sim3')), TC('#2와 같은 256 byte, receive_uart로 tx 역변환 후 비교'), TC('rx_done, tx_start, tx, tx c_state'), TC('rx_done → tx_start, START · D0 ~ D7 · STOP, echo = 송신 byte'), PASS('256 / 256')],
    [TM('4', { bold: true, color: '1E40AF' }), name('START glitch', `${pg('ts1')} · 부록`), TC('20 ns ~ 50 µs low pulse 16개 · burst 2개 · glitch 뒤 byte 5개'), TC('rx_done 횟수, tx echo 횟수, rx_data'), TC('glitch 무시 (rx_done · echo 0회), 뒤 byte 정상 1회'), PASS('23 / 23')],
    [TM('5', { bold: true, color: '1E40AF' }), name('Data bit glitch', '부록'), TC('0x55 · 0xAA, bit 0 ~ 7에 20 ns ~ 6 µs 반대 레벨 pulse, bit 중앙 ±0 · 1 · 7 tick'), TC('rx_data, tx echo, rx_done 횟수'), TC('1 tick 미만 glitch → data 유지'), FAIL('256 / 320')],
  ];
  table(s, rows, 40, 176, 1200, [44, 220, 300, 220, 296, 120], [36, 84, 84, 84, 84, 84], { size: 12.5 });
}

// import slide helper: chrome + 결론 + record what to copy from the HW deck
function importSlide(sec, sub, title, lines, src, keep, tf, fix, extra) {
  const s = newSlide(sec);
  const acc = head(s, sec, sub, title, lines);
  importMap.push({ slide: PAGE, src, keep, tf: tf || null, fix: fix || [] });
  if (extra) extra(s, acc);
  return PAGE;
}
function slideSims() {
  P.sim1 = importSlide('05', '#1 RX 프로토콜 타이밍', 'RX 타이밍: rx Fall 다음 b_tick에 START, 8 tick 뒤 DATA', [
    '① rx deassert → b_tick = 1인 clk에 IDLE → START',
    '② Sampling timing 일치 — START **52.08 µs** · DATA bit 간격 **104.16 µs**',
  ], 6, [3], { s: 1.12, ax: 232, ay: 197, bx: 148, by: 176 }, [['52us', '52.08us'], ['104.6us', '104.16us']]);
  P.sim2 = importSlide('05', '#2 Data Sampling', 'Data Sampling: b_tick_cnt == 15마다 1 bit Shift, STOP에서 8 bit 완성', [
    'DATA 구간 b_tick_cnt == 15마다 rx를 data_reg MSB에 넣고 오른쪽 shift → D0 ~ D7 수신',
    'STOP 중앙 (b_tick_cnt == 15)에서 rx_done 1 clk → ASM STOP 동작과 일치',
  ], 7, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  P.sim3 = importSlide('05', '#3 TX Echo', 'TX Echo: rx_done → tx_start, 수신 Byte를 LSB부터 재송신', [
    'rx_done 1 clk → tx_start → tx가 같은 byte를 START · D0 ~ D7 · STOP으로 송신',
    "8'h00 ~ 8'hFF **256 case echo 모두 PASS**",
  ], 8, [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], { s: 1, ax: 136, ay: 226, bx: 40, by: 168 }, [], (s, acc) => {
    const steps = [['rx_done → tx_start', 'STOP 중앙 1 clk pulse'], ['tx = 0 (START)', 'tx_start 다음 clk부터'], ['data shift 송신', 'START에서 rx_data 저장\n→ 16 tick마다 1 bit'], ['tx = 1 (STOP)', 'STOP 후 IDLE 복귀']];
    steps.forEach(([h, b], i) => {
      const y = 168 + i * 90;
      R(s, 985, y, 255, 80, { fill: CARD, line: CARDLINE, radius: 6 });
      shape(s, pptx.ShapeType.ellipse, 995, y + 10, 26, 26, { fill: 'FDE047', line: INK, lw: 1 });
      T(s, String(i + 1), 995, y + 10, 26, 26, { font: MONO, size: 12, bold: true, align: 'center' });
      T(s, h, 1028, y + 10, 206, 26, { size: 14, bold: true });
      T(s, b, 1000, y + 40, 234, 36, { size: 12, color: SUB, valign: 'top' });
    });
    tag(s, '256 / 256 PASS', 985, 534, 255, true, 40);
  });
}

// =====================================================================
// 06 troubleshooting
// =====================================================================
function stepChips(s, active) {
  ['① 현상', '② 원인', '③ 해결', '④ 적용 결과'].forEach((t, i) => {
    const on = active.includes(i);
    R(s, 780 + i * 96, 20, 88, 22, { fill: on ? ALERT : WHITE, line: on ? ALERT : LINE, radius: 11 });
    T(s, t, 780 + i * 96, 20, 88, 22, { size: 10.5, bold: true, color: on ? WHITE : MUTED, align: 'center' });
  });
}
function slideTrouble() {
  P.ts1 = importSlide('06', '트러블 슈팅 1', '트러블 슈팅 1: rx Glitch가 가짜 Byte로 수신 · Echo', [
    '① 현상 — START glitch 23 case 중 **17 FAIL**, glitch 하나에 가짜 0xFF 수신 · echo',
    '② 원인 — START에서 rx를 다시 보지 않고 8 tick 뒤 DATA 진입 → glitch를 start bit로 처리',
  ], 9, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], { s: 1, ax: 0, ay: 0, bx: 0, by: 28 }, [], (s, acc) => {
    stepChips(s, [0, 1]);
    label(s, '① 현상', 40, 166, 200, acc);
    T(s, 'glitch test FAIL · Rx / Tx에 가짜 frame', 130, 166, 460, 26, { size: 13, color: SUB });
    label(s, '② 원인', 612, 166, 200, acc);
    T(s, 'IDLE → START 직후 rx 재확인 없음', 702, 166, 500, 26, { size: 13, color: SUB });
  });
  importSlide('06', '트러블 슈팅 1', '트러블 슈팅 1: START에서 rx 재확인 → Glitch 23 Case PASS', [
    '③ 해결 — START 동안 rx = 0일 때만 b_tick_cnt 증가, **rx = 1일 경우 IDLE 복귀**',
    '④ 적용 결과 — glitch **23 case 모두 PASS**, glitch 입력에도 tx 변화 없음',
  ], 10, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], null, [], (s, acc) => {
    stepChips(s, [2, 3]);
    label(s, '③ 해결', 50, 172, 200, acc);
    T(s, 'START 블록 수정 (전 → 후)', 140, 172, 420, 26, { size: 13, color: SUB });
    label(s, '④ 적용 결과', 635, 172, 200, acc);
    T(s, 'GLITCH Result pass 23 · fail 0', 765, 172, 460, 26, { size: 13, color: SUB });
  });
}

// =====================================================================
// 07 demo
// =====================================================================
function slideDemo() {
  importSlide('07', 'Basys-3', '시연: PC 입력 6줄 모두 FND 표시 · Echo 일치', [
    'ComPortMaster (COM4 · 9600 · 8N1)로 0123 · 4567 · 89AB · CDEF · abcd · --ef 송신 → FND에 마지막 4글자',
    "Recv 창 echo = 송신 문자열, 소문자 a ~ f도 hex 표시, hex 외 문자 **'-'**",
  ], 11, [1, 2, 3, 4, 5, 6, 7], { s: 1, ax: 0, ay: 0, bx: 0, by: 44 });
}

// =====================================================================
// 08 결론 · 고찰
// =====================================================================
function slideConclusion() {
  const s = newSlide('08');
  const acc = head(s, '08', '결론 · 고찰', 'UART Loopback 구조로 uart_tx · uart_rx 검증 완료', [
    'Loopback echo 256 / 256 · 보드 시연 일치 → uart_tx · uart_rx 동작 검증 완료',
    'START에서 rx 재확인 → rx glitch로 인한 데이터 오입력 방지 (glitch 23 case 6 → **23 PASS**)',
  ]);
  T(s, '결론', 40, 172, 300, 28, { size: 17, bold: true, color: GOOD });
  const rows = [
    [TH('검증'), TH('결과'), TH('판정')],
    [TC('#1 RX 타이밍'), TM('ASM과 일치'), PASS()],
    [TC('#2 · #3 256 byte loopback echo'), TM('256 / 256'), PASS()],
    [TC('#4 START glitch (20 ns ~ 50 µs)'), TM('6 → 23 / 23'), PASS()],
    [TC('#5 Data bit glitch (1 tick 미만)'), TM('256 / 320'), FAIL()],
    [TC('보드 시연 (6줄 입력)'), TM('FND · echo 일치'), PASS()],
  ];
  table(s, rows, 40, 206, 640, [330, 200, 110], [34, 52, 52, 52, 52, 52], { size: 13 });
  // 고찰
  R(s, 710, 172, 530, 220, { fill: WHITE, line: 'C2410C', lw: 1.5, radius: 6 });
  R(s, 710, 172, 530, 36, { fill: 'C2410C', radius: 6 });
  T(s, '고찰 — ONE BIT mode 한계', 726, 172, 500, 36, { size: 15, bold: true, color: WHITE });
  T(s, [
    { text: 'bit 중앙 sample 1개로 판정 → DATA 구간 glitch가 그 sampling edge를 덮을 경우 해당 bit 반전', options: { bullet: true, breakLine: true } },
    { text: '1 tick 미만 glitch 320 case 중 bit 중앙 64 case FAIL, ±1 · ±7 tick 위치는 PASS', options: { bullet: true, breakLine: true } },
    { text: 'rx_done · echo는 정상으로 나가서 오류가 드러나지 않음', options: { bullet: true } },
  ], 726, 214, 500, 170, { size: 13.5, valign: 'top', psa: 6 });
  // 개선 방향
  R(s, 710, 410, 530, 262, { fill: WHITE, line: '1E3A8A', lw: 1.5, radius: 6 });
  R(s, 710, 410, 530, 36, { fill: '1E3A8A', radius: 6 });
  T(s, '개선 방향', 726, 410, 500, 36, { size: 15, bold: true, color: WHITE });
  T(s, [
    { text: 'bit 중앙 3 sample (7 · 8 · 9 tick) 다수결 → 1 tick 미만 glitch는 1표만 바꿔 제거', options: { bullet: { type: 'number' }, breakLine: true } },
    { text: '1 tick 이상 glitch → parity · CRC로 오류 검출 후 재전송 요청, 또는 ECC로 정정', options: { bullet: { type: 'number' }, breakLine: true } },
    { text: 'TX 앞 FIFO + tx_busy 사용 → 연속 수신 시 echo 누락 방지', options: { bullet: { type: 'number' } } },
  ], 726, 452, 500, 210, { size: 13.5, valign: 'top', psa: 6 });
  T(s, '데이터 오입력 방지 구조', 40, 540, 640, 26, { size: 15, bold: true, color: acc });
  const flow = [['IDLE', 'rx fall'], ['START', 'rx = 0 유지 확인'], ['DATA', 'bit 중앙 sampling'], ['STOP', 'rx_done']];
  flow.forEach(([n, d], i) => {
    const x = 40 + i * 162;
    R(s, x, 574, 144, 70, { fill: MOD.rx.fill, line: i === 1 ? ALERT : MOD.rx.line, lw: i === 1 ? 2.5 : 1.5, radius: 6 });
    T(s, n, x, 580, 144, 26, { font: MONO, size: 15, bold: true, align: 'center', color: MOD.rx.line });
    T(s, d, x, 606, 144, 30, { size: 11.5, align: 'center', color: i === 1 ? ALERT : SUB, bold: i === 1 });
    if (i < 3) seg(s, x + 146, 609, x + 160, 609, { color: MOD.rx.line, w: 2, arrow: true });
  });
}

function slideQnA() {
  const s = pptx.addSlide(); PAGE += 1; slides.push({ sec: 'qna', page: PAGE });
  s.background = { color: INK };
  T(s, 'Q & A', 0, 250, 1280, 80, { size: 44, bold: true, color: WHITE, align: 'center' });
  T(s, '감사합니다', 0, 336, 1280, 40, { size: 20, color: 'CBD5E1', align: 'center' });
  T(s, '정안성', 0, 400, 1280, 30, { size: 14, color: '94A3B8', align: 'center' });
}

// =====================================================================
// Appendix (glitch test)
// =====================================================================
function slideApxPlacement() {
  const s = newSlide('A');
  const acc = head(s, 'A', 'Glitch 입력 방법', 'Glitch 입력: RX Sampling Edge 기준 On-tick / Off-tick 배치', [
    'IDLE은 b_tick = 1인 clk edge(E)에서만 rx 확인 → glitch 결과는 폭보다 **E를 덮었는지**로 결정',
    'off-tick = E + 3 ns 시작 (안 덮음), on-tick = E 중심 배치 (덮음) → 확률의 양 끝 0 % · 100 % 확인',
  ]);
  within(104, 672, CY2, 686, () => {
    const XA = (t) => 190 + (t + 25) * 9.6;
    R(s, 40, 104, 770, 262, { fill: CARD, line: CARDLINE, radius: 6 });
    T(s, 'ns 확대  ·  sampling edge E 주변', 56, 114, 600, 22, { size: 13, bold: true, color: SUB });
    for (let t = -20; t <= 30; t += 10) seg(s, XA(t), 156, XA(t), 344, { color: LINE, w: 0.75, dash: 'sysDot' });
    seg(s, XA(0), 154, XA(0), 344, { color: MARK, w: 1.5, dash: 'dash' });
    T(s, 'E', XA(0) + 4, 140, 20, 14, { font: MONO, size: 11, bold: true, color: MARK });
    const W = (y, ch, t1, col) => {
      const pts = [];
      ch.forEach(([t, l]) => { const yy = l ? y : y + 26; if (pts.length) pts.push([XA(t), pts[pts.length - 1][1]]); pts.push([XA(t), yy]); });
      pts.push([XA(t1), pts[pts.length - 1][1]]);
      poly(s, pts, { color: col, w: 2 });
    };
    [['clk', 160, [[-25, 0], [-20, 1], [-15, 0], [-10, 1], [-5, 0], [0, 1], [5, 0], [10, 1], [15, 0], [20, 1], [25, 0], [30, 1]], INK],
      ['b_tick', 204, [[-25, 0], [-10, 1], [0, 0]], MOD.baud.line],
      ['rx off-tick', 250, [[-25, 1], [3, 0]], ALERT],
      ['rx on-tick', 296, [[-25, 1], [-8, 0], [12, 1]], ALERT]].forEach(([n, y, ch, col]) => {
      T(s, n, 56, y, 120, 26, { font: MONO, size: 11, bold: true });
      W(y, ch, 35, col);
    });
    T(s, 'E + 3 ns', XA(3) + 4, 248, 90, 14, { font: MONO, size: 10, color: ALERT, bold: true });
    T(s, 'E − 8 ns', XA(-8) - 92, 294, 88, 14, { font: MONO, size: 10, color: ALERT, bold: true, align: 'right' });
    T(s, 'E + 12 ns (w = 20 ns)', XA(12) + 4, 294, 160, 14, { font: MONO, size: 10, color: ALERT, bold: true });
    T(s, '점선 = clk edge (10 ns)', 560, 340, 240, 18, { size: 10, color: MUTED, align: 'right' });
    // us view
    const XB = (t) => 190 + (t + 0.8) * 55;
    R(s, 40, 380, 770, 292, { fill: CARD, line: CARDLINE, radius: 6 });
    T(s, 'µs 단위  ·  E 간격 1 tick = 6,510 ns', 56, 390, 600, 22, { size: 13, bold: true, color: SUB });
    [[0, 'E0'], [6.51, 'E1']].forEach(([t, n]) => {
      seg(s, XB(t), 432, XB(t), 660, { color: MARK, w: 1.5, dash: 'dash' });
      T(s, n, XB(t) - 20, 416, 40, 14, { font: MONO, size: 11, bold: true, color: MARK, align: 'center' });
    });
    const WB = (y, ch, col) => {
      const pts = [];
      ch.forEach(([t, l]) => { const yy = l ? y : y + 26; if (pts.length) pts.push([XB(t), pts[pts.length - 1][1]]); pts.push([XB(t), yy]); });
      pts.push([XB(8.8), pts[pts.length - 1][1]]);
      poly(s, pts, { color: col, w: 2 });
    };
    T(s, 'b_tick', 56, 440, 120, 22, { font: MONO, size: 11, bold: true });
    WB(440, [[-0.8, 0], [-0.04, 1], [0, 0], [6.47, 1], [6.51, 0]], MOD.baud.line);
    [['rx off w=2,000', 486, [[-0.8, 1], [0.003, 0], [2.003, 1]], true, 2.003],
      ['rx off w=6,510', 538, [[-0.8, 1], [0.003, 0], [6.513, 1]], false, 6.513],
      ['rx on  w=2,000', 590, [[-0.8, 1], [5.512, 0], [7.512, 1]], false, 7.512]].forEach(([n, y, ch, ok, te]) => {
      T(s, n, 56, y, 130, 26, { font: MONO, size: 10.5, bold: true });
      WB(y, ch, ALERT);
      tag(s, ok ? 'E 안 덮음' : 'E1 덮음', XB(te) + 10, y + 2, 100, ok);
    });
    R(s, 830, 104, 410, 262, { fill: WHITE, line: CARDLINE, radius: 6 });
    T(s, '입력 task', 846, 114, 380, 22, { size: 13, bold: true, color: acc });
    T(s, [
      { text: 'align_glitch', options: { fontFace: MONO, bold: true, breakLine: true } },
      { text: 'b_tick 상승 후 지연으로 E 기준 위치 고정', options: { breakLine: true } },
      { text: ' ', options: { breakLine: true } },
      { text: 'sender_glitch (폭, 개수, 간격)', options: { fontFace: MONO, bold: true, breakLine: true } },
      { text: 'low pulse 개수만큼 반복 → 종료 후 rx = 1', options: { breakLine: true } },
      { text: ' ', options: { breakLine: true } },
      { text: 'check_glitch', options: { fontFace: MONO, bold: true, breakLine: true } },
      { text: 'rx_done · tx echo 횟수 비교 → PASS / FAIL', options: {} },
    ], 846, 142, 380, 214, { size: 13, valign: 'top', ls: 1.05 });
    card(s, 830, 380, 410, 92, 1, 'off-tick', 'E + 3 ns에서 low 시작\n폭 6,507 ns 미만 → 다음 E 안 덮음', acc);
    card(s, 830, 480, 410, 92, 2, 'on-tick', 'E 중심 + 2 ns에 low 배치\n폭과 무관하게 E 덮음', acc);
    card(s, 830, 580, 410, 92, 3, '+2 / +3 ns', 'rx edge를 clk 격자 밖에 둠\nTB · RTL race 없음', acc);
  });
}
function slideApxBurst() {
  const s = newSlide('A');
  const acc = head(s, 'A', 'Glitch 입력 방법', 'Burst · Glitch 뒤 Byte: Sampling Edge 통과와 Byte 손실 확인', [
    'Burst — 짧은 pulse 여러 개가 E를 지나가는 chattering 재현 (5 µs · 15 µs)',
    'Glitch + byte — glitch 뒤 1 · 3 · 12 bit 간격으로 실제 byte 송신 → 가짜 frame과 겹침 확인',
  ]);
  within(104, 672, CY2, 686, () => {
    R(s, 40, 104, 1200, 232, { fill: CARD, line: CARDLINE, radius: 6 });
    T(s, 'Burst (chattering)  ·  t = 0 = E0 + 3 ns', 56, 114, 600, 22, { size: 13, bold: true, color: SUB });
    const XA = (t) => 230 + (t + 0.6) * 50;
    [[-0.003, 'E0'], [6.507, 'E1'], [13.017, 'E2']].forEach(([t, n]) => {
      seg(s, XA(t), 156, XA(t), 320, { color: MARK, w: 1.5, dash: 'dash' });
      T(s, n, XA(t) + 4, 140, 30, 14, { font: MONO, size: 11, bold: true, color: MARK });
    });
    const burst = (w, n, g) => { const c = [[-0.6, 1]]; for (let k = 0; k < n; k++) { const t0 = k * (w + g) / 1000; c.push([t0, 0], [t0 + w / 1000, 1]); } return c; };
    const WA = (y, ch) => {
      const pts = [];
      ch.forEach(([t, l]) => { const yy = l ? y : y + 34; if (pts.length) pts.push([XA(t), pts[pts.length - 1][1]]); pts.push([XA(t), yy]); });
      pts.push([XA(16.6), pts[pts.length - 1][1]]);
      poly(s, pts, { color: ALERT, w: 2 });
    };
    T(s, 'A  200 ns × 5', 56, 168, 170, 20, { font: MONO, size: 11, bold: true }); T(s, '   gap 1,000 ns', 56, 188, 170, 20, { font: MONO, size: 10.5, color: MUTED });
    WA(168, burst(200, 5, 1000));
    T(s, '총 5.0 µs → E0 ~ E1 사이', XA(5.0) + 12, 174, 220, 22, { size: 11, color: SUB });
    T(s, 'B  1,000 ns × 8', 56, 248, 170, 20, { font: MONO, size: 11, bold: true }); T(s, '   gap 1,000 ns', 56, 268, 170, 20, { font: MONO, size: 10.5, color: MUTED });
    WA(248, burst(1000, 8, 1000));
    R(s, XA(6.0), 244, XA(7.0) - XA(6.0), 42, { line: ALERT, lw: 2, radius: 3 });
    T(s, '4번째 pulse 6,000 ~ 7,000 ns가 E1 (6,507 ns) 덮음', XA(6.0) - 40, 292, 420, 18, { size: 10.5, color: ALERT, bold: true });
    R(s, 40, 350, 1200, 322, { fill: CARD, line: CARDLINE, radius: 6 });
    T(s, 'Glitch + byte  ·  200 ns glitch(on-tick) → gap → 0x55, 단위 bit (1 bit = 104,160 ns)', 56, 360, 1000, 22, { size: 13, bold: true, color: SUB });
    const XB = (b) => 250 + (b + 0.3) * 38;
    for (let b = 0; b <= 22; b += 2) {
      seg(s, XB(b), 410, XB(b), 416, { color: MUTED, w: 0.75 });
      T(s, String(b), XB(b) - 12, 396, 24, 12, { font: MONO, size: 9, color: MUTED, align: 'center' });
    }
    seg(s, XB(9.5), 416, XB(9.5), 660, { color: MARK, w: 1.25, dash: 'dash' });
    T(s, '9.5 bit: 가짜 frame rx_done · IDLE 복귀 (수정 전)', XB(9.5) + 4, 416, 330, 14, { size: 9.5, color: MARK, bold: true });
    [['gap 1 bit', 1, true], ['gap 3 bit', 3, true], ['gap 12 bit', 12, false]].forEach(([n, g, ph2], i) => {
      const y = 446 + i * 70;
      T(s, n, 56, y, 180, 24, { font: MONO, size: 11, bold: true });
      seg(s, XB(0), y - 2, XB(0), y + 34, { color: ALERT, w: 2.5 });
      R(s, XB(0), y, XB(9.5) - XB(0), 14, { fill: 'FECDD3', line: MOD.rx.line, lw: 0.75 });
      T(s, '가짜 frame (수정 전)', XB(0), y, XB(9.5) - XB(0), 14, { font: MONO, size: 8.5, color: MOD.rx.line, align: 'center', bold: true });
      R(s, XB(g), y + 18, XB(g + 10) - XB(g), 14, { fill: 'DBEAFE', line: MOD.tx.line, lw: 0.75 });
      T(s, '0x55 frame', XB(g), y + 18, XB(g + 10) - XB(g), 14, { font: MONO, size: 8.5, color: MOD.tx.line, align: 'center', bold: true });
    });
    T(s, '수정 후: START 중 rx = 1 → 가짜 frame 없이 IDLE 복귀 → 0x55 정상 수신', 56, 646, 1000, 20, { size: 12, bold: true, color: GOOD });
  });
}
function slideApxWidth() {
  const s = newSlide('A');
  const acc = head(s, 'A', 'Glitch 폭 기준', 'Glitch 폭: clk · tick · Half-bit 경계 기준으로 선정', [
    '기준 시간 상수 3개 — clk 10 ns · tick 6,510 ns (sampling edge 간격) · half bit 52,080 ns (START 대기)',
    '1 tick 미만 = 실제 노이즈 구간 (위치에 따라 결과 갈림), 1 tick 이상 = 경계 확인용',
  ]);
  within(104, 686, CY2, 686, () => {
    const L0 = 1, L1 = Math.log10(104160);
    const X = (w) => 110 + (Math.log10(w) - L0) / (L1 - L0) * 1080;
    const yR = 214;
    R(s, X(10), yR - 10, X(6510) - X(10), 20, { fill: GOODBG });
    R(s, X(6510), yR - 10, X(52080) - X(6510), 20, { fill: 'FEF3C7' });
    R(s, X(52080), yR - 10, X(104160) - X(52080), 20, { fill: 'E2E8F0' });
    T(s, '1 tick 미만 · 위치에 따라 결과 갈림', X(10), yR - 10, X(6510) - X(10), 20, { size: 11, bold: true, color: GOOD, align: 'center' });
    T(s, '1 tick 이상 · 경계 확인', X(6510), yR - 10, X(52080) - X(6510), 20, { size: 11, bold: true, color: MOD.baud.line, align: 'center' });
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
    const NZ = { color: GOOD, bold: true }, BD = { color: MOD.baud.line, bold: true };
    const rows = [
      ['20', '2 clk', 'RTL sim은 rx를 clk edge(10 ns)에서만 봄 → clk edge를 확실히 덮는 최소 폭', '짧은 noise', NZ],
      ['200', '20 clk', '1 tick 안 10배 간격 sweep', '짧은 noise', NZ],
      ['2,000', '200 clk', '1 tick 안 10배 간격 sweep', '짧은 noise', NZ],
      ['6,000', '1 tick − 510', 'off-tick이 E를 피하는 최대 폭 6,507 ns 바로 아래', '짧은 noise', NZ],
      ['6,510', '1 tick', 'sampling edge 간격과 같은 폭 → 모든 위치에서 E 1개 이상 덮음', '경계 확인', BD],
      ['13,020', '2 tick', 'E 2개 이상 덮음', '경계 확인', BD],
      ['26,040', '4 tick (1/4 bit)', 'START 대기 8 tick의 중간', '경계 확인', BD],
      ['50,000', 'half bit 미만', 'START 대기 8 tick(52,080 ns) 바로 아래 → START 재확인으로 거를 수 있는 상한', '경계 확인', BD],
    ];
    const data = [[TH('폭 (ns)'), TH('환산'), TH('선정 근거'), TH('구분')]];
    rows.forEach((r) => data.push([TM(r[0], { bold: true }), TM(r[1]), TC(r[2]), TC(r[3], { align: 'center', ...r[4] })]));
    table(s, data, 40, 286, 1200, [110, 170, 780, 140], [32, ...Array(8).fill(46)], { size: 12.5 });
  });
}
function slideApxStart() {
  const s = newSlide('A');
  const acc = head(s, 'A', 'START Glitch 결과', 'START Glitch: 수정 전 17 FAIL → 수정 후 23 Case 모두 PASS', [
    '수정 전 — sampling edge를 덮은 glitch는 폭과 무관하게 가짜 0xFF 수신 · echo, 뒤 byte까지 손실',
    '수정 후 — START 중 rx = 1 → IDLE 복귀, 50 µs glitch까지 무시 · 뒤 byte 정상 1회 수신',
  ]);
  const ok = (t) => TM(t, { color: GOOD, bold: true }), ng = (t) => TM(t, { color: ALERT, bold: true });
  const rows = [
    [TH('입력'), TH('폭 (ns) · 조건'), TH('위치'), TH('수정 전 rx_done / echo'), TH('수정 전'), TH('수정 후'), TH('case')],
    [TC('single', { bold: true }), TM('20 · 200 · 2,000 · 6,000'), TM('off-tick'), TM('0 / 0'), PASS(), PASS(), TM('4')],
    [TC('single', { bold: true }), TM('20 · 200 · 2,000 · 6,000'), TM('on-tick'), ng('1 (FF) / 1 (FF)'), FAIL(), PASS(), TM('4')],
    [TC('single', { bold: true }), TM('6,510 · 13,020 · 26,040 · 50,000'), TM('off · on'), ng('1 (FF) / 1 (FF)'), FAIL(), PASS(), TM('8')],
    [TC('burst', { bold: true }), TM('200 × 5, gap 1,000'), TM('off-tick'), TM('0 / 0'), PASS(), PASS(), TM('1')],
    [TC('burst', { bold: true }), TM('1,000 × 8, gap 1,000'), TM('off-tick'), ng('1 (FF) / 1 (FF)'), FAIL(), PASS(), TM('1')],
    [TC('glitch + byte', { bold: true }), TM('200 → 1 bit → 0x55'), TM('off-tick'), ok('1 (55) / 1 (55)'), PASS(), PASS(), TM('1')],
    [TC('glitch + byte', { bold: true }), TM('200 → 1 bit → 0x55'), TM('on-tick'), ng('2 (last FF) / 1 (AA)'), FAIL(), PASS(), TM('1')],
    [TC('glitch + byte', { bold: true }), TM('200 → 1 bit → 0xD5'), TM('on-tick'), ng('1 (AA) / 1 (AA)'), FAIL(), PASS(), TM('1')],
    [TC('glitch + byte', { bold: true }), TM('200 → 3 bit → 0x55'), TM('on-tick'), ng('2 (last FE) / 1 (AB)'), FAIL(), PASS(), TM('1')],
    [TC('glitch + byte', { bold: true }), TM('200 → 12 bit → 0x55'), TM('on-tick'), ng('2 (last 55) / 2'), FAIL(), PASS(), TM('1')],
  ];
  table(s, rows, 40, 172, 1200, [150, 300, 110, 250, 120, 120, 150], [34, ...Array(10).fill(44)], { size: 12.5 });
  T(s, 'START Glitch Result  ·  수정 전 pass 6 / fail 17  →  수정 후 pass 23 / fail 0  (xsim, tb_uart.v)', 40, 650, 1100, 22, { size: 12, bold: true, color: SUB });
}
function slideApxData() {
  const s = newSlide('A');
  const acc = head(s, 'A', 'Data Bit Glitch 결과', 'Data Bit Glitch: Bit 중앙 Sampling Edge를 덮을 때만 1 bit 반전', [
    '1 tick 미만 glitch 320 case 중 bit 중앙 (offset 0) **64 case FAIL** — glitch 넣은 bit만 반전, rx_done · echo는 정상 1회',
    '±1 · ±7 tick 위치는 모두 PASS → bit 중앙 1회 sampling (ONE BIT mode) 구조 한계',
  ]);
  // input sketch
  R(s, 40, 172, 470, 500, { fill: CARD, line: CARDLINE, radius: 6 });
  T(s, '입력 방법', 56, 182, 400, 24, { size: 15, bold: true, color: acc });
  const X0 = 80, BW = 380;
  T(s, 'data bit 1개 (104.16 µs)', X0, 208, BW, 18, { size: 11.5, color: SUB, align: 'center' });
  R(s, X0, 240, BW, 60, { fill: 'EFF6FF', line: WIRE, lw: 1.5 });
  for (let k = 1; k < 16; k++) seg(s, X0 + k * BW / 16, 240, X0 + k * BW / 16, 300, { color: 'BFDBFE', w: 0.75 });
  const offs = [[-7, '−7'], [-1, '−1'], [0, '0'], [1, '+1'], [7, '+7']];
  offs.forEach(([o, t]) => {
    const x = X0 + (8 + o) * BW / 16;
    R(s, x - 4, 232, 8, 76, { fill: o === 0 ? ALERT : SUB });
    T(s, t, x - 20, 312, 40, 16, { font: MONO, size: 11, bold: true, color: o === 0 ? ALERT : SUB, align: 'center' });
  });
  T(s, 'offset (tick, bit 중앙 기준)', X0, 330, BW, 18, { size: 11, color: SUB, align: 'center' });
  seg(s, X0 + 8 * BW / 16, 350, X0 + 8 * BW / 16, 372, { color: MARK, w: 2 });
  T(s, 'RX sampling (bit 중앙)', X0 + 8 * BW / 16 - 100, 372, 200, 18, { size: 11, bold: true, color: MARK, align: 'center' });
  T(s, [
    { text: 'data  0x55 · 0xAA  (bit마다 0 · 1 둘 다)', options: { breakLine: true } },
    { text: 'bit   0 ~ 7 중 1개, 그 bit와 반대 레벨', options: { breakLine: true } },
    { text: '폭    20 · 200 · 2,000 · 6,000 ns', options: { breakLine: true } },
    { text: '판정  rx_data · echo = 송신 byte, 각 1회', options: {} },
  ], 64, 410, 430, 120, { font: MONO, size: 12.5, valign: 'top', ls: 1.2 });
  R(s, 64, 548, 430, 110, { fill: WHITE, line: ALERT, lw: 1.25, radius: 6 });
  T(s, 'FAIL 예  ·  0x55, bit 0, 20 ns, offset 0', 80, 556, 400, 20, { size: 12, bold: true, color: ALERT });
  T(s, [
    { text: 'expected : 55 (01010101)', options: { breakLine: true } },
    { text: 'rx_data  : 54 (01010100)  rx_done x1', options: { breakLine: true } },
    { text: 'diff     :    (00000001)', options: {} },
  ], 80, 580, 410, 70, { font: MONO, size: 12, valign: 'top', ls: 1.1 });
  // grid : widths x offsets
  T(s, 'PASS 수 / 16  (bit 8개 × data 2개)', 540, 182, 700, 24, { size: 15, bold: true, color: acc });
  const ws = ['20 ns', '200 ns', '2,000 ns', '6,000 ns'];
  const cw = 112, ch = 92, gx0 = 666, gy0 = 260;
  offs.forEach(([o, t], j) => T(s, `${t} tick`, gx0 + j * cw, 222, cw, 30, { font: MONO, size: 12.5, bold: true, color: o === 0 ? ALERT : SUB, align: 'center' }));
  T(s, '폭 / offset', 540, 222, 120, 30, { size: 12, color: MUTED, align: 'center' });
  ws.forEach((w, i) => {
    T(s, w, 540, gy0 + i * ch, 120, ch - 8, { font: MONO, size: 13, bold: true, align: 'center' });
    offs.forEach(([o], j) => {
      const bad = o === 0;
      R(s, gx0 + j * cw + 4, gy0 + i * ch, cw - 8, ch - 8, { fill: bad ? BADBG : GOODBG, line: bad ? ALERT : GOOD, lw: 1, radius: 6 });
      T(s, bad ? '0 / 16' : '16 / 16', gx0 + j * cw + 4, gy0 + i * ch, cw - 8, ch - 8, { font: MONO, size: 16, bold: true, color: bad ? ALERT : GOOD, align: 'center' });
    });
  });
  T(s, 'DATA GLITCH Result  ·  320 case  pass 256 / fail 64  (xsim, tb_uart.v)', 540, 640, 700, 22, { size: 12, bold: true, color: SUB });
}

// =====================================================================
// =====================================================================
// UART + FIFO deck : placeholders for captures / values from the TB log
// =====================================================================
const PH = 'C2410C', PHBG = 'FFF7ED';
const IMG = __dirname + '/img/';
const SIM = 'xsim 측정';
function capture(s, x, y, w, h, title, lines) {
  R(s, x, y, w, h, { fill: PHBG, line: PH, lw: 1.5, dash: 'dash', radius: 8 });
  T(s, '파형 캡처 영역', x, y + h / 2 - 54, w, 28, { size: 18, bold: true, color: PH, align: 'center' });
  T(s, title, x + 20, y + h / 2 - 20, w - 40, 26, { size: 14, bold: true, align: 'center' });
  T(s, lines.join('\n'), x + 20, y + h / 2 + 12, w - 40, 52, { size: 12, color: SUB, align: 'center', valign: 'top', ls: 1.1 });
}
function fillIn(s, x, y, w, h, label) {
  R(s, x, y, w, h, { fill: PHBG, line: PH, lw: 1, dash: 'dash', radius: 4 });
  T(s, label, x, y, w, h, { size: 11, color: PH, align: 'center' });
}
function statRow(s, x, y, w, k, v, ok) { // label : value line in the right column
  T(s, k, x, y, w * 0.55, 30, { size: 13, color: SUB });
  if (v === null) fillIn(s, x + w * 0.55, y + 3, w * 0.45, 24, 'TB 로그 값');
  else T(s, v, x + w * 0.55, y, w * 0.45, 30, { font: MONO, size: 15, bold: true, color: ok ? GOOD : INK, align: 'right' });
}
function passBox(s, x, y, w, big, sub) {
  R(s, x, y, w, 96, { fill: GOODBG, line: GOOD, lw: 1.5, radius: 8 });
  T(s, 'PASS', x + 16, y + 10, 120, 24, { font: MONO, size: 14, bold: true, color: GOOD });
  T(s, big, x + 16, y + 34, w - 32, 40, { font: MONO, size: 28, bold: true, color: GOOD });
  T(s, sub, x + 16, y + 72, w - 32, 18, { size: 11, color: SUB });
}

function slideCoverF() {
  const s = pptx.addSlide(); PAGE += 1; slides.push({ sec: 'cover', page: PAGE });
  s.background = { color: WHITE };
  R(s, 0, 0, 560, 720, { fill: INK });
  T(s, 'VERILOG  ·  TEAM PROJECT 04', 64, 170, 440, 24, { size: 12, bold: true, color: '818CF8' });
  T(s, 'UART + FIFO\nLoopback', 64, 204, 460, 120, { size: 40, bold: true, color: WHITE, ls: 0.95 });
  T(s, '설계 · 시뮬레이션 검증', 64, 330, 460, 32, { size: 17, color: 'CBD5E1' });
  // FIFO motif : 4 slots + pointers
  ['A', 'B', 'C', ''].forEach((t, i) => {
    R(s, 64 + i * 70, 410, 62, 52, { fill: t ? '312E81' : '1E293B', line: '818CF8', lw: 1.25, radius: 4 });
    if (t) T(s, t, 64 + i * 70, 410, 62, 52, { font: MONO, size: 18, bold: true, color: WHITE, align: 'center' });
  });
  T(s, 'rptr', 64, 384, 62, 18, { font: MONO, size: 10.5, color: 'FCA5A5', align: 'center' });
  T(s, 'wptr', 274, 470, 62, 18, { font: MONO, size: 10.5, color: '93C5FD', align: 'center' });
  T(s, 'FIFO DEPTH 4  ·  push → wptr, pop → rptr', 64, 500, 440, 20, { font: MONO, size: 11, color: '94A3B8' });
  T(s, '정안성', 64, 610, 300, 26, { size: 15, color: WHITE, bold: true });
  const specs = [['clk', '100 MHz', 'Basys-3'], ['baud', '9600 bps', '8N1 · LSB first'], ['buffer', 'FIFO 4 × 2', 'FIFO_RX · FIFO_TX'], ['검증', 'S1 ~ S5 PASS', '시나리오 5개']];
  specs.forEach(([k, v, d], i) => {
    const y = 170 + i * 110;
    T(s, k, 640, y, 300, 22, { font: MONO, size: 12, color: MUTED });
    T(s, v, 640, y + 22, 520, 44, { size: 28, bold: true, color: i === 3 ? GOOD : INK });
    T(s, d, 640, y + 66, 520, 22, { size: 13, color: SUB });
    if (i < 3) seg(s, 640, y + 98, 1200, y + 98, { color: CARDLINE, w: 1 });
  });
}

function slideSummaryF() {
  const s = newSlide('00');
  head(s, '00', 'Summary', 'UART + FIFO Loopback 구현 · 검증 결과', [
    'uart_rx와 uart_tx 사이 FIFO_RX · FIFO_TX → 수신 byte가 FIFO 2단을 거쳐 순서대로 echo',
    '시나리오 5개 **모두 PASS** — FIFO 단독 · 단일 byte · 9600 연속 · 최악 조건 · glitch 회귀',
  ]);
  const stats = [
    ['DEPTH 4 × 2', 'FIFO', 'FIFO_RX · FIFO_TX, 8 bit', INK],
    ['9600 / 9600.6', 'baud (PC / FPGA)', 'PC frame ≥ TX frame 160 tick', INK],
    ['414 / 0', 'S1 FIFO 단독', 'step / mismatch', GOOD],
    ['256 / 256', 'S2 · S3 · S4 echo', '단일 · 9600 연속 · 최악 조건', GOOD],
    ['23 / 23', 'S5 START glitch', '02 수정 결과 유지', GOOD],
    ['1 / 1', 'FIFO 최대 점유 (RX / TX)', 'S2 ~ S4 · full 0회 · TX busy 중 rx_done 0회', INK],
  ];
  stats.forEach(([v, k, d, c], i) => {
    const x = 40 + (i % 3) * 404, y = 184 + Math.floor(i / 3) * 240;
    R(s, x, y, 384, 210, { fill: CARD, line: CARDLINE, radius: 8 });
    T(s, k, x + 24, y + 18, 340, 24, { size: 15, bold: true, color: SUB });
    if (v === null) fillIn(s, x + 24, y + 58, 336, 70, 'TB 로그 값 입력');
    else T(s, v, x + 24, y + 50, 340, 84, { size: v.length > 10 ? 32 : 40, bold: true, color: c });
    seg(s, x + 24, y + 146, x + 360, y + 146, { color: CARDLINE, w: 1 });
    T(s, d, x + 24, y + 156, 340, 40, { size: 13, color: SUB });
  });
}

function flowRow(s, y, tag, items, acc) {
  T(s, tag, 40, y, 70, 64, { font: MONO, size: 20, bold: true, color: acc, align: 'center' });
  const w = 150, gap = (1100 - items.length * w) / (items.length - 1);
  items.forEach(([n, m, lbl], i) => {
    const x = 130 + i * (w + gap);
    R(s, x, y + 6, w, 52, { fill: m.fill, line: m.line, lw: 1.75, radius: 8 });
    T(s, n, x, y + 6, w, 52, { font: MONO, size: 14, bold: true, align: 'center' });
    if (i < items.length - 1) {
      seg(s, x + w + 4, y + 32, x + w + gap - 4, y + 32, { color: WIRE, w: 2.25, arrow: true });
      if (lbl) T(s, lbl, x + w - 40, y - 14, gap + 80, 18, { font: MONO, size: 10.5, bold: true, color: lbl.startsWith('rx_done') ? ALERT : WIRE, align: 'center' });
    }
  });
}
function slideGoalF() {
  const s = newSlide('01');
  const acc = head(s, '01', '목적', 'TX가 바쁜 동안 들어온 Byte도 놓치지 않는 Loopback', [
    '수신(uart_rx)과 송신(uart_tx) 사이에 FIFO_RX · FIFO_TX를 두어 두 쪽을 분리',
    '연속 입력도 손실 · 중복 없이 같은 순서로 echo → 시나리오 5개로 검증',
  ]);
  const FM = { fill: 'ECFDF5', line: '059669' }, FT = { fill: 'FEFCE8', line: 'CA8A04' };
  flowRow(s, 186, '02', [['PC', MOD.pc, 'rx'], ['uart_rx', MOD.rx, 'rx_done = tx_start'], ['uart_tx', MOD.tx, 'tx'], ['PC', MOD.pc]], MUTED);
  flowRow(s, 276, '04', [['PC', MOD.pc, 'rx'], ['uart_rx', MOD.rx, 'push'], ['FIFO_RX', FM, ''], ['FIFO_TX', FT, 'tx_start'], ['uart_tx', MOD.tx, 'tx'], ['PC', MOD.pc]], acc);
  const rows = [
    [TH('#'), TH('대상'), TH('목표 동작'), TH('결과')],
    [TM('S1'), TM('fifo', { bold: true }), TC('push / pop / 동시 push·pop, full · empty, pointer 순환'), PASS()],
    [TM('S2'), TM('uart_fifo_loopback', { bold: true }), TC('단일 byte echo 유지'), PASS()],
    [TM('S3'), TM('uart_fifo_loopback', { bold: true }), TC('9600 bps 연속 입력 손실 · 중복 0'), PASS()],
    [TM('S4'), TM('uart_fifo_loopback', { bold: true }), TC('여유 0 tick 최악 조건에서도 손실 0'), PASS()],
    [TM('S5'), TM('uart_rx', { bold: true }), TC('START glitch 개선 유지'), PASS()],
  ];
  table(s, rows, 40, 372, 1200, [80, 260, 700, 160], [34, 52, 52, 52, 52, 52], { size: 14 });
}

function slideFifoConcept() {
  const s = newSlide('02');
  const acc = head(s, '02', 'FIFO 개념', 'FIFO: wptr · rptr 두 포인터로 순서를 지키는 원형 버퍼', [
    'push = wptr 자리에 쓰고 wptr + 1, pop = rptr + 1 → 두 포인터 비교로 full · empty 판단',
    'pop_data = mem[rptr] → pop 전에도 맨 앞 byte가 출력에 보임 (FWFT)',
  ]);
  const panels = [
    ['reset', ['', '', '', ''], 0, 0, 'empty = 1', null],
    ['push A · B · C', ['A', 'B', 'C', ''], 0, 3, 'empty = 0', 'A'],
    ['push D', ['A', 'B', 'C', 'D'], 0, 0, 'full = 1', 'A'],
    ['pop × 2', ['a', 'b', 'C', 'D'], 2, 0, 'full = 0', 'C'],
  ];
  panels.forEach(([t, slots, r, w, flag, head_], p) => {
    const x0 = 40 + p * 304, y0 = 176;
    R(s, x0, y0, 290, 330, { fill: CARD, line: CARDLINE, radius: 8 });
    badge(s, x0 + 14, y0 + 14, p + 1, acc, 26);
    T(s, t, x0 + 50, y0 + 14, 230, 26, { size: 15, bold: true });
    slots.forEach((v, i) => {
      const x = x0 + 25 + i * 62, y = y0 + 120;
      const live = v && v === v.toUpperCase();
      R(s, x, y, 54, 54, { fill: live ? 'DBEAFE' : WHITE, line: live ? WIRE : LINE, lw: 1.5, radius: 4 });
      if (v) T(s, v.toUpperCase(), x, y, 54, 54, { font: MONO, size: 18, bold: true, color: live ? WIRE : 'CBD5E1', align: 'center' });
      T(s, String(i), x, y + 56, 54, 16, { font: MONO, size: 10, color: MUTED, align: 'center' });
    });
    const rx = x0 + 25 + r * 62 + 27, wx = x0 + 25 + w * 62 + 27;
    seg(s, rx, y0 + 82, rx, y0 + 116, { color: ALERT, w: 2, arrow: true });
    T(s, 'rptr', rx - 30, y0 + 62, 60, 18, { font: MONO, size: 11, bold: true, color: ALERT, align: 'center' });
    seg(s, wx, y0 + 214, wx, y0 + 194, { color: WIRE, w: 2, arrow: true });
    T(s, 'wptr', wx - 30, y0 + 216, 60, 18, { font: MONO, size: 11, bold: true, color: WIRE, align: 'center' });
    tag(s, flag, x0 + 20, y0 + 254, 120, flag !== 'full = 1', 26);
    T(s, 'pop_data = ' + (head_ || '—'), x0 + 150, y0 + 254, 130, 26, { font: MONO, size: 12, bold: true, color: SUB });
    if (p < 3) seg(s, x0 + 291, y0 + 147, x0 + 303, y0 + 147, { color: acc, w: 2, arrow: true });
  });
  card(s, 40, 524, 590, 70, 1, 'full', 'push 후 wptr이 rptr을 따라잡음 → full ← 1', acc, 14);
  card(s, 650, 524, 590, 70, 2, 'empty', 'pop 후 rptr이 wptr을 따라잡음 → empty ← 1', acc, 14);
  card(s, 40, 606, 590, 66, 3, 'wptr = rptr', 'empty · full 둘 다 같음 → flag로 구분', acc, 14);
  card(s, 650, 606, 590, 66, 4, 'FWFT', '읽기 = 조합 출력 → TX가 바로 맨 앞 byte 사용', acc, 14);
}

function slideSpeed() {
  const s = newSlide('02');
  const acc = head(s, '02', '속도 관계', 'PC 9600 ≤ FPGA 9600.6 bps → FIFO는 대기 없이 통과', [
    'PC frame 1,041,666.7 ns ≥ TX frame 160 tick = 1,041,600 ns → FIFO가 계속 쌓이지 않음',
    'rx_done 순간 TX는 이미 IDLE (S3 · S4 TX busy 중 rx_done **0회**) → FIFO는 대기 없이 통과만 (최대 1개)',
  ]);
  // frame length bars
  R(s, 40, 176, 1200, 150, { fill: CARD, line: CARDLINE, radius: 8 });
  T(s, '10 bit frame 길이', 60, 186, 400, 24, { size: 15, bold: true, color: acc });
  [['PC 9600 bps', 1041666.7, 'bit 104,166.67 ns', MOD.pc.line], ['FPGA TX 9600.6 bps', 1041600, 'bit 104,160 ns = 16 tick', MOD.tx.line]].forEach(([n, v, d, c], i) => {
    const y = 222 + i * 46, wbar = 580 * v / 1041666.7;
    T(s, n, 60, y, 200, 34, { size: 13, bold: true });
    R(s, 270, y + 4, wbar, 26, { fill: c });
    T(s, v.toLocaleString('en-US', { maximumFractionDigits: 1 }) + ' ns', 870, y, 180, 34, { font: MONO, size: 13, bold: true });
    T(s, d, 1060, y, 170, 34, { size: 11.5, color: SUB });
  });
  // timeline concept
  R(s, 40, 340, 1200, 332, { fill: CARD, line: CARDLINE, radius: 8 });
  T(s, '연속 입력 개념도 (비율 무시)', 60, 350, 500, 24, { size: 15, bold: true, color: acc });
  const X = (t) => 200 + t * 300; // 1 unit = 1 frame
  const EW = (x) => Math.min(296, 1225 - x);
  T(s, 'rx (PC)', 60, 394, 130, 30, { font: MONO, size: 12, bold: true, align: 'right' });
  T(s, 'rx_done', 60, 446, 130, 30, { font: MONO, size: 12, bold: true, align: 'right' });
  T(s, 'FIFO_TX', 60, 498, 130, 30, { font: MONO, size: 12, bold: true, align: 'right' });
  T(s, 'tx (TX)', 60, 550, 130, 30, { font: MONO, size: 12, bold: true, align: 'right' });
  for (let k = 0; k < 3; k++) {
    R(s, X(k), 396, 296, 26, { fill: 'DCFCE7', line: MOD.pc.line, lw: 1 });
    T(s, `frame ${k + 1}`, X(k), 396, 296, 26, { font: MONO, size: 11, bold: true, color: MOD.pc.line, align: 'center' });
    const d = X(k) + 296 * 0.95;
    seg(s, d, 446, d, 476, { color: ALERT, w: 2.5 });
    R(s, d + 10, 552, EW(d + 10), 26, { fill: 'DBEAFE', line: MOD.tx.line, lw: 1 });
    T(s, `echo ${k + 1}`, d + 10, 552, EW(d + 10), 26, { font: MONO, size: 11, bold: true, color: MOD.tx.line, align: 'center' });
    R(s, d - 2, 500, 16, 26, { fill: 'FDE68A', line: 'CA8A04', lw: 1.25 });
    T(s, '1', d - 2, 500, 16, 26, { font: MONO, size: 10.5, bold: true, align: 'center' });
  }
  T(s, 'rx_done 순간 앞 echo는 이미 종료 → byte는 FIFO 2단을 4 clk 동안 통과 → 다음 echo 바로 시작 (S4 frame gap 0 clk)', 200, 600, 1020, 22, { size: 13, bold: true, color: ALERT });
  T(s, 'FIFO_RX · FIFO_TX 최대 점유 1 = 통과 중인 1 byte · full 0회', 200, 628, 1020, 22, { size: 12, color: SUB });
}

function slideBlockF() {
  const s = newSlide('03');
  const acc = head(s, '03', 'uart_fifo_loopback', '수신 → FIFO_RX → FIFO_TX → 송신, 신호 레벨로 연결', [
    'FIFO_RX push = rx_done, pop = ~tx_full / FIFO_TX push = ~rx_empty, pop = ~tx_busy',
    'uart_tx tx_start = ~FIFO_TX empty → FIFO에 byte가 있는 동안 계속 송신',
  ]);
  const FM = { fill: 'ECFDF5', line: '059669' }, FT = { fill: 'FEFCE8', line: 'CA8A04' };
  R(s, 160, 172, 1000, 400, { line: '818CF8', lw: 1.5, dash: 'dash', radius: 6 });
  T(s, 'uart_fifo_loopback', 176, 178, 300, 20, { font: MONO, size: 12, bold: true, color: '4338CA' });
  const mods = [['uart_rx', MOD.rx, 190], ['FIFO_RX', FM, 430], ['FIFO_TX', FT, 670], ['uart_tx', MOD.tx, 910]];
  mods.forEach(([n, m, x]) => {
    R(s, x, 224, 210, 170, { fill: m.fill, line: m.line, lw: 1.75, radius: 6 });
    T(s, n, x, 230, 210, 26, { font: MONO, size: 16, bold: true, align: 'center' });
  });
  // PC
  R(s, 40, 260, 100, 60, { fill: MOD.pc.fill, line: MOD.pc.line, lw: 1.5, radius: 6 });
  T(s, 'PC\nsender', 40, 260, 100, 60, { font: MONO, size: 12, bold: true, align: 'center' });
  R(s, 1176, 260, 70, 60, { fill: MOD.pc.fill, line: MOD.pc.line, lw: 1.5, radius: 6 });
  T(s, 'PC\nrecv', 1176, 260, 70, 60, { font: MONO, size: 12, bold: true, align: 'center' });
  seg(s, 140, 290, 190, 290, { color: WIRE, w: 2, arrow: true }); T(s, 'rx', 144, 268, 40, 18, { font: MONO, size: 11, bold: true, color: WIRE });
  seg(s, 1120, 290, 1176, 290, { color: WIRE, w: 2, arrow: true }); T(s, 'tx', 1128, 268, 40, 18, { font: MONO, size: 11, bold: true, color: WIRE });
  // data bus
  const bus = (x1, x2, a, b) => { seg(s, x1, 276, x2, 276, { color: WIRE, w: 3.5, arrow: true }); pin(s, a, x1 - 104, 276, 100, 'right'); pin(s, b, x2 + 4, 276, 100, 'left'); };
  bus(400, 430, 'rx_data', 'push_data'); bus(640, 670, 'pop_data', 'push_data'); bus(880, 910, 'pop_data', 'tx_data');
  // control
  const ctl = (x1, x2, y, a, b, lbl, back) => {
    seg(s, back ? x2 : x1, y, back ? x1 : x2, y, { color: back ? MARK : ALERT, w: 1.75, arrow: true });
    pin(s, a, x1 - 104, y, 100, 'right'); pin(s, b, x2 + 4, y, 100, 'left');
    T(s, lbl, x1 - 6, y - 22, x2 - x1 + 12, 16, { font: MONO, size: 10, bold: true, color: back ? MARK : ALERT, align: 'center' });
  };
  ctl(400, 430, 320, 'rx_done', 'push', '', false);
  ctl(640, 670, 320, 'empty', 'push', '~', false);
  ctl(640, 670, 362, 'pop', 'full', '~', true);
  ctl(880, 910, 320, 'empty', 'tx_start', '~', false);
  ctl(880, 910, 362, 'pop', 'tx_busy', '~', true);
  // baud
  R(s, 520, 448, 280, 64, { fill: MOD.baud.fill, line: MOD.baud.line, lw: 1.75, radius: 6 });
  T(s, 'baud_tick_gen', 520, 452, 280, 26, { font: MONO, size: 14, bold: true, align: 'center' });
  T(s, 'b_tick 6.51 µs', 520, 478, 280, 20, { font: MONO, size: 11, color: MOD.baud.line, align: 'center', bold: true });
  poly(s, [[520, 480], [295, 480], [295, 394]], { color: MOD.baud.line, w: 1.75, arrow: true });
  poly(s, [[800, 480], [1015, 480], [1015, 394]], { color: MOD.baud.line, w: 1.75, arrow: true });
  T(s, '빨강 = 정방향 제어 · 주황 = 역방향 (상대 상태로 pop)', 176, 540, 700, 20, { size: 11, color: MUTED });
  const cards = [['push', 'rx_done 1 clk → FIFO_RX 저장'], ['전달', 'RX 비어있지 않고 TX 안 찼을 때 1 byte 이동'], ['tx_start', 'FIFO_TX에 byte가 있는 동안 1'], ['pop', 'TX가 바쁘지 않을 때 FIFO_TX에서 꺼냄']];
  cards.forEach(([h, b], i) => card(s, 40 + i * 303, 590, 291, 82, i + 1, h, b, acc, 12.5));
}

function slideFifoInside() {
  const s = newSlide('03');
  const acc = head(s, '03', 'fifo 내부', 'fifo = control_unit (포인터 · flag) + register_file (4 × 8 bit)', [
    'control_unit: {push, pop}와 full · empty로 wptr · rptr · flag 갱신',
    'register_file: we = push & ~full일 때만 쓰기, 읽기 pop_data = mem[rptr] 조합 출력',
  ]);
  R(s, 200, 176, 880, 420, { line: '818CF8', lw: 1.5, dash: 'dash', radius: 6 });
  T(s, 'fifo  (DEPTH = 4, BIT_WIDTH = 8)', 216, 182, 400, 20, { font: MONO, size: 12, bold: true, color: '4338CA' });
  moduleBox(s, 300, 236, 260, 200, MOD.top, 'control_unit', 'U_UART_CONTROL', 'wptr · rptr · full · empty');
  R(s, 760, 236, 240, 300, { fill: MOD.glue.fill, line: MOD.glue.line, lw: 1.75, radius: 6 });
  T(s, 'register_file', 760, 244, 240, 24, { font: MONO, size: 15, bold: true, align: 'center' });
  for (let i = 0; i < 4; i++) {
    R(s, 820, 284 + i * 50, 120, 42, { fill: WHITE, line: LINE, lw: 1 });
    T(s, `mem[${i}]`, 820, 284 + i * 50, 120, 42, { font: MONO, size: 12, align: 'center' });
  }
  // inputs
  [['push', 270], ['pop', 320]].forEach(([n, y]) => { T(s, n, 60, y - 10, 120, 20, { font: MONO, size: 13, bold: true, align: 'right' }); seg(s, 186, y, 300, y, { color: INK, w: 1.5, arrow: true }); });
  T(s, 'push_data', 60, 470, 120, 20, { font: MONO, size: 13, bold: true, align: 'right' });
  seg(s, 186, 480, 760, 480, { color: WIRE, w: 3.5, arrow: true }); pin(s, 'wdata', 766, 480, 60, 'left');
  // pointers
  seg(s, 560, 300, 760, 300, { color: WIRE, w: 2, arrow: true }); wireLabel(s, 'wptr → waddr', 580, 278, 160);
  seg(s, 560, 360, 760, 360, { color: WIRE, w: 2, arrow: true }); wireLabel(s, 'rptr → raddr', 580, 338, 160);
  // we
  R(s, 600, 400, 120, 40, { fill: WHITE, line: ALERT, lw: 1.5, radius: 6 });
  T(s, 'push & ~full', 600, 400, 120, 40, { font: MONO, size: 11, bold: true, color: ALERT, align: 'center' });
  seg(s, 720, 420, 760, 420, { color: ALERT, w: 1.75, arrow: true }); pin(s, 'we', 766, 420, 40, 'left', ALERT);
  // outputs
  seg(s, 1000, 300, 1110, 300, { color: WIRE, w: 3.5, arrow: true }); T(s, 'pop_data', 1116, 290, 120, 20, { font: MONO, size: 13, bold: true });
  T(s, '= mem[rptr]', 1116, 310, 120, 18, { font: MONO, size: 10.5, color: MUTED });
  poly(s, [[430, 436], [430, 560], [1110, 560]], { color: INK, w: 1.5, arrow: true }); T(s, 'full · empty', 1116, 550, 130, 20, { font: MONO, size: 13, bold: true });
  T(s, 'clk · reset 공통', 216, 568, 200, 20, { size: 11, color: MUTED });
  card(s, 40, 620, 590, 54, 1, 'control_unit', '{push, pop} 조합별 포인터 · flag 갱신 (다음 장)', acc, 13);
  card(s, 650, 620, 590, 54, 2, 'register_file', '쓰기는 clk, 읽기는 조합 → FWFT', acc, 13);
}

function slideCtrlTable() {
  const s = newSlide('04');
  const acc = head(s, '04', 'control_unit 동작표', '{push, pop} × empty · 중간 · full 동작', [
    'full일 때 push 무시 · empty일 때 pop 무시',
    'push + pop 동시 — empty: push만 · 중간: 둘 다 · full: **pop만 (구조상 spec)**',
  ]);
  const ig = (t) => TC(t, { color: MUTED, fill: { color: 'F1F5F9' }, align: 'center' });
  const ok = (t) => TC(t, { align: 'center' });
  const sp = (t) => TC(t, { align: 'center', bold: true, color: PH, fill: { color: PHBG } });
  const rows = [
    [TH('입력 / 상태'), TH('empty'), TH('중간 (1 ~ 3개)'), TH('full')],
    [TM('push', { bold: true }), ok('wptr + 1\nempty ← 0'), ok('wptr + 1\nwptr = rptr일 경우 full ← 1'), ig('무시 (we = 0)')],
    [TM('pop', { bold: true }), ig('무시'), ok('rptr + 1\nrptr = wptr일 경우 empty ← 1'), ok('rptr + 1\nfull ← 0')],
    [TM('push + pop', { bold: true }), ok('push만\nwptr + 1 · empty ← 0'), ok('wptr + 1 · rptr + 1\n개수 유지'), sp('pop만 (spec)\nrptr + 1 · full ← 0')],
  ];
  table(s, rows, 40, 180, 1200, [200, 333, 334, 333], [40, 100, 100, 100], { size: 15 });
  card(s, 40, 584, 590, 88, 1, 'full + push·pop', 'we = push & ~full → 쓰기 차단 · pop만\n그 clk 입력 byte는 버려짐 (spec)', acc, 13.5);
  card(s, 650, 584, 590, 88, 2, 'TB 검증', 'S2 ~ S5에서 경계 경우를 compare_buffer와 비교\n→ random pop 113 / 113 PASS', acc, 13.5);
}

function slideHandshake() {
  const s = newSlide('04');
  const acc = head(s, '04', 'rx_done → tx', 'rx_done → tx 시작까지 clk 단위 흐름', [
    'rx_done → FIFO_RX push → FIFO_RX pop · FIFO_TX push → tx_start → START → tx fall',
    'rx_done → tx fall **4 clk (40 ns)** — 02 직결 구조 2 clk 대비 FIFO 2단 통과로 +2 clk',
  ]);
  const steps = [
    ['E0', 'rx_done = 1', 'STOP 중앙 1 clk pulse'],
    ['E1', 'FIFO_RX push', 'wptr + 1 · empty ← 0'],
    ['E2', 'RX pop · TX push', '같은 clk에 1 byte 이동'],
    ['E3', 'tx_start = 1', 'FIFO_TX empty = 0 → START'],
    ['E4', 'tx fall', 'START에서 tx ← 0'],
  ];
  steps.forEach(([e, h, d], i) => {
    const y = 176 + i * 92;
    R(s, 40, y, 420, 80, { fill: CARD, line: CARDLINE, radius: 6 });
    T(s, e, 54, y, 60, 80, { font: MONO, size: 18, bold: true, color: acc });
    T(s, h, 120, y + 10, 330, 28, { font: MONO, size: 15, bold: true });
    T(s, d, 120, y + 40, 330, 28, { size: 12.5, color: SUB });
    if (i < 4) seg(s, 250, y + 80, 250, y + 92, { color: acc, w: 2, arrow: true });
  });
  T(s, 'TB 로그 3 clk = rx_done을 negedge에서 기록한 값 (posedge 기준 4 clk)', 40, 642, 420, 30, { size: 11, color: MUTED });
  capture(s, 480, 176, 760, 496, 'S2 첫 byte · rx_done ~ tx fall (clk 단위 확대)', ['wcfg 그룹 3 UART_RX · 4 FIFO_RX · 5 FIFO_TX · 6 UART_TX', 'E0 ~ E4 위치에 번호 표시']);
}

function slideTbStruct() {
  const s = newSlide('05');
  const acc = head(s, '05', 'TB 구조', 'TB: Sender → DUT → TX Monitor → Scoreboard', [
    '송신 byte를 queue에 저장 → tx에서 복원한 echo와 순서대로 비교 (손실 · 중복 · 순서 검출)',
    'FIFO는 TB 안 별도 instance (U_FIFO_UT) + 기준 모델로 매 clk 비교',
  ]);
  const box = (x, y, w, h, n, d, m) => { R(s, x, y, w, h, { fill: m.fill, line: m.line, lw: 1.75, radius: 6 }); T(s, n, x, y + 10, w, 24, { font: MONO, size: 14, bold: true, align: 'center' }); T(s, d, x + 8, y + 36, w - 16, h - 44, { size: 11.5, color: SUB, align: 'center', valign: 'top' }); };
  box(40, 190, 220, 120, 'Sender', 'send_byte\nPC bit 104,166.667 ns\n또는 104,160 ns', MOD.pc);
  box(340, 190, 280, 120, 'uart_fifo_loopback', 'DUT\nrx → FIFO 2단 → tx', MOD.top);
  box(700, 190, 220, 120, 'TX Monitor', 'tx frame 복원\nstart · stop bit 검사', MOD.tx);
  box(1000, 190, 240, 120, 'Scoreboard', 'echo #n = exp_q[n]\n손실 · 중복 · 순서', { fill: BADBG, line: ALERT });
  seg(s, 260, 250, 340, 250, { color: WIRE, w: 2, arrow: true }); T(s, 'rx', 280, 228, 40, 18, { font: MONO, size: 11, bold: true, color: WIRE });
  seg(s, 620, 250, 700, 250, { color: WIRE, w: 2, arrow: true }); T(s, 'tx', 640, 228, 40, 18, { font: MONO, size: 11, bold: true, color: WIRE });
  seg(s, 920, 250, 1000, 250, { color: WIRE, w: 2, arrow: true }); T(s, 'byte', 930, 228, 60, 18, { font: MONO, size: 11, bold: true, color: WIRE });
  R(s, 40, 350, 220, 56, { fill: WHITE, line: MOD.pc.line, lw: 1.25, radius: 6 }); T(s, 'exp_q (송신 순서)', 40, 350, 220, 56, { font: MONO, size: 12, bold: true, align: 'center' });
  seg(s, 150, 310, 150, 350, { color: MOD.pc.line, w: 1.5, arrow: true });
  poly(s, [[260, 378], [1120, 378], [1120, 310]], { color: MOD.pc.line, w: 1.5, arrow: true });
  box(340, 430, 280, 110, 'Inside monitor', 'rx_done 횟수 · FIFO count\nTX busy 중 rx_done · latency', MOD.glue);
  seg(s, 480, 310, 480, 430, { color: MUTED, w: 1.5, arrow: true, dash: 'dash' });
  box(700, 430, 540, 110, 'Report', '시나리오별 PASS / FAIL · 통계\n오류: [Sn][ERROR] t=$stime · expected vs result · err_flag 펄스', { fill: 'FFFBEB', line: 'B45309' });
  seg(s, 620, 485, 700, 485, { color: MUTED, w: 1.5, arrow: true });
  seg(s, 1120, 310, 1120, 430, { color: ALERT, w: 1.5, arrow: true });
  R(s, 40, 570, 1200, 102, { fill: CARD, line: CARDLINE, radius: 8 });
  T(s, 'S1 전용', 60, 580, 200, 24, { size: 14, bold: true, color: acc });
  T(s, 'U_FIFO_UT (fifo, DEPTH 4)  ⇄  기준 모델 (push는 full 아닐 때만 · pop은 empty 아닐 때만)  →  매 step empty · full · pop_data 비교', 60, 608, 1160, 52, { size: 13.5 });
}

function slideScenarioF() {
  const s = newSlide('05');
  head(s, '05', '시나리오', 'UART FIFO 검증 시나리오 5개 모두 PASS', [
    '시나리오 5개 — FIFO 단독 · 단일 byte · 9600 연속 · 최악 조건 · glitch 회귀',
    'PC 9600 bps 고정 전제, 최악 조건은 PC = FPGA 속도로 여유 0 tick 재현',
  ]);
  const B = '1E40AF';
  const rows = [
    [TH('#', B), TH('시나리오', B), TH('입력 (Stimulus)', B), TH('확인 신호', B), TH('예상 결과', B), TH('결과', B)],
    [TM('S1', { bold: true, color: B }), TC('FIFO 단독', { bold: true }), TC('고정 시퀀스 + 무작위 400 step'), TC('ut_full · ut_empty · ut_pop_data vs 모델'), TC('불일치 0'), PASS('414 / 0')],
    [TM('S2', { bold: true, color: B }), TC('단일 byte echo', { bold: true }), TC('256 byte, byte마다 echo 대기 (bit 104,166.667 ns)'), TC('rx_done, FIFO count, tx'), TC('256 / 256'), PASS('256 / 256')],
    [TM('S3', { bold: true, color: B }), TC('9600 bps 연속', { bold: true }), TC('256 byte gap 없이 (bit 104,166.667 ns)'), TC('echo 순서 · 개수, FIFO count'), TC('손실 · 중복 0'), PASS('256 / 256')],
    [TM('S4', { bold: true, color: B }), TC('최악 조건', { bold: true }), TC('256 byte gap 없이 (bit 104,160 ns = FPGA 속도)'), TC('rx_done vs TX STOP→IDLE, FIFO_TX count'), TC('손실 · 중복 0'), PASS('256 / 256')],
    [TM('S5', { bold: true, color: B }), TC('START glitch 회귀', { bold: true }), TC('02 glitch 23 case'), TC('rx_done · echo 횟수'), TC('23 / 23'), PASS('23 / 23')],
  ];
  table(s, rows, 40, 180, 1200, [60, 190, 340, 290, 170, 150], [36, 84, 84, 84, 84, 84], { size: 13 });
}

function simSlide(sub, title, lines, capTitle, capLines, right) {
  const s = newSlide('05');
  const acc = head(s, '05', sub, title, lines);
  capture(s, 40, 170, 820, 502, capTitle, capLines);
  right(s, acc);
}
function slideS1() {
  simSlide('S1 FIFO 단독', 'S1 FIFO 단독: 414 Step 모두 기준 모델과 일치', [
    '고정 시퀀스 (fill · full 중 push · full 중 push+pop · drain · empty 중 pop) + 무작위 400 step',
    'empty · full · pop_data **mismatch 0** — full 중 push+pop은 pop만 (spec)',
  ], 'S1 · fill → full → push 무시 → push+pop@full', ['wcfg 그룹 7 (S1 FIFO unit test)', 'scenario = 1 구간 앞부분'], (s, acc) => {
    passBox(s, 880, 170, 360, '414 / 0', 'step / mismatch');
    T(s, '확인한 경우 (횟수)', 880, 284, 360, 24, { size: 14, bold: true, color: acc });
    [['push@full', '9'], ['pop@empty', '11'], ['push+pop@empty', '12'], ['push+pop@중간', '71'], ['push+pop@full', '8'], ['wptr 순환', '43']].forEach(([k, v], i) => statRow(s, 880, 316 + i * 40, 360, k, v));
  });
}
function slideS2() {
  simSlide('S2 단일 Byte', 'S2 단일 Byte Echo: FIFO 추가 후에도 256 / 256', [
    '0x00 ~ 0xFF 무작위 순서 256 byte, byte마다 echo 확인 후 다음 송신 (PC bit 104,166.667 ns)',
    'echo **256 / 256 일치** · frame error 0',
  ], 'S2 · byte 1개: rx → FIFO_RX → FIFO_TX → tx', ['wcfg 그룹 2 ~ 6', 'scenario = 2 첫 byte'], (s, acc) => {
    passBox(s, 880, 170, 360, '256 / 256', 'sent / echoed');
    T(s, 'TB 결과', 880, 284, 360, 24, { size: 14, bold: true, color: acc });
    statRow(s, 880, 316, 360, 'mismatch', '0', true);
    statRow(s, 880, 356, 360, 'frame error', '0', true);
    statRow(s, 880, 396, 360, 'rx_done → tx fall', '4 clk');
    statRow(s, 880, 436, 360, 'FIFO_RX / TX max', '1 / 1');
  });
}
function slideS3() {
  simSlide('S3 9600 연속', 'S3 9600 bps 연속 256 Byte: 손실 · 중복 0', [
    '256 byte를 gap 없이 연속 송신 (PC bit 104,166.667 ns) → echo 순서 · 개수 비교',
    'sent 256 = echoed 256 · **mismatch 0**',
  ], 'S3 · 연속 frame 3 ~ 4개', ['wcfg 그룹 0 · 2 · 4 · 5', 'rx · tx · FIFO count'], (s, acc) => {
    passBox(s, 880, 170, 360, '256 / 256', 'sent / echoed');
    T(s, 'TB 결과', 880, 284, 360, 24, { size: 14, bold: true, color: acc });
    statRow(s, 880, 316, 360, 'mismatch', '0', true);
    statRow(s, 880, 356, 360, 'FIFO_RX max', '1');
    statRow(s, 880, 396, 360, 'FIFO_TX max', '1');
    statRow(s, 880, 436, 360, 'full 횟수', '0');
    statRow(s, 880, 476, 360, 'TX busy 중 rx_done', '0');
    statRow(s, 880, 516, 360, 'TX frame gap', '0 ~ 651 clk');
  });
}
function slideS4() {
  simSlide('S4 최악 조건', 'S4 여유 0 tick 최악 조건: Frame 사이 공백 0 clk로 256 / 256', [
    'PC = FPGA 속도 (bit 104,160 ns) 연속 256 byte → rx_done 간격 = TX frame 길이, 여유 0 tick',
    'rx_done 순간 TX는 이미 IDLE (busy 중 rx_done 0회) → echo frame 공백 **0 clk** · **256 / 256 손실 0**',
  ], 'S4 · TX STOP → IDLE과 다음 rx_done이 만나는 순간 (clk 단위 확대)', ['wcfg 그룹 3 ~ 6', 'UART_TX c_state · rx_done · FIFO_TX count · tx_start · tx'], (s, acc) => {
    passBox(s, 880, 170, 360, '256 / 256', 'sent / echoed');
    const st = [['STOP → IDLE', '앞 echo 종료'], ['rx_done', 'TX는 이미 IDLE'], ['FIFO 2단 통과', 'count 1 · 4 clk'], ['START', '공백 0 clk로 다음 echo']];
    st.forEach(([h, b], i) => {
      const y = 284 + i * 70;
      R(s, 880, y, 360, 60, { fill: CARD, line: CARDLINE, radius: 6 });
      shape(s, pptx.ShapeType.ellipse, 892, y + 16, 28, 28, { fill: 'FDE047', line: INK, lw: 1 });
      T(s, String(i + 1), 892, y + 16, 28, 28, { font: MONO, size: 12, bold: true, align: 'center' });
      T(s, h, 932, y + 6, 300, 24, { font: MONO, size: 14, bold: true });
      T(s, b, 932, y + 30, 300, 22, { size: 12, color: SUB });
    });
    statRow(s, 880, 572, 360, 'TX busy 중 rx_done', '0');
    statRow(s, 880, 612, 360, 'FIFO max / frame gap', '1 / 0 clk');
  });
}
function slideS5() {
  const s = newSlide('05');
  const acc = head(s, '05', 'S5 Glitch 회귀', 'S5 START Glitch 23 Case: FIFO 구조에서도 유지', [
    '02와 같은 glitch 23 case (single 16 · burst 2 · glitch 뒤 byte 5)',
    '**23 / 23 PASS** — uart_rx 동일, 02 트러블 슈팅 결과 유지',
  ]);
  const rows = [
    [TH('구조'), TH('START 처리'), TH('결과')],
    [TC('02 loopback (수정 전)'), TC('rx 재확인 없음'), FAIL('6 / 23')],
    [TC('02 loopback (수정 후)'), TC('START 중 rx = 1 → IDLE'), PASS('23 / 23')],
    [TC('04 FIFO loopback', { bold: true }), TC('같은 uart_rx'), PASS('23 / 23')],
  ];
  table(s, rows, 40, 180, 520, [220, 180, 120], [36, 60, 60, 60], { size: 13.5 });
  card(s, 40, 440, 520, 84, 1, 'glitch 입력', 'sampling edge 기준 on / off-tick\n20 ns ~ 50 µs (부록: 02 덱)', acc, 13);
  card(s, 40, 540, 520, 84, 2, '판정', 'glitch만 → rx_done · echo 0회\nglitch 뒤 byte → 정상 1회', acc, 13);
  capture(s, 590, 170, 650, 502, 'S5 · Tcl console 결과 로그', ['"[S5] START glitch regression : PASS" 블록', 'SUMMARY 표 포함 가능']);
}

function slideBoundary() {
  const s = newSlide('06');
  const acc = head(s, '06', '경계 동작', '검증 중 확인한 경계 동작 2가지', [
    '시나리오 5개 모두 PASS → FAIL로 이어진 문제 없음',
    '구조상 동작 2가지 확인 — full 중 push+pop은 pop만 · FIFO_TX pop = ~tx_busy',
  ]);
  const panel = (x, n, title, lines, rows) => {
    R(s, x, 176, 590, 496, { fill: CARD, line: CARDLINE, radius: 8 });
    badge(s, x + 16, 190, n, acc, 28);
    T(s, title, x + 56, 188, 520, 32, { size: 17, bold: true });
    T(s, lines.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), x + 24, 236, 546, 220, { size: 14, valign: 'top', psa: 8 });
    rows.forEach(([k, v], i) => statRow(s, x + 24, 500 + i * 44, 546, k, v));
  };
  panel(40, 1, 'full + push · pop 동시 → pop만 (구조상 spec)', [
    'register_file we = push & ~full → full 상태에서는 쓰기 차단',
    'control_unit은 pop만 진행 → 그 clk의 입력 byte는 버려짐',
    '시스템에서는 FIFO_RX가 full일 때만 해당',
    'S1에서 push+pop@full 경우를 모델과 비교 → 일치',
  ], [['S2 ~ S4 full 횟수', '0'], ['S1 push+pop@full 횟수', '8']]);
  panel(650, 2, 'FIFO_TX pop = ~tx_busy', [
    'tx_busy는 START 진입 다음 clk에 1',
    'TX가 IDLE에서 시작하는 순간 FIFO_TX에 2개가 있을 경우 추가 pop 가능',
    'PC 9600 고정 → FIFO_TX 최대 1개 (S2 ~ S4 실측) → 재현 조건 없음',
    'S2 ~ S4 echo 손실 0으로 영향 없음 확인',
  ], [['S2 ~ S4 FIFO_TX max', '1'], ['echo 손실', '0']]);
}

function slideConclusionF() {
  const s = newSlide('07');
  const acc = head(s, '07', '결론 · 고찰', 'FIFO 2단 구조로 연속 입력 Echo 손실 0', [
    '시나리오 5개 모두 PASS — FIFO 단독 · 단일 byte · 9600 연속 · 최악 조건 · glitch 회귀',
    'PC 9600 고정에서 FIFO는 대기 없이 통과 (최대 1개) · 지연 +2 clk → 연속 입력 echo 손실 0',
  ]);
  T(s, '결론', 40, 172, 300, 28, { size: 17, bold: true, color: GOOD });
  const rows = [
    [TH('시나리오'), TH('결과'), TH('판정')],
    [TC('S1 FIFO 단독'), TM('414 step · mismatch 0'), PASS()],
    [TC('S2 단일 byte echo'), TM('256 / 256'), PASS()],
    [TC('S3 9600 bps 연속'), TM('256 / 256'), PASS()],
    [TC('S4 최악 조건'), TM('256 / 256'), PASS()],
    [TC('S5 START glitch'), TM('23 / 23'), PASS()],
  ];
  table(s, rows, 40, 206, 640, [250, 280, 110], [34, 52, 52, 52, 52, 52], { size: 13.5 });
  R(s, 710, 172, 530, 230, { fill: WHITE, line: 'C2410C', lw: 1.5, radius: 6 });
  R(s, 710, 172, 530, 36, { fill: 'C2410C', radius: 6 });
  T(s, '고찰', 726, 172, 500, 36, { size: 15, bold: true, color: WHITE });
  T(s, [
    { text: 'PC 9600 고정 → TX busy 중 rx_done 0회, FIFO 최대 1개 → 보관 기능은 이 조건에서 쓰이지 않음 (PC가 더 빠를 경우 대비)', options: { bullet: true, breakLine: true } },
    { text: 'full · overflow는 시스템 입력으로 재현 불가 → FIFO 단독 TB (S1)로 검증', options: { bullet: true, breakLine: true } },
    { text: 'FIFO_RX full 미연결 → overflow 발생 시 표시 없음', options: { bullet: true } },
  ], 726, 214, 500, 180, { size: 13.5, valign: 'top', psa: 6 });
  R(s, 710, 420, 530, 252, { fill: WHITE, line: '1E3A8A', lw: 1.5, radius: 6 });
  R(s, 710, 420, 530, 36, { fill: '1E3A8A', radius: 6 });
  T(s, '개선 방향', 726, 420, 500, 36, { size: 15, bold: true, color: WHITE });
  T(s, [
    { text: 'FIFO_TX pop을 uart_tx가 tx_data를 받는 순간과 일치시키는 handshake', options: { bullet: { type: 'number' }, breakLine: true } },
    { text: 'full · overflow flag를 top 출력으로 → 손실 감지', options: { bullet: { type: 'number' }, breakLine: true } },
    { text: 'DATA 구간 3 sample 다수결 (02 고찰 유지)', options: { bullet: { type: 'number' } } },
  ], 726, 462, 500, 200, { size: 13.5, valign: 'top', psa: 6 });
  T(s, '구조 요약', 40, 540, 640, 26, { size: 15, bold: true, color: acc });
  const fl = [['uart_rx', MOD.rx], ['FIFO_RX', { fill: 'ECFDF5', line: '059669' }], ['FIFO_TX', { fill: 'FEFCE8', line: 'CA8A04' }], ['uart_tx', MOD.tx]];
  fl.forEach(([n, m], i) => {
    const x = 40 + i * 162;
    R(s, x, 580, 144, 64, { fill: m.fill, line: m.line, lw: 1.75, radius: 6 });
    T(s, n, x, 580, 144, 64, { font: MONO, size: 15, bold: true, align: 'center' });
    if (i < 3) seg(s, x + 146, 612, x + 160, 612, { color: WIRE, w: 2, arrow: true });
  });
}

function slideTbLog() {
  const s = newSlide('A');
  head(s, 'A', 'TB 로그', 'TB 로그: 시나리오 5개 모두 PASS', [
    'S1 414 step mismatch 0 · S2 ~ S4 256 / 256 · S5 23 / 23',
    'S2 ~ S4 FIFO 최대 1 · full 0 · TX busy 중 rx_done 0 · latency 로그 3 clk (negedge 기준, posedge 기준 4 clk)',
  ]);
  const img = (f, x, y, w, pw, ph) => s.addImage({ path: IMG + f, x: px(x), y: px(y), w: px(w), h: px(w * ph / pw) });
  img('tb_log_1.png', 40, 172, 620, 696, 242);
  img('tb_log_2.png', 690, 172, 550, 517, 284);
  img('tb_log_3.png', 40, 410, 520, 453, 225);
}

// =====================================================================
// FIFO homework slides
// =====================================================================
function slideCoverH() {
  const s = pptx.addSlide(); PAGE += 1; slides.push({ sec: 'cover', page: PAGE });
  s.background = { color: WHITE };
  R(s, 0, 0, 560, 720, { fill: INK });
  T(s, 'VERILOG  ·  HOMEWORK', 64, 170, 440, 24, { size: 12, bold: true, color: '818CF8' });
  T(s, 'FIFO', 64, 204, 460, 70, { size: 44, bold: true, color: WHITE });
  T(s, '설계 · 시뮬레이션 검증', 64, 280, 460, 32, { size: 17, color: 'CBD5E1' });
  ['0a', '0b', '0c', '0d'].forEach((t, i) => {
    R(s, 64 + i * 70, 400, 62, 52, { fill: '312E81', line: '818CF8', lw: 1.25, radius: 4 });
    T(s, t, 64 + i * 70, 400, 62, 52, { font: MONO, size: 16, bold: true, color: WHITE, align: 'center' });
  });
  T(s, 'rptr = wptr', 64, 374, 200, 18, { font: MONO, size: 10.5, color: 'FCA5A5' });
  T(s, 'full = 1', 64, 462, 200, 18, { font: MONO, size: 10.5, color: '93C5FD' });
  T(s, 'DEPTH 4 × 8 bit  ·  push → wptr, pop → rptr', 64, 492, 440, 20, { font: MONO, size: 11, color: '94A3B8' });
  T(s, '정안성', 64, 610, 300, 26, { size: 15, color: WHITE, bold: true });
  const specs = [['구조', 'control_unit + register_file', 'wptr · rptr · full · empty'], ['읽기', '조합 출력 (FWFT)', 'pop_data = mem[rptr]'], ['TB', 'directed 4 + random 256', 'compare_buffer 모델 비교'], ['결과', 'fail 0', 'random pop 113 / 113 PASS']];
  specs.forEach(([k, v, d], i) => {
    const y = 170 + i * 110;
    T(s, k, 640, y, 300, 22, { font: MONO, size: 12, color: MUTED });
    T(s, v, 640, y + 22, 560, 44, { size: 26, bold: true, color: i === 3 ? GOOD : INK });
    T(s, d, 640, y + 66, 560, 22, { size: 13, color: SUB });
    if (i < 3) seg(s, 640, y + 98, 1200, y + 98, { color: CARDLINE, w: 1 });
  });
}

function slideSummaryH() {
  const s = newSlide('00');
  head(s, '00', 'Summary', 'DEPTH 4 FIFO 구현 · 검증 결과', [
    'control_unit (wptr · rptr · full · empty) + register_file (4 × 8 bit, 조합 읽기)로 FIFO 구성',
    'directed 시나리오 4개 + random 256 iteration **fail 0** — full · empty · 동시 push/pop 경계 포함',
  ]);
  const stats = [
    ['4 × 8 bit', 'FIFO 크기', 'DEPTH 4 · pointer 2 bit', INK],
    ['FWFT', '읽기 방식', 'pop_data = mem[rptr] 조합 출력', INK],
    ['11 / 11', 'directed 판정', 'S1 ~ S4 pass 메시지', GOOD],
    ['113 / 113', 'random pop 비교', '256 iteration · fail 0', GOOD],
    ['5 · 8', '동시 push+pop', 'full 중 5회 · empty 중 8회 (random)', INK],
    ['29', 'wptr 순환', 'random 구간 3 → 0 횟수', INK],
  ];
  stats.forEach(([v, k, d, c], i) => {
    const x = 40 + (i % 3) * 404, y = 184 + Math.floor(i / 3) * 240;
    R(s, x, y, 384, 210, { fill: CARD, line: CARDLINE, radius: 8 });
    T(s, k, x + 24, y + 18, 340, 24, { size: 15, bold: true, color: SUB });
    T(s, v, x + 24, y + 50, 340, 84, { size: 40, bold: true, color: c });
    seg(s, x + 24, y + 146, x + 360, y + 146, { color: CARDLINE, w: 1 });
    T(s, d, x + 24, y + 156, 340, 40, { size: 13, color: SUB });
  });
}

function slideGoalH() {
  const s = newSlide('01');
  const acc = head(s, '01', '목적', 'Push · Pop 순서를 지키고 경계 상태에서 오동작 없는 FIFO', [
    'FIFO = 먼저 넣은 byte를 먼저 꺼내는 버퍼 → UART 수신 · 송신 사이 속도 차 흡수용',
    'full · empty · 동시 push/pop 경계에서도 순서 · 개수가 깨지지 않는지 TB로 확인',
  ]);
  // in/out sketch
  R(s, 120, 182, 220, 70, { fill: MOD.pc.fill, line: MOD.pc.line, lw: 1.75, radius: 8 });
  T(s, 'push · push_data', 120, 182, 220, 70, { font: MONO, size: 15, bold: true, align: 'center' });
  R(s, 520, 172, 240, 90, { fill: 'ECFDF5', line: '059669', lw: 1.75, radius: 8 });
  T(s, 'fifo', 520, 178, 240, 30, { font: MONO, size: 17, bold: true, align: 'center' });
  T(s, 'DEPTH 4 × 8 bit', 520, 210, 240, 24, { font: MONO, size: 12, color: SUB, align: 'center' });
  R(s, 940, 182, 220, 70, { fill: MOD.tx.fill, line: MOD.tx.line, lw: 1.75, radius: 8 });
  T(s, 'pop · pop_data', 940, 182, 220, 70, { font: MONO, size: 15, bold: true, align: 'center' });
  seg(s, 344, 217, 516, 217, { color: WIRE, w: 2.5, arrow: true });
  seg(s, 764, 217, 936, 217, { color: WIRE, w: 2.5, arrow: true });
  T(s, 'full · empty', 560, 266, 160, 20, { font: MONO, size: 12, bold: true, color: ALERT, align: 'center' });
  const rows = [
    [TH('#'), TH('검증 항목'), TH('목표 동작'), TH('결과')],
    [TM('S1'), TC('Reset', { bold: true }), TC('reset 해제 후 full 0 · empty 1'), PASS('2 / 2')],
    [TM('S2'), TC('Push × 5', { bold: true }), TC('4번째 push 후 full 1 · 5번째 push 무시'), PASS('파형 확인')],
    [TM('S3'), TC('Pop × 5', { bold: true }), TC('넣은 순서 (0a → 0d)로 출력 · 4번째 pop 후 empty 1'), PASS('5 / 5')],
    [TM('S4'), TC('Push + Pop × 5', { bold: true }), TC('empty 중 push만 · 이후 개수 유지하며 순서대로 출력'), PASS('4 / 4')],
    [TM('S5'), TC('Random 256', { bold: true }), TC('무작위 push · pop에서 compare_buffer와 불일치 0'), PASS('113 / 113')],
  ];
  table(s, rows, 40, 300, 1200, [80, 240, 700, 180], [34, 54, 54, 54, 54, 54], { size: 14 });
}

function slideMemory() {
  const s = newSlide('02');
  const acc = head(s, '02', 'register_file vs BRAM', '저장 공간: register_file은 조합 읽기, BRAM은 1 clk 뒤 읽기', [
    'fifo의 register_file은 rdata = mem[raddr] 조합 출력 → pop 전에도 맨 앞 byte가 보임 (FWFT)',
    'BRAM_IP는 posedge에 rdata 등록 → 주소를 바꾼 다음 clk에 데이터 → FIFO에 쓸 경우 읽기 1 clk 지연 고려',
  ]);
  const rows = [
    [TH('항목'), TH('register_file (fifo.sv)'), TH('BRAM_IP (BRAM.v)')],
    [TC('크기', { bold: true }), TM('4 × 8 bit'), TM('256 × 8 bit')],
    [TC('쓰기', { bold: true }), TC('posedge · we = push & ~full'), TC('posedge · we = 1')],
    [TC('읽기', { bold: true }), TC('조합: rdata = mem[raddr]', { color: GOOD, bold: true }), TC('등록: we = 0일 때 posedge에 rdata ← ram[addr]', { color: ALERT, bold: true })],
    [TC('읽기 지연', { bold: true }), TM('0 clk (주소 변경 즉시)'), TM('1 clk')],
    [TC('FIFO 적용', { bold: true }), TC('pop_data가 곧 맨 앞 byte'), TC('pop 뒤 1 clk 기다려 데이터 사용')],
  ];
  table(s, rows, 40, 176, 640, [140, 250, 250], [34, 46, 46, 56, 46, 56], { size: 13 });
  // timing sketch
  R(s, 700, 176, 540, 330, { fill: CARD, line: CARDLINE, radius: 8 });
  T(s, '읽기 타이밍 비교 (개념도)', 716, 184, 500, 24, { size: 14, bold: true, color: acc });
  const X = (u) => 860 + u * 46; // half-clock units
  const lab = (t, y) => T(s, t, 712, y, 140, 24, { font: MONO, size: 12, bold: true, align: 'right' });
  lab('clk', 220);
  const cl = [[0, 0]]; for (let u = 1; u <= 8; u++) cl.push([u, u % 2]);
  let pts = [[X(0), 240]]; cl.forEach(([u, v], i) => { if (i) { pts.push([X(u), pts[pts.length - 1][1]]); pts.push([X(u), v ? 222 : 240]); } }); pts.push([X(8.4), pts[pts.length - 1][1]]);
  poly(s, pts, { color: INK, w: 1.75 });
  const bus = (y, segs, color) => segs.forEach(([a, b, t]) => { R(s, X(a), y, X(b) - X(a), 26, { fill: WHITE, line: color, lw: 1.25 }); T(s, t, X(a), y, X(b) - X(a), 26, { font: MONO, size: 11, bold: true, align: 'center', color }); });
  lab('addr', 266); bus(266, [[0, 2, 'A0'], [2, 8.4, 'A1']], INK);
  lab('register_file', 312); bus(312, [[0, 2, 'm[A0]'], [2, 8.4, 'm[A1]']], GOOD);
  lab('BRAM rdata', 358); bus(358, [[0, 3, 'm[A0]'], [3, 8.4, 'm[A1]']], ALERT);
  for (const u of [1, 3, 5, 7]) seg(s, X(u), 214, X(u), 392, { color: LINE, w: 0.75, dash: 'dash' });
  seg(s, X(2), 300, X(2), 400, { color: GOOD, w: 1.5 }); seg(s, X(3), 346, X(3), 400, { color: ALERT, w: 1.5 });
  T(s, '바로 반영', X(2) - 60, 404, 120, 20, { size: 11, bold: true, color: GOOD, align: 'center' });
  T(s, '다음 posedge', X(3) - 10, 404, 130, 20, { size: 11, bold: true, color: ALERT, align: 'center' });
  T(s, '점선 = posedge', 716, 470, 300, 20, { size: 11, color: MUTED });
  card(s, 40, 520, 590, 70, 1, 'FWFT', 'empty = 0인 동안 pop_data = 맨 앞 byte\nTB는 negedge에 pop_data를 바로 비교', acc, 13);
  card(s, 650, 520, 590, 70, 2, 'BRAM FIFO', '깊이를 키울 경우 BRAM 사용 가능\n대신 pop 후 1 clk 지연 handshake 필요', acc, 13);
  card(s, 40, 602, 1200, 70, 3, 'tb_bram', '03_RAM/sim_file/tb_bram.v: addr 10 · 11 · 31 · 32에 쓰기 → 같은 주소 읽기 (BRAM 읽기 1 clk 지연 확인용)', acc, 13);
}

// expected timing drawn from the user's fifo_wavedrom.txt
function slideWavedrom() {
  const s = newSlide('04');
  const acc = head(s, '04', '예상 타이밍', 'FIFO 예상 타이밍: 입력은 Negedge, 레지스터는 Posedge에서 갱신', [
    'push · pop은 negedge에 바꾸고 posedge에서 wptr · rptr · full · empty 갱신 → TB도 같은 규칙',
    'full 중 push (E)는 we = 0으로 무시, empty 뒤 pop_data는 이전 값 유지 (B*)',
  ]);
  const U = 26, X = (u) => 230 + u * (1000 / U);
  const rows = [
    ['phase', 'data', '=.=.......=.=...=.=...=.=.', ['RST', 'PUSH A~D', 'E (full)', 'POP', 'PUSH+POP', 'POP', 'POP (empty)', 'IDLE']],
    ['i_clk', 'clk'],
    ['i_reset', 'bit', '1.0.......................'],
    ['push', 'bit', '0.1.........0...1.0.......'],
    ['pop', 'bit', '0...........1...........0.'],
    ['push_data', 'data', 'x.=.=.=.=.=.x...=.x.......', ['A', 'B', 'C', 'D', 'E', 'F']],
    ['we', 'bit', '0.1......0......1.0.......'],
    ['wptr', 'data', '=..=.=.=.=.......=........', ['0', '1', '2', '3', '0', '1']],
    ['rptr', 'data', '=............=.=.=.=.=....', ['0', '1', '2', '3', '0', '1']],
    ['full', 'bit', '0........1...0............'],
    ['empty', 'bit', '1..0.................1....'],
    ['pop_data', 'data', 'x..=.........=.=.=.=.=....', ['A', 'B', 'C', 'D', 'F', 'B*']],
  ];
  const RH = 37, Y0 = 172;
  for (let u = 1; u < U; u += 2) seg(s, X(u), Y0 + RH, X(u), Y0 + RH * rows.length, { color: 'E2E8F0', w: 0.75, dash: 'dash' });
  rows.forEach(([name, kind, wave, data], r) => {
    const y = Y0 + r * RH, hi = y + 6, lo = y + RH - 8;
    T(s, name, 60, y, 160, RH, { font: MONO, size: 12, bold: true, align: 'right' });
    if (kind === 'clk') {
      const pts = [[X(0), hi]];
      for (let u = 0; u < U; u++) { const v = u % 2 ? hi : lo; pts.push([X(u), v]); pts.push([X(u + 1), v]); }
      poly(s, pts, { color: INK, w: 1.5 });
      return;
    }
    // split into segments
    const segs = []; let cur = null;
    for (let u = 0; u < U; u++) {
      const c = wave[u];
      if (c !== '.') { if (cur) segs.push(cur); cur = { c, a: u, b: u + 1 }; } else cur.b = u + 1;
    }
    segs.push(cur);
    let di = 0;
    if (kind === 'bit') {
      const pts = [];
      segs.forEach((g) => { const yy = g.c === '1' ? hi : lo; if (pts.length) pts.push([X(g.a), pts[pts.length - 1][1]]); pts.push([X(g.a), yy]); pts.push([X(g.b), yy]); });
      poly(s, pts, { color: name === 'full' || name === 'empty' ? ALERT : name === 'we' ? GOOD : WIRE, w: 2 });
    } else {
      segs.forEach((g) => {
        if (g.c === 'x') { R(s, X(g.a), hi, X(g.b) - X(g.a), lo - hi, { fill: 'E5E7EB', line: LINE, lw: 0.75 }); return; }
        const t = data[di++];
        const ph = name === 'phase';
        R(s, X(g.a), hi, X(g.b) - X(g.a), lo - hi, { fill: ph ? 'EEF2FF' : WHITE, line: ph ? '818CF8' : SUB, lw: 1 });
        T(s, t, X(g.a), hi, X(g.b) - X(g.a), lo - hi, { font: MONO, size: ph ? 10 : 11, bold: true, align: 'center', color: t === 'E' || t === 'B*' ? ALERT : INK });
      });
    }
  });
  T(s, '점선 = posedge  ·  출처: 03_RAM/sim_file/fifo_wavedrom.txt (설계 의도)', 230, Y0 + RH * rows.length + 4, 1000, 20, { size: 11, color: MUTED });
}

function slideTbH() {
  const s = newSlide('05');
  const acc = head(s, '05', 'TB 구조', 'TB: Negedge 구동 · Negedge 판정, compare_buffer가 기준 모델', [
    'push 값은 full = 0일 때만 compare_buffer에 기록, pop은 empty = 0일 때만 pop_data와 비교',
    'push_cnt · pop_cnt 2 bit → 4칸에서 자동 순환 (DUT의 wptr · rptr과 같은 방식)',
  ]);
  const box = (x, y, w, h, n, d, m) => { R(s, x, y, w, h, { fill: m.fill, line: m.line, lw: 1.75, radius: 6 }); T(s, n, x, y + 10, w, 24, { font: MONO, size: 14, bold: true, align: 'center' }); T(s, d, x + 8, y + 38, w - 16, h - 44, { size: 12, color: SUB, align: 'center', valign: 'top' }); };
  box(40, 190, 260, 130, 'Stimulus', 'negedge에 push · pop · push_data\ndirected 4 + random 256', MOD.pc);
  box(400, 190, 260, 130, 'fifo (DUT)', 'DEPTH 4\nposedge에 wptr · rptr · flag 갱신', { fill: 'ECFDF5', line: '059669' });
  box(760, 190, 480, 130, 'Checker (negedge)', 'pop & !empty → pop_data == compare_buffer[pop_cnt]\npass / fail $display · random은 count', { fill: BADBG, line: ALERT });
  seg(s, 300, 255, 400, 255, { color: WIRE, w: 2, arrow: true });
  seg(s, 660, 255, 760, 255, { color: WIRE, w: 2, arrow: true });
  T(s, 'pop_data · full · empty', 600, 170, 220, 18, { font: MONO, size: 10.5, bold: true, color: WIRE, align: 'center' });
  box(40, 360, 620, 140, 'compare_buffer[0:3]  (기준 모델)', 'push & !full → compare_buffer[push_cnt] ← push_data, push_cnt + 1\npop & !empty → pop_cnt + 1', MOD.top);
  seg(s, 170, 320, 170, 360, { color: MOD.top.line, w: 1.5, arrow: true });
  poly(s, [[660, 430], [1000, 430], [1000, 320]], { color: MOD.top.line, w: 1.5, arrow: true });
  T(s, '기대값', 860, 408, 100, 18, { size: 11, bold: true, color: MOD.top.line, align: 'center' });
  card(s, 40, 524, 590, 70, 1, '판정 시점', 'negedge = posedge 반 clk 전\n→ 그 순간 pop_data (FWFT 맨 앞) 비교', acc, 13);
  card(s, 650, 524, 590, 70, 2, 'full / empty', 'flag는 판정 시점 값 사용\n→ full 중 push는 모델에도 기록 안 함', acc, 13);
  card(s, 40, 606, 1200, 66, 3, '결과 출력', 'directed: 시점별 pass / fail 메시지 · random: pass count · fail count 집계 ($display)', acc, 13);
}

function slideScenarioH() {
  const s = newSlide('05');
  head(s, '05', '시나리오', 'FIFO 검증 시나리오 5개 모두 기대값과 일치', [
    'directed 4개로 reset · full · empty · 동시 push/pop 확인 → random 256으로 섞인 순서 확인',
    '시각은 xsim 기준 (clk 10 ns, 입력은 negedge)',
  ]);
  const B = '1E40AF';
  const rows = [
    [TH('#', B), TH('시나리오', B), TH('입력 (Stimulus)', B), TH('확인 신호', B), TH('예상 결과', B), TH('결과', B)],
    [TM('S1', { bold: true, color: B }), TC('Reset', { bold: true }), TC('i_reset 1 → 0 (20 ns)'), TC('full · empty (30 ns)'), TC('full 0 · empty 1'), PASS('2 / 2')],
    [TM('S2', { bold: true, color: B }), TC('Push × 5', { bold: true }), TC('0a ~ 0e push (40 ~ 90 ns)'), TC('wptr · full · register_file'), TC('4번째 push 후 full 1 · 0e 무시'), PASS('파형 확인')],
    [TM('S3', { bold: true, color: B }), TC('Pop × 5', { bold: true }), TC('pop 5회 (100 ~ 150 ns)'), TC('pop_data · rptr · empty'), TC('0a → 0d 순서 · empty 1'), PASS('5 / 5')],
    [TM('S4', { bold: true, color: B }), TC('Push + Pop × 5', { bold: true }), TC('0f ~ 0b push + pop (160 ~ 210 ns)'), TC('pop_data · wptr · rptr · empty'), TC('첫 clk push만 · 이후 개수 1 유지'), PASS('4 / 4')],
    [TM('S5', { bold: true, color: B }), TC('Random 256', { bold: true }), TC('push · pop · data 무작위 (240 ~ 2800 ns)'), TC('pop_data vs compare_buffer'), TC('불일치 0'), PASS('113 / 113')],
  ];
  table(s, rows, 40, 180, 1200, [60, 170, 330, 270, 230, 140], [36, 84, 84, 84, 84, 84], { size: 13 });
}

function simH(sub, title, lines, capTitle, capLines, right) {
  const s = newSlide('05');
  const acc = head(s, '05', sub, title, lines);
  capture(s, 40, 170, 820, 502, capTitle, capLines);
  right(s, acc);
}
function slideS1H() {
  simH('S1 Reset', 'S1 Reset: 해제 직후 full 0 · empty 1', [
    'i_reset 1 → 0 (20 ns) 뒤 첫 negedge (30 ns)에 flag 확인',
    'full 0 · empty 1 · wptr = rptr = 0 → **PASS 2 / 2**',
  ], 'S1 · 0 ~ 40 ns', ['i_clk · i_reset · full · empty', '(DUT_FIFO/U_UART_CONTROL/wptr_reg · rptr_reg 추가 권장)'], (s, acc) => {
    passBox(s, 880, 170, 360, '2 / 2', 'full · empty 판정');
    T(s, `${SIM} (30 ns)`, 880, 284, 360, 24, { size: 14, bold: true, color: acc });
    statRow(s, 880, 316, 360, 'full', '0', true);
    statRow(s, 880, 356, 360, 'empty', '1', true);
    statRow(s, 880, 396, 360, 'wptr / rptr', '0 / 0');
  });
}
function slideS2H() {
  simH('S2 Push × 5', 'S2 Push × 5: 4번째 Push 후 Full, 5번째는 무시', [
    '0a ~ 0d push → posedge마다 wptr 0 → 1 → 2 → 3 → 0, 4번째 뒤 (75 ns) full 1',
    'full 중 0e push → we = 0 → wptr · register_file 그대로 (모델에도 기록 안 함)',
  ], 'S2 · 35 ~ 95 ns', ['push · push_data · wptr · full', 'DUT_FIFO/U_REG_FILE/register_file (0a ~ 0d 채워지는 모습)'], (s, acc) => {
    passBox(s, 880, 170, 360, '파형 확인', 'TB 자동 판정 없음');
    T(s, SIM, 880, 284, 360, 24, { size: 14, bold: true, color: acc });
    statRow(s, 880, 316, 360, 'wptr 갱신', '45 ~ 75 ns');
    statRow(s, 880, 356, 360, 'full 1', '75 ns');
    statRow(s, 880, 396, 360, '0e push (80 ns)', '무시');
    statRow(s, 880, 436, 360, 'register_file', '0a 0b 0c 0d');
  });
}
function slideS3H() {
  simH('S3 Pop × 5', 'S3 Pop × 5: 넣은 순서대로 0a → 0d, 4번째 Pop 후 Empty', [
    'negedge마다 pop_data를 compare_buffer와 비교 → 0a · 0b · 0c · 0d 순서 일치',
    '4번째 pop 뒤 (135 ns) empty 1 → 5번째 pop은 무시 (rptr 그대로)',
  ], 'S3 · 95 ~ 155 ns', ['pop · pop_data · rptr · empty', 'compare_buffer · pop_cnt'], (s, acc) => {
    passBox(s, 880, 170, 360, '5 / 5', 'pop 4 + empty 1');
    T(s, SIM, 880, 284, 360, 24, { size: 14, bold: true, color: acc });
    statRow(s, 880, 316, 360, 'pop_data 비교', '100 ~ 130 ns');
    statRow(s, 880, 356, 360, '순서', '0a 0b 0c 0d');
    statRow(s, 880, 396, 360, 'empty 1', '135 ns');
    statRow(s, 880, 436, 360, '5번째 pop (140 ns)', '무시');
  });
}
function slideS4H() {
  simH('S4 Push + Pop', 'S4 Push + Pop × 5: Empty 중엔 Push만, 이후 개수 1 유지', [
    '160 ns empty 중 push + pop → push만 (0f 저장, empty 0)',
    '170 ~ 200 ns push + pop → wptr · rptr 같이 +1, pop_data 0f · 0e · 0d · 0c 순서 일치',
  ], 'S4 · 155 ~ 225 ns', ['push · pop · push_data · pop_data', 'wptr · rptr · empty'], (s, acc) => {
    passBox(s, 880, 170, 360, '4 / 4', 'pop_data 판정');
    T(s, SIM, 880, 284, 360, 24, { size: 14, bold: true, color: acc });
    statRow(s, 880, 316, 360, '160 ns', 'push만 (0f)');
    statRow(s, 880, 356, 360, 'pop_data', '0f 0e 0d 0c');
    statRow(s, 880, 396, 360, '개수', '1 유지');
    statRow(s, 880, 436, 360, '210 ns pop', 'empty 1 (215 ns)');
  });
}
function slideS5H() {
  const s = newSlide('05');
  const acc = head(s, '05', 'S5 Random', 'S5 Random 256: Pop 비교 113회 모두 일치', [
    'push · pop · push_data를 매 clk 무작위 → pop & !empty마다 compare_buffer와 비교 → **113 / 113 PASS**',
    'full 중 push+pop 5회 · empty 중 push+pop 8회 · wptr 순환 29회 포함',
  ]);
  capture(s, 40, 170, 820, 244, 'S5-A · 485 ~ 535 ns  (full 중 push+pop)', ['500 ns push → full 1 · 510 ns push+pop → pop만 (d0 버림)']);
  capture(s, 40, 428, 820, 244, 'S5-B · 1385 ~ 1455 ns  (empty 중 pop · push+pop)', ['1405 ns empty 1 · 1410 · 1420 ns pop 무시 · 1440 ns push+pop → push만 (4b)']);
  passBox(s, 880, 170, 360, '113 / 113', 'pop 비교 · fail 0');
  T(s, `경계 경우 (${SIM})`, 880, 284, 360, 24, { size: 14, bold: true, color: acc });
  [['push & full', '5'], ['pop & empty', '7'], ['push+pop & empty', '8'], ['push+pop & mid', '55'], ['push+pop & full', '5'], ['wptr 순환', '29']].forEach(([k, v], i) => statRow(s, 880, 316 + i * 40, 360, k, v));
  T(s, 'random 256 iteration (240 ~ 2790 ns) 기준', 880, 560, 360, 20, { size: 11, color: MUTED });
}

function slideBoundaryH() {
  const s = newSlide('06');
  const acc = head(s, '06', '경계 동작', '검증 중 확인한 경계 동작 3가지', [
    '시나리오 5개 모두 PASS → FAIL로 이어진 문제 없음',
    '구조상 동작 3가지 확인 — full 중 push 무시 · full 중 push+pop은 pop만 · empty 중 push+pop은 push만',
  ]);
  const panel = (x, n, title, lines, ex) => {
    R(s, x, 176, 390, 496, { fill: CARD, line: CARDLINE, radius: 8 });
    badge(s, x + 16, 190, n, acc, 28);
    T(s, title, x + 54, 186, 326, 36, { size: 15.5, bold: true });
    T(s, lines.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })), x + 20, 236, 354, 250, { size: 13.5, valign: 'top', psa: 8 });
    T(s, '실제 발생', x + 20, 506, 354, 22, { size: 12.5, bold: true, color: acc });
    T(s, ex, x + 20, 532, 354, 120, { font: MONO, size: 12, valign: 'top', ls: 1.15 });
  };
  panel(40, 1, 'full 중 push → 무시', ['we = push & ~full → 쓰기 차단', 'wptr · flag 그대로', 'TB 모델도 full = 1일 때 기록 안 함'], 'S2  80 ns  0e\nS5  700 · 1560 · 1570\n    2140 · 2150 ns');
  panel(445, 2, 'full 중 push+pop → pop만', ['control_unit: full 상태 → rptr만 +1, full ← 0', '그 clk의 push_data는 버려짐', '모듈 구조상 정한 동작'], 'S5  510 ns  d0 버림\n    640 · 900 · 1290\n    2640 ns');
  panel(850, 3, 'empty 중 push+pop → push만', ['empty 상태 → pop 무시, wptr만 +1', 'empty ← 0, 다음 clk부터 pop 가능', 'pop_data는 그 다음 clk에 새 값'], 'S4  160 ns  0f\nS5  250 · 1000 · 1140\n    1440 ns 외 4회');
}

function slideConclusionH() {
  const s = newSlide('07');
  const acc = head(s, '07', '결론 · 고찰', 'FIFO 순서 · 경계 동작 모두 기대값과 일치', [
    'directed 4개 (reset · full · empty · 동시 push/pop) + random 256 → **fail 0**',
    'full 중 push+pop은 pop만 하는 구조상 spec까지 TB 모델과 일치',
  ]);
  T(s, '결론', 40, 172, 300, 28, { size: 17, bold: true, color: GOOD });
  const rows = [
    [TH('시나리오'), TH('결과'), TH('판정')],
    [TC('S1 Reset'), TM('full 0 · empty 1'), PASS()],
    [TC('S2 Push × 5'), TM('full 1 · 0e 무시 (파형)'), PASS()],
    [TC('S3 Pop × 5'), TM('0a → 0d · empty 1'), PASS()],
    [TC('S4 Push + Pop × 5'), TM('push만 → 개수 1 유지'), PASS()],
    [TC('S5 Random 256'), TM('113 / 113'), PASS()],
  ];
  table(s, rows, 40, 206, 640, [230, 300, 110], [34, 52, 52, 52, 52, 52], { size: 13.5 });
  R(s, 710, 172, 530, 230, { fill: WHITE, line: 'C2410C', lw: 1.5, radius: 6 });
  R(s, 710, 172, 530, 36, { fill: 'C2410C', radius: 6 });
  T(s, '고찰', 726, 172, 500, 36, { size: 15, bold: true, color: WHITE });
  T(s, [
    { text: 'S2 full 확인은 TB 자동 판정이 없어 파형으로만 확인', options: { bullet: true, breakLine: true } },
    { text: 'directed 결과는 메시지만 출력, 개수 집계는 random만', options: { bullet: true, breakLine: true } },
    { text: '$random seed 고정 → 매번 같은 순서의 random', options: { bullet: true } },
  ], 726, 214, 500, 180, { size: 13.5, valign: 'top', psa: 6 });
  R(s, 710, 420, 530, 252, { fill: WHITE, line: '1E3A8A', lw: 1.5, radius: 6 });
  R(s, 710, 420, 530, 36, { fill: '1E3A8A', radius: 6 });
  T(s, '개선 방향', 726, 420, 500, 36, { size: 15, bold: true, color: WHITE });
  T(s, [
    { text: 'directed 단계도 pass / fail count + full · empty 자동 판정', options: { bullet: { type: 'number' }, breakLine: true } },
    { text: 'seed를 바꿔 random 반복 · 경계 경우 횟수 출력', options: { bullet: { type: 'number' }, breakLine: true } },
    { text: '깊이를 키울 경우 BRAM 기반 FIFO (읽기 1 clk 지연 handshake)', options: { bullet: { type: 'number' } } },
  ], 726, 462, 500, 200, { size: 13.5, valign: 'top', psa: 6 });
  T(s, '구조 요약', 40, 540, 640, 26, { size: 15, bold: true, color: acc });
  const fl = [['push', MOD.pc], ['control_unit', MOD.top], ['register_file', MOD.glue], ['pop_data', MOD.tx]];
  fl.forEach(([n, m], i) => {
    const x = 40 + i * 162;
    R(s, x, 580, 144, 64, { fill: m.fill, line: m.line, lw: 1.75, radius: 6 });
    T(s, n, x, 580, 144, 64, { font: MONO, size: 14, bold: true, align: 'center' });
    if (i < 3) seg(s, x + 146, 612, x + 160, 612, { color: WIRE, w: 2, arrow: true });
  });
}

function slideTbLogH() {
  const s = newSlide('A');
  head(s, 'A', 'TB 로그', 'TB 로그: Directed 11 PASS · Random 113 PASS', [
    'Tcl console 출력 (directed pass 메시지 + random result)',
    'random result: total 256 · pass 113 · fail 0',
  ]);
  capture(s, 40, 170, 1200, 502, 'Tcl console 로그', ['directed pass 메시지 (30 ~ 200 ns) + "*** random result ***" 블록', '로그 캡처 후 이 영역에 배치']);
}

// =====================================================================
// build
// =====================================================================
slideCoverH();
slideContents();
slideSummaryH();
slideGoalH();
slideFifoConcept();
slideMemory();
slideFifoInside();
slideCtrlTable();
slideWavedrom();
slideTbH();
slideScenarioH();
slideS1H();
slideS2H();
slideS3H();
slideS4H();
slideS5H();
slideBoundaryH();
slideConclusionH();
slideQnA();
slideTbLogH();
TOTAL = PAGE;
fillContents();
fs.writeFileSync(MAP, JSON.stringify({ total: TOTAL, imports: [] }, null, 1));
pptx.writeFile({ fileName: OUT }).then((f) => console.log('wrote', f, 'slides', TOTAL));
