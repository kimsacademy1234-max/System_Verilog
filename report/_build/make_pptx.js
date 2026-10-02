const pptxgen = require('pptxgenjs');
const path = require('path');

const IMG = '/mnt/c/26_AI_CAMP/System_Verilog/report/images/';
const OUT = '/mnt/c/26_AI_CAMP/System_Verilog/report/정안성_HW1_8bit_adder.pptx';

const C = {
  ac: '3730A3', ac2: 'EEF2FF', ink: '1F2937', sub: '6B7280', soft: 'F3F4F6',
  line: 'D1D5DB', ok: '15803D', ok2: 'F0FDF4', warn: 'B45309', warn2: 'FFFBEB',
  code: '0F172A', codeTx: 'E2E8F0', codeCm: '94A3B8', codeKw: '93C5FD', cover: '26215F', white: 'FFFFFF',
};
const F = 'Malgun Gothic';
const MONO = 'Consolas';

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';            // 13.333 x 7.5
pres.title = 'HW1 8-bit Adder';
pres.author = '정안성';

const W = 13.333, M = 0.6, CW = W - 2 * M;
let pageNo = 0;

function T(slide, text, o) {
  slide.addText(text, Object.assign({ isTextBox: true, fontFace: F, color: C.ink, margin: 0, valign: 'top' }, o));
}
function header(slide, sec, title, lead) {
  pageNo++;
  T(slide, sec, { x: M, y: 0.38, w: 6, h: 0.28, fontSize: 12, bold: true, color: C.ac });
  T(slide, title, { x: M, y: 0.66, w: CW, h: 0.62, fontSize: 26, bold: true, valign: 'middle' });
  if (lead) T(slide, lead, { x: M, y: 1.3, w: CW, h: 0.34, fontSize: 13, color: C.sub });
  T(slide, String(pageNo + 1), { x: W - 1.0, y: 7.05, w: 0.5, h: 0.25, fontSize: 10, color: '9CA3AF', align: 'right' });
}
function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill || C.soft }, line: { type: 'none' }, rectRadius: 0.1 });
}
function numCircle(slide, n, x, y, d) {
  d = d || 0.34;
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: C.ac }, line: { type: 'none' } });
  T(slide, String(n), { x, y, w: d, h: d, fontSize: 12, bold: true, color: C.white, align: 'center', valign: 'middle' });
}
function img(slide, file, x, y, w, h, extra) {
  slide.addImage(Object.assign({ path: IMG + file, x, y, w, h }, extra || {}));
}
// fit image (px size) into a box, keep ratio, align top-left or centered
function fit(pw, ph, bw, bh) { const r = Math.min(bw / pw, bh / ph); return { w: pw * r, h: ph * r }; }

function table(slide, rows, o) {
  const hdr = rows[0].map(t => ({ text: t, options: { bold: true, fill: { color: C.soft } } }));
  const body = rows.slice(1).map(r => r.map(c => (typeof c === 'string' ? { text: c } : c)));
  slide.addTable([hdr, ...body], Object.assign({
    fontFace: F, fontSize: 12, color: C.ink, valign: 'middle',
    border: { type: 'solid', pt: 0.75, color: 'E5E7EB' }, margin: [0.05, 0.1, 0.05, 0.1],
  }, o));
}
// code block: lines starting with // are comments
function codeBox(slide, x, y, w, h, code, size) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.code }, line: { type: 'none' }, rectRadius: 0.08 });
  const lines = code.split('\n');
  const runs = lines.map((ln, i) => ({
    text: ln.length ? ln : ' ',
    options: { color: ln.trim().startsWith('//') ? C.codeCm : C.codeTx, breakLine: i < lines.length - 1 },
  }));
  slide.addText(runs, { isTextBox: true, x: x + 0.15, y: y + 0.12, w: w - 0.3, h: h - 0.24, fontFace: MONO, fontSize: size || 10.5, margin: 0, valign: 'top', paraSpaceAfter: 0, lineSpacingMultiple: 1.05 });
}
function tag(slide, text, x, y, color) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 0.62, h: 0.24, fill: { color }, line: { type: 'none' }, rectRadius: 0.12 });
  T(slide, text, { x, y, w: 0.62, h: 0.24, fontSize: 9, bold: true, color: C.white, align: 'center', valign: 'middle' });
}
function bullets(items, size) {
  return items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, fontSize: size || 13 } }));
}

