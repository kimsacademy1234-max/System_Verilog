// build_final.js — UART Loopback final deck (diagram-deck style + 결론 line)
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
  '02': ['UART Reference', '0369A1'],
  '03': ['블록 다이어그램', '4338CA'],
  '04': ['ASM 차트', '7C3AED'],
  '05': ['시뮬레이션', 'B45309'],
  '06': ['트러블 슈팅', 'B91C1C'],
  '07': ['시연', '15803D'],
  '08': ['결론 · 고찰', '1E293B'],
  'A':  ['APPENDIX', '64748B'],
};

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in = 1280 x 720 px
pptx.title = 'UART Loopback';
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
  T(s, '정안성  ·  UART Loopback', 40, 694, 400, 16, { size: 9, color: '94A3B8' });
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
  ['00', 'Summary', '핵심 수치 · 검증 결과'],
  ['01', '목적', '설계 대상 · 목표 동작'],
  ['02', 'UART Reference', '프로토콜 · 16x oversampling · margin · 16x 선택 이유'],
  ['03', '블록 다이어그램', 'uart_loopback · top_ascii'],
  ['04', 'ASM 차트', 'uart_rx · uart_tx'],
  ['05', '시뮬레이션', '시나리오 · RX 타이밍 · Data sampling · TX echo'],
  ['06', '트러블 슈팅', '현상 → 원인 → 해결 → 적용 결과'],
  ['07', '시연', 'ComPortMaster · Basys-3 FND'],
  ['08', '결론 · 고찰', '결론 · ONE BIT mode 한계 · 개선 방향'],
  ['A', 'APPENDIX', 'Glitch 입력 방법 · 폭 기준 · 결과'],
];
function slideContents() {
  const s = pptx.addSlide(); PAGE += 1; slides.push({ sec: 'contents', page: PAGE });
  s.background = { color: WHITE };
  T(s, 'Contents', 56, 64, 400, 56, { size: 34 });
  T(s, 'PC → uart_rx → uart_tx → PC loopback으로\nRX · TX를 한 번에 검증', 56, 128, 420, 52, { size: 13, color: SUB, ls: 1.1 });
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
  const s = newSlide('02');
  const acc = head(s, '02', 'Margin', 'Sampling Margin: Start 검출 지연 최대 1 tick → 늦은 쪽 43.75 %', [
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
  const s = newSlide('02');
  const acc = head(s, '02', '16x 선택 이유', '16x: Margin · Baud 정확도 · 최대 속도의 균형점', [
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
  const s = newSlide('04');
  const acc = head(s, '04', 'uart_rx ASM', 'uart_rx ASM: START 중앙 정렬 후 16 tick마다 Sampling', [
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
  const s = newSlide('04');
  const acc = head(s, '04', 'uart_tx ASM', 'uart_tx ASM: tx_start 후 각 Bit 16 tick 유지, LSB First', [
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
// build
// =====================================================================
slideCover();
slideContents();
slideSummary();
slideGoal();
slideProtocol();
slideTiming();
slideMargin();
slideWhy16();
slideBlock();
slideSystem();
slideRxAsm();
slideTxAsm();
slideScenario();
slideSims();
slideTrouble();
slideDemo();
slideConclusion();
slideQnA();
slideApxPlacement();
slideApxBurst();
slideApxWidth();
slideApxStart();
slideApxData();
TOTAL = PAGE;
fillContents();
fillScenario();
fs.writeFileSync(MAP, JSON.stringify({ total: TOTAL, imports: importMap }, null, 1));
pptx.writeFile({ fileName: OUT }).then((f) => console.log('wrote', f, 'slides', TOTAL));