// ---------------------------------------------------------------- 1. 표지
{
  const s = pres.addSlide();
  s.background = { color: C.cover };
  T(s, 'HW1 · FPGA DESIGN', { x: 0.95, y: 0.9, w: 8, h: 0.35, fontSize: 14, bold: true, color: 'C7D2FE', charSpacing: 3 });
  T(s, '8-bit Ripple Carry Adder\n설계와 Basys3 구현', { x: 0.95, y: 1.5, w: 11, h: 1.9, fontSize: 44, bold: true, color: C.white, valign: 'top' });
  T(s, 'Half Adder → Full Adder → 4-bit → 8-bit, 모듈 인스턴시에이션으로 조립', { x: 0.95, y: 3.55, w: 11, h: 0.45, fontSize: 17, color: 'E0E7FF' });
  T(s, '정안성', { x: 0.95, y: 5.85, w: 6, h: 0.4, fontSize: 17, bold: true, color: C.white });
  T(s, '2026. 10. 01 · Vivado 2020.2 · Basys3 (Artix-7)', { x: 0.95, y: 6.3, w: 8, h: 0.35, fontSize: 14, color: 'C7D2FE' });
}

// ---------------------------------------------------------------- 2. SUMMARY
{
  const s = pres.addSlide();
  header(s, 'SUMMARY', '8-bit Adder는 전 입력에서 정답, 보드에서도 정상 동작', '남은 과제는 지연·글리치 같은 조합 회로의 한계 검증');
  const stats = [['65,536', 'a, b = 0~255 전수 시뮬레이션'], ['0', '오류 수 (65,536개 비교)\ncarry 32,640개 일치'], ['8 LUT', 'FF 0개, 순수 조합 회로'], ["'C'", 'carry 발생 시 7-Segment 표시 확인']];
  const cw = (CW - 3 * 0.3) / 4;
  stats.forEach((st, i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 1.95, cw, 1.7);
    T(s, st[0], { x: x + 0.25, y: 2.15, w: cw - 0.4, h: 0.75, fontSize: 36, bold: true, color: C.ac, valign: 'middle' });
    T(s, st[1], { x: x + 0.25, y: 2.95, w: cw - 0.4, h: 0.6, fontSize: 11.5, color: C.sub });
  });
  const hw = (CW - 0.3) / 2;
  card(s, M, 4.0, hw, 1.05, C.ac2);
  T(s, [{ text: '잘 된 것', options: { bold: true, breakLine: true } }, { text: '모듈을 작게 나눠 검증하고 재사용 → 상위 모듈은 연결만 확인하면 됨' }], { x: M + 0.25, y: 4.15, w: hw - 0.5, h: 0.8, fontSize: 13 });
  card(s, M + hw + 0.3, 4.0, hw, 1.05, C.warn2);
  T(s, [{ text: '보완할 것', options: { bold: true, breakLine: true } }, { text: 'cin = 1 미검증 · 지연 없는 기능 시뮬레이션만 수행' }], { x: M + hw + 0.55, y: 4.15, w: hw - 0.5, h: 0.8, fontSize: 13 });
}

// ---------------------------------------------------------------- 3. 목차
{
  const s = pres.addSlide();
  header(s, 'CONTENTS', '목차');
  const items = ['개요 · 개발 환경', '목표', '설계 · 블록 다이어그램 · 보드 I/O', '검증 · 파형 · 보드 동작', '구현 결과', '트러블슈팅 · 결론'];
  items.forEach((t, i) => {
    const col = i < 3 ? 0 : 1, row = i % 3;
    const x = M + col * 6.2, y = 2.0 + row * 0.8;
    numCircle(s, i + 1, x, y, 0.44);
    T(s, t, { x: x + 0.65, y, w: 5.2, h: 0.44, fontSize: 18, valign: 'middle' });
  });
}

// ---------------------------------------------------------------- 4. 개요
{
  const s = pres.addSlide();
  header(s, '1. 개요', "스위치 두 개 값을 더해 LED로, carry는 7-Segment 'C'로 표시", 'Half Adder부터 단계적으로 만들고, 아래 모듈을 인스턴스로 불러 위 모듈을 조립');
  table(s, [['항목', '내용'], ['Tool', 'Vivado 2020.2'], ['Board', 'Basys3 · Artix-7 xc7a35tcpg236-1'], ['Language', 'Verilog HDL'],
    ['편집 · Lint', 'WSL Ubuntu + vim + Verilator'], ['입력', 'SW0~7 = A, SW8~15 = B, BTNL = cin'], ['출력', "LED = sum, 7-Seg 'C' = carry"]],
    { x: M, y: 1.95, w: 5.9, colW: [1.6, 4.3], rowH: 0.48, fontSize: 13 });
  const x = M + 6.3, w = CW - 6.3;
  card(s, x, 1.95, w, 2.2);
  T(s, '왜 Vivado 2020.2?', { x: x + 0.25, y: 2.1, w: w - 0.5, h: 0.35, fontSize: 15, bold: true });
  T(s, bullets(['수업 예제와 같은 버전 → 프로젝트 공유 가능 (Vivado 프로젝트는 하위 버전에서 안 열림)', '2021.1부터 ML Edition, 작은 조합 회로엔 차이 거의 없음', '무료 WebPACK으로 Artix-7 35T 지원']),
    { x: x + 0.25, y: 2.5, w: w - 0.5, h: 1.55, paraSpaceAfter: 4 });
  card(s, x, 4.4, w, 1.45);
  T(s, 'Verilog 특징', { x: x + 0.25, y: 4.55, w: w - 0.5, h: 0.35, fontSize: 15, bold: true });
  T(s, bullets(['회로를 글로 기술, 모든 assign·인스턴스가 동시에 동작', '#delay, $display는 시뮬레이션 전용']), { x: x + 0.25, y: 4.95, w: w - 0.5, h: 0.8, paraSpaceAfter: 4 });
}

// ---------------------------------------------------------------- 5. FPGA
{
  const s = pres.addSlide();
  header(s, '1. 개요', 'FPGA는 칩을 만들기 전에 회로를 실제로 돌려보는 수단', 'ASIC은 Fab에 올리면 수정 불가 → FPGA로 먼저 구현·검증, 고치면 비트스트림만 다시 다운로드');
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.95, w: 3.3, h: 4.4, fill: { color: '000000' }, line: { type: 'none' }, rectRadius: 0.1 });
  img(s, 'board_basys3.png', M + 0.0, 1.95, 3.3, 4.4);
  const x0 = M + 3.7, fw = CW - 3.7;
  const steps = [['RTL', 'Verilog'], ['Simulation', 'TB 검증'], ['Synthesis', 'LUT 변환'], ['Implementation', '배치·배선'], ['Bitstream', '.bit'], ['Board', '동작 확인']];
  const bw = (fw - 5 * 0.18) / 6;
  steps.forEach((st, i) => {
    const x = x0 + i * (bw + 0.18);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: bw, h: 0.75, fill: { color: C.ac2 }, line: { color: C.ac, width: 1.25 }, rectRadius: 0.08 });
    T(s, [{ text: st[0], options: { bold: true, color: C.ac, breakLine: true, fontSize: 11.5 } }, { text: st[1], options: { fontSize: 10.5 } }], { x, y: 1.95, w: bw, h: 0.75, align: 'center', valign: 'middle' });
    if (i < 5) T(s, '›', { x: x + bw, y: 1.95, w: 0.18, h: 0.75, fontSize: 16, bold: true, color: C.ac, align: 'center', valign: 'middle' });
  });
  table(s, [['Basys3', ''], ['FPGA', 'Artix-7 XC7A35T · LUT 20,800 · FF 41,600'], ['I/O', '스위치 16 · 버튼 5 · LED 16 · 7-Segment 4자리'], ['Clock', '100 MHz (W5)'],
    ['SW', 'Vivado 합성·구현 → Hardware Manager로 USB-JTAG 다운로드'], ['활용 분야', 'ASIC 프로토타이핑, 통신·신호처리, 데이터센터 가속, 자동차·항공']],
    { x: x0, y: 3.0, w: fw, colW: [1.6, fw - 1.6], rowH: 0.48, fontSize: 12.5 });
}

// ---------------------------------------------------------------- 6. 목표
{
  const s = pres.addSlide();
  header(s, '2. 목표', '정답 확인을 넘어, 조합 회로의 한계를 찾는 것이 목표');
  const goals = [['한계 분석', '전수 검사 + 코너 케이스로 정답 확인 후, 입력 타이밍 차이 · 글리치 · carry 지연 등 조합 회로의 약점 분석'],
    ['AI 더블 체크', '직접 만든 TB와 파형 해석을 AI가 작성한 별도 TB · 다른 시뮬레이터로 교차 검증'],
    ['개선 방향', '클럭(레지스터) 도입, 더 빠른 adder 구조 등 해결 방향 정리']];
  const cw = (CW - 2 * 0.3) / 3;
  goals.forEach((g, i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 2.0, cw, 2.4);
    numCircle(s, i + 1, x + 0.3, 2.25, 0.42);
    T(s, g[0], { x: x + 0.85, y: 2.25, w: cw - 1.1, h: 0.42, fontSize: 16, bold: true, valign: 'middle' });
    T(s, g[1], { x: x + 0.3, y: 2.9, w: cw - 0.6, h: 1.35, fontSize: 13 });
  });
}

// ---------------------------------------------------------------- 7. 블록 다이어그램
{
  const s = pres.addSlide();
  header(s, '3. 설계', 'Half Adder 16개로 만든 8-bit Adder, carry는 8단을 직렬로 통과');
  const f = fit(2400, 1620, CW, 5.55);
  img(s, 'block_diagram.png', (W - f.w) / 2, 1.45, f.w, f.h);
}

// ---------------------------------------------------------------- 8. 모듈 구성
{
  const s = pres.addSlide();
  header(s, '3. 설계', '작은 모듈을 인스턴스로 불러 4단계로 조립', 'Vivado RTL Schematic으로 계층 연결이 의도대로 된 것 확인');
  table(s, [['모듈', '구성'], ['Half_Adder', 's = a ^ b,  c = a & b'], ['Full_Adder', 'Half_Adder × 2 + OR'], ['Full_Adder_4bit', 'Full_Adder × 4, carry 직렬 연결'], ['Full_Adder_8bit', "4bit × 2 + carry 시 7-Seg 'C'"]],
    { x: M, y: 1.95, w: 5.4, colW: [1.9, 3.5], rowH: 0.5, fontSize: 12.5 });
  const x = M + 5.8, w = CW - 5.8;
  let f = fit(1225, 421, w, 2.2);
  img(s, 'rtl_top_8bit.png', x, 1.95, f.w, f.h);
  T(s, 'Top: DUT_1의 carry → DUT_2의 cin', { x, y: 1.95 + f.h + 0.05, w, h: 0.28, fontSize: 11, color: C.sub });
  const y2 = 1.95 + f.h + 0.5;
  const f1 = fit(620, 207, w * 0.6, 1.6), f2 = fit(302, 212, w * 0.36, 1.6);
  img(s, 'rtl_full_adder.png', x, y2, f1.w, f1.h);
  T(s, 'Full_Adder = HA × 2 + OR', { x, y: y2 + f1.h + 0.05, w: f1.w, h: 0.28, fontSize: 11, color: C.sub });
  img(s, 'rtl_half_adder.png', x + w - f2.w, y2, f2.w, f2.h);
  T(s, 'Half_Adder = AND + XOR', { x: x + w - f2.w, y: y2 + f2.h + 0.05, w: f2.w, h: 0.28, fontSize: 11, color: C.sub });
}

// ---------------------------------------------------------------- 9. 보드 I/O
{
  const s = pres.addSlide();
  header(s, '3. 설계', '왼쪽 스위치 8개 = B, 오른쪽 8개 = A, 결과는 LED와 7-Segment', 'Basys-3-Master.xdc에서 필요한 줄만 살려 포트 이름으로 매핑 (LVCMOS33)');
  const f = fit(760, 900, 4.3, 5.1);
  img(s, 'crop_board_io.png', M, 1.85, f.w, f.h);
  const x = M + 4.7, w = CW - 4.7;
  table(s, [['신호', '보드', '핀'], ['i_a[7:0]', 'SW0 ~ SW7', 'V17 … W13'], ['i_b[7:0]', 'SW8 ~ SW15', 'V2 … R2'], ['i_cin', 'BTNL', 'W19'], ['o_s[7:0]', 'LD0~3, LD5~8', 'U16 … V13'],
    ['o_c_out', 'LD4', { text: 'W18  (XDC 추가 필요)', options: { color: C.warn, bold: true } }], ['seg[6:0] / an[3:0]', '7-Segment', 'W7 … U7 / U2 … W4']],
    { x, y: 1.85, w, colW: [2.0, 2.2, w - 4.2], rowH: 0.42, fontSize: 12 });
  const fs = fit(380, 410, 1.6, 1.75);
  img(s, 'crop_seg.png', x, 5.0, fs.w, fs.h);
  card(s, x + 1.9, 5.05, w - 1.9, 1.6, C.ac2);
  T(s, ["seg 번호 배치는 Basys3 기준과 일치 (Active-Low)", "seg = 1000110 → a·d·e·f 점등 = 'C'", 'an = 1110 → 맨 오른쪽 자리만 사용', "디코더가 아니라 carry ? 'C' : 끔 선택(MUX)"].map((t, i, a) => ({ text: t, options: { breakLine: i < a.length - 1 } })),
    { x: x + 2.15, y: 5.2, w: w - 2.4, h: 1.35, fontSize: 12.5, paraSpaceAfter: 3 });
}

// ---------------------------------------------------------------- 10. 검증 방법
{
  const s = pres.addSlide();
  header(s, '4. 검증', '검증은 두 가지: 매 입력마다 a+b 비교, carry 개수 확인', 'a, b = 0~255 전부(65,536개)를 10 ns 간격으로 넣고 TB가 스스로 PASS/FAIL 판정');
  const lw = 5.7;
  card(s, M, 1.95, lw, 1.45);
  numCircle(s, 1, M + 0.25, 2.1);
  T(s, 'a + b = sum 인가', { x: M + 0.75, y: 2.1, w: lw - 1, h: 0.34, fontSize: 15, bold: true, valign: 'middle' });
  T(s, 'carry가 비트를 차례로 건너가며 계산되므로, 입력 후 #10 기다린 뒤 최종 {c_out, sum}을 a + b와 비교. 틀리면 그때의 a, b, sum 출력', { x: M + 0.25, y: 2.55, w: lw - 0.5, h: 0.8, fontSize: 12.5 });
  card(s, M, 3.6, lw, 1.3);
  numCircle(s, 2, M + 0.25, 3.75);
  T(s, 'carry 개수가 맞는가', { x: M + 0.75, y: 3.75, w: lw - 1, h: 0.34, fontSize: 15, bold: true, valign: 'middle' });
  T(s, [{ text: 'a = k 일 때 a + b ≥ 256 이 되는 b는 k개', options: { breakLine: true } }, { text: '→ 1 + 2 + … + 255 = 255 × 256 / 2 = ' }, { text: '32,640', options: { bold: true } }],
    { x: M + 0.25, y: 4.2, w: lw - 0.5, h: 0.65, fontSize: 12.5 });
  table(s, [['TB', '범위'], ['tb_Full_Adder_4bit', 'a, b = 0~15, cin = 0~1 (512개)'], ['tb_adder', 'a, b = 0~255, cin = 0 (65,536개)']],
    { x: M, y: 5.1, w: lw, colW: [2.1, lw - 2.1], rowH: 0.4, fontSize: 12 });
  codeBox(s, M + lw + 0.3, 1.95, CW - lw - 0.3, 4.75,
`for (i=0; i<256; i=i+1)
  for (j=0; j<256; j=j+1) begin
    a = i;  b = j;
    #10;

    if (c_out == 1'b1)
      carry_cnt = carry_cnt + 1;

    // if result is not a+b, print a, b and sum
    if ({c_out, sum} !== {1'b0, a} + b) begin
      err_cnt = err_cnt + 1;
      $display("[FAIL] a=%3d b=%3d -> c_out=%b sum=%3d ...");
    end
  end

if (err_cnt == 0)
  $display("[PASS] all 65536 cases correct");

// expected carry count = 1 + 2 + ... + 255 = 32640
if (carry_cnt == 32640)
  $display("[PASS] carry count = %0d (expected 32640)", carry_cnt);`, 10.5);
}

// ---------------------------------------------------------------- 11. 검증 결과
{
  const s = pres.addSlide();
  header(s, '4. 검증', '65,536개 전부 정답, carry도 기댓값 32,640개와 일치', 'Vivado 시뮬레이션 콘솔 마지막 부분');
  const f = fit(360, 278, 5.8, 4.8);
  img(s, 'console_tb_adder_pass.png', M, 1.95, f.w, f.h);
  const x = M + 6.2, w = CW - 6.2;
  table(s, [['검사', '결과'], ['a + b = sum (65,536개)', { text: 'PASS  오류 0', options: { color: C.ok, bold: true } }], ['carry 개수', { text: 'PASS  32,640 / 32,640', options: { color: C.ok, bold: true } }], ['4-bit (512개)', { text: 'PASS  오류 0', options: { color: C.ok, bold: true } }]],
    { x, y: 1.95, w, colW: [2.9, w - 2.9], rowH: 0.48, fontSize: 13 });
  card(s, x, 4.2, w, 1.25);
  T(s, '마지막 구간 확인', { x: x + 0.25, y: 4.35, w: w - 0.5, h: 0.32, fontSize: 14, bold: true });
  T(s, 'a = 255 구간 : b가 1 늘 때마다 sum도 1씩 증가, 255 + 255 = 510 → c_out 1, sum 254', { x: x + 0.25, y: 4.72, w: w - 0.5, h: 0.65, fontSize: 12.5 });
}

// ---------------------------------------------------------------- 12. 파형
{
  const s = pres.addSlide();
  header(s, '4. 검증', 'a + b ≥ 256 이 되는 순간 carry = 1, sum = a + b − 256', 'a가 1 커질 때마다 carry가 처음 생기는 b가 255 → 254 → 253으로 하나씩 당겨짐');
  const cw = (CW - 0.3) / 2;
  const ims = [['wave_1_plus_255.png', 1476, 352, 'a = 1 : b = 255에서 sum 0, carry 1'], ['wave_2_plus_254.png', 1480, 220, 'a = 2 : b = 254부터 carry'],
    ['wave_3_plus_253.png', 1477, 232, 'a = 3 : b = 253부터 carry'], ['crop_wave_255.png', 1780, 290, 'a = 255 : 255 + 0 = 255, 255 + 1부터 carry가 전 비트 전파 (정상 작동)']];
  ims.forEach((m, i) => {
    const x = M + (i % 2) * (cw + 0.3), y = 1.95 + Math.floor(i / 2) * 2.0;
    const f = fit(m[1], m[2], cw, 1.45);
    img(s, m[0], x, y, f.w, f.h);
    T(s, m[3], { x, y: y + f.h + 0.06, w: cw, h: 0.3, fontSize: 11, color: C.sub });
  });
}

// ---------------------------------------------------------------- 13. 보드 동작
{
  const s = pres.addSlide();
  header(s, '4. 검증', "보드에서도 sum은 LED, carry는 'C'로 정상 출력", '시뮬레이션과 같은 입력을 스위치로 넣어 실제 하드웨어에서 확인');
  const f = fit(1465, 500, CW, 4.2);
  img(s, 'crop_board_demo.png', (W - f.w) / 2, 1.85, f.w, f.h);
  const hw = (CW - 0.3) / 2, y = 1.85 + f.h + 0.2;
  card(s, M, y, hw, 0.55, C.ac2);
  T(s, 'a[0], b[1] ON → 1 + 2 = 3 → LD0, LD1 점등', { x: M + 0.25, y, w: hw - 0.5, h: 0.55, fontSize: 13, valign: 'middle' });
  card(s, M + hw + 0.3, y, hw, 0.55, C.ac2);
  T(s, "a[7], b[7] ON → 128 + 128 = 256 → sum 0, 7-Seg 'C'", { x: M + hw + 0.55, y, w: hw - 0.5, h: 0.55, fontSize: 13, valign: 'middle' });
}

// ---------------------------------------------------------------- 14. 검증 방향
{
  const s = pres.addSlide();
  header(s, '4. 검증', '기능은 확인 완료, 다음은 지연까지 고려한 검증', '지금 시뮬레이션은 지연이 0이라 조합 회로의 약점은 드러나지 않음. 앞으로 볼 방향');
  const items = [['입력 도착 시간 차', 'a, b가 동시에 안 바뀌면 그 사이 엉뚱한 중간값이 출력됨. 입력을 시간차를 두고 넣어 확인'],
    ['글리치', 'carry가 한 단씩 넘어가는 동안 출력이 잠깐 튐. 실제 지연이 들어간 타이밍 시뮬레이션으로 확인'],
    ['클럭 도입', '출력을 클럭으로 받으면 중간값·글리치가 밖으로 안 나감. 대신 결과가 1클럭 늦어짐'],
    ['더 빠른 구조', 'ripple carry는 비트가 늘수록 느려짐. Carry Look-ahead나 FPGA 전용 덧셈 회로(a + b)와 비교']];
  const cw = (CW - 0.3) / 2;
  items.forEach((it, i) => {
    const x = M + (i % 2) * (cw + 0.3), y = 1.95 + Math.floor(i / 2) * 1.75;
    card(s, x, y, cw, 1.5);
    numCircle(s, i + 1, x + 0.25, y + 0.2);
    T(s, it[0], { x: x + 0.75, y: y + 0.2, w: cw - 1, h: 0.34, fontSize: 15, bold: true, valign: 'middle' });
    T(s, it[1], { x: x + 0.25, y: y + 0.7, w: cw - 0.5, h: 0.7, fontSize: 12.5 });
  });
}

// ---------------------------------------------------------------- 15. AI 교차 검증
{
  const s = pres.addSlide();
  header(s, '4. 검증', 'AI 교차 검증 결과 오류 0, 다만 TB 자체는 보완 필요', '같은 RTL을 AI(Claude)가 만든 별도 TB로 Verilator 5.051에서 실행');
  table(s, [['검사', '범위', '결과'], ['{c_out, sum} == a + b + cin', '131,072개', { text: 'PASS  오류 0', options: { color: C.ok, bold: true } }],
    ['7-Seg (seg, an)', '131,072개', { text: "PASS  carry일 때만 'C'", options: { color: C.ok, bold: true } }]],
    { x: M, y: 1.95, w: CW, colW: [5.2, 2.6, CW - 7.8], rowH: 0.46, fontSize: 13 });
  const hw = (CW - 0.3) / 2;
  card(s, M, 3.6, hw, 2.0);
  T(s, '잘한 점', { x: M + 0.25, y: 3.75, w: hw - 0.5, h: 0.35, fontSize: 15, bold: true, color: C.ok });
  T(s, bullets(['8-bit 입력 전부 검사', '4-bit · 8-bit TB 모두 자동 비교, carry 개수까지 검사', 'carry 경계값을 파형으로 직접 해석']), { x: M + 0.25, y: 4.2, w: hw - 0.5, h: 1.3, paraSpaceAfter: 4 });
  card(s, M + hw + 0.3, 3.6, hw, 2.0);
  T(s, '보완할 점', { x: M + hw + 0.55, y: 3.75, w: hw - 0.5, h: 0.35, fontSize: 15, bold: true, color: C.warn });
  T(s, bullets(["cin = 1 미검증 (1'b0 고정)", '지연 없는 시뮬레이션만 수행']), { x: M + hw + 0.55, y: 4.2, w: hw - 0.5, h: 1.3, paraSpaceAfter: 4 });
}

// ---------------------------------------------------------------- 16. 구현 결과
{
  const s = pres.addSlide();
  header(s, '5. 구현 결과', '게이트 40개가 LUT 8개로 압축, FF는 0개', '합성기가 모듈 경계를 풀고(flatten) 같은 논리를 5입력 LUT에 묶음');
  const stats = [['8', 'LUT / 20,800 (0.04 %)'], ['0', 'Flip-Flop → 순수 조합 회로'], ['36', 'I/O / 106 (33.96 %)']];
  const cw = (CW - 2 * 0.3) / 3;
  stats.forEach((st, i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 1.95, cw, 1.6);
    T(s, st[0], { x: x + 0.3, y: 2.1, w: cw - 0.6, h: 0.8, fontSize: 40, bold: true, color: C.ac, valign: 'middle' });
    T(s, st[1], { x: x + 0.3, y: 2.95, w: cw - 0.6, h: 0.4, fontSize: 12, color: C.sub });
  });
  const hw = (CW - 0.3) / 2;
  card(s, M, 3.85, hw, 1.3, C.ac2);
  T(s, [{ text: 'Timing : NA', options: { bold: true, breakLine: true } }, { text: '클럭 제약이 없어 분석 불가. 최대 속도를 알려면 create_clock 필요' }], { x: M + 0.25, y: 4.0, w: hw - 0.5, h: 1.05, fontSize: 13 });
  card(s, M + hw + 0.3, 3.85, hw, 1.3, C.ac2);
  T(s, [{ text: 'Power : 20.2 W ?', options: { bold: true, breakLine: true } }, { text: '"클럭이 없어 추정 부정확" 경고(Power 33-232)와 함께 나온 값. 스위치 입력이라 의미 없는 수치' }], { x: M + hw + 0.55, y: 4.0, w: hw - 0.5, h: 1.05, fontSize: 13 });
}

// ---------------------------------------------------------------- 17. 트러블슈팅
{
  const s = pres.addSlide();
  header(s, '6. 고찰', '핀 중복 배정이 가장 큰 문제, carry LED 핀은 아직 미반영', '구현 로그(runme.log)의 Critical Warning에서 원인 확인');
  table(s, [['문제', '원인', '해결'],
    ['Critical Warning\nVivado 12-1411', 'i_cin을 R2에 배정했는데 R2는 이미 i_b[7](SW15)가 사용 중', 'i_cin → BTNL(W19)로 이동\nXDC에 남은 R2 줄 삭제 필요'],
    ['carry LED 안 켜짐', '소스엔 o_c_out 포트가 있지만 XDC에 핀 줄이 없음 → 보드 버전은 7-Seg로만 표시', 'XDC에 W18 → o_c_out 추가 후 재구현'],
    ['Timing 분석 불가', '클럭 · 입출력 지연 제약 없음 (Timing 38-313)', '동작엔 문제 없음, 속도를 볼 때 클럭 제약 추가']],
    { x: M, y: 1.95, w: CW, colW: [2.8, 5.0, CW - 7.8], rowH: 0.7, fontSize: 13, valign: 'top' });
}

// ---------------------------------------------------------------- 18. 결론
{
  const s = pres.addSlide();
  header(s, '6. 결론', '계층 설계로 기능은 확보, 다음은 "얼마나 빠르고 안정적인가"');
  const hw = (CW - 0.3) / 2;
  card(s, M, 1.95, hw, 2.7);
  T(s, '평가', { x: M + 0.3, y: 2.15, w: hw - 0.6, h: 0.35, fontSize: 16, bold: true });
  T(s, bullets(['기능 : 전수 검사 + 교차 검증 모두 오류 0', '구현 : LUT 8개, 보드에서 sum · carry 동작 확인', '설계 : 모듈 재사용으로 16 · 32-bit 확장도 같은 방식'], 14), { x: M + 0.3, y: 2.65, w: hw - 0.6, h: 1.8, paraSpaceAfter: 8 });
  card(s, M + hw + 0.3, 1.95, hw, 2.7);
  T(s, '아쉬운 점 → 다음에', { x: M + hw + 0.6, y: 2.15, w: hw - 0.6, h: 0.35, fontSize: 16, bold: true });
  T(s, bullets(['cin을 반복문에 포함', '타이밍 시뮬레이션 · 클럭 도입으로 지연 검증', '인스턴스 이름 U_HA1~4 → U_FA0~3 (Half Adder와 혼동)'], 14), { x: M + hw + 0.6, y: 2.65, w: hw - 0.6, h: 1.8, paraSpaceAfter: 8 });
}

// ---------------------------------------------------------------- 19~20. 부록
{
  const s = pres.addSlide();
  header(s, 'APPENDIX', '소스 코드 ① Half_Adder · Full_Adder');
  const hw = (CW - 0.3) / 2;
  codeBox(s, M, 1.5, hw, 5.3,
`// Half_Adder.v
module Half_Adder(

    input  i_a,
    input  i_b,

    output o_s,
    output o_c
);

assign o_s = i_a ^ i_b;
assign o_c = i_a & i_b;

endmodule`, 11.5);
  codeBox(s, M + hw + 0.3, 1.5, hw, 5.3,
`// Full_Adder.v
module Full_Adder(
    input  i_b,
    input  i_a,
    input  i_cin,
    output o_s,
    output o_c
);
wire w_s1;  // 1st Half_Adder sum
wire w_c1;  // 1st Half_Adder carry
wire w_c2;  // 2nd Half_Adder carry

// stage 1 : i_a + i_b
Half_Adder U_HA1 (.i_a(i_a),  .i_b(i_b),
                  .o_s(w_s1), .o_c(w_c1));
// stage 2 : (i_a + i_b) + i_cin
Half_Adder U_HA2 (.i_a(w_s1), .i_b(i_cin),
                  .o_s(o_s),  .o_c(w_c2));

assign o_c = w_c1 | w_c2;
endmodule`, 11);
}
{
  const s = pres.addSlide();
  header(s, 'APPENDIX', '소스 코드 ② Full_Adder_4bit · Full_Adder_8bit');
  const hw = (CW - 0.3) / 2;
  codeBox(s, M, 1.5, hw, 5.3,
`// Full_Adder_4bit.v
module Full_Adder_4bit(
    input  [3:0] i_a,
    input  [3:0] i_b,
    input        i_cin,
    output       o_c_out,
    output [3:0] o_s
);
wire w_c1, w_c2, w_c3, w_c4;

Full_Adder U_HA1(.i_a(i_a[0]), .i_b(i_b[0]),
  .i_cin(i_cin), .o_s(o_s[0]), .o_c(w_c1));
Full_Adder U_HA2(.i_a(i_a[1]), .i_b(i_b[1]),
  .i_cin(w_c1),  .o_s(o_s[1]), .o_c(w_c2));
Full_Adder U_HA3(.i_a(i_a[2]), .i_b(i_b[2]),
  .i_cin(w_c2),  .o_s(o_s[2]), .o_c(w_c3));
Full_Adder U_HA4(.i_a(i_a[3]), .i_b(i_b[3]),
  .i_cin(w_c3),  .o_s(o_s[3]), .o_c(w_c4));

assign o_c_out = w_c4;
endmodule`, 10);
  codeBox(s, M + hw + 0.3, 1.5, hw, 5.3,
`// Full_Adder_8bit.v (Top, board version)
module Full_Adder_8bit(
    input  [7:0] i_a,
    input  [7:0] i_b,
    input        i_cin,
    output       o_c_out,
    output [7:0] o_s,
    output [6:0] seg,
    output [3:0] an
);
reg  [6:0] r_txt = 7'b1000_110;  // 'C'
wire w_fc, w_c;

assign an      = 4'b1110;
assign seg     = w_fc ? r_txt : 7'b1111_111;
assign o_c_out = w_fc;

Full_Adder_4bit DUT_1(.i_a(i_a[3:0]), .i_b(i_b[3:0]),
  .i_cin(i_cin), .o_c_out(w_c),  .o_s(o_s[3:0]));
Full_Adder_4bit DUT_2(.i_a(i_a[7:4]), .i_b(i_b[7:4]),
  .i_cin(w_c),   .o_c_out(w_fc), .o_s(o_s[7:4]));
endmodule`, 10);
}

pres.writeFile({ fileName: OUT }).then(f => console.log('written', f));
