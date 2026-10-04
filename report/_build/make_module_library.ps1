$ErrorActionPreference = 'Stop'
$OUT = $args[0]

function RGBc($hex) { $r=[Convert]::ToInt32($hex.Substring(0,2),16); $g=[Convert]::ToInt32($hex.Substring(2,2),16); $b=[Convert]::ToInt32($hex.Substring(4,2),16); return $r + 256*$g + 65536*$b }
$FONT = 'Malgun Gothic'
$PAL = @{
  adder   = @('EEF2FF','3730A3');
  disp    = @('ECFEFF','0E7490');
  top     = @('F5F3FF','6D28D9');
  gate    = @('F3F4F6','374151');
  bus     = @('FEFCE8','A16207');
  board   = @('FFF7ED','C2410C');
  missing = @('FEF2F2','B91C1C');
}

function Txt($slide, $text, $x, $y, $w, $h, $size, $bold, $color, $align) {
  $t = $slide.Shapes.AddTextbox(1, [single]$x, [single]$y, [single]$w, [single]$h)
  $tf = $t.TextFrame
  $tf.MarginLeft = 0; $tf.MarginRight = 0; $tf.MarginTop = 0; $tf.MarginBottom = 0
  $tf.WordWrap = -1; $tf.AutoSize = 0
  $tf.TextRange.Text = $text
  $tf.TextRange.Font.Name = $FONT; $tf.TextRange.Font.Size = [single]$size
  $tf.TextRange.Font.Bold = $(if ($bold) { -1 } else { 0 }); $tf.TextRange.Font.Color.RGB = (RGBc $color)
  $tf.TextRange.ParagraphFormat.Alignment = [int]$align   # 1 left, 2 center, 3 right
  return $t
}

# module block: inputs on left, outputs on right. returns group
function Module($slide, $id, $title, $sub, $x, $y, $w, $ins, $outs, $kind) {
  $c = $PAL[$kind]
  $n = [Math]::Max($ins.Count, $outs.Count)
  $h = 34 + $n * 20 + 6
  $names = New-Object System.Collections.ArrayList
  $b = $slide.Shapes.AddShape(5, [single]($x), [single]($y), [single]($w), [single]($h))
  $b.Adjustments.Item(1) = 0.06
  $b.Name = "${id}_body"
  $b.Fill.ForeColor.RGB = (RGBc $c[0]); $b.Line.ForeColor.RGB = (RGBc $c[1]); $b.Line.Weight = 1.5
  $tr = $b.TextFrame.TextRange
  $tr.Text = $title + "`r" + $sub
  $tr.Font.Name = $FONT; $tr.Font.Size = 10; $tr.Font.Bold = 1; $tr.Font.Color.RGB = (RGBc $c[1])
  $tr.Paragraphs(2).Font.Size = 8; $tr.Paragraphs(2).Font.Bold = 0; $tr.Paragraphs(2).Font.Color.RGB = (RGBc '6B7280')
  $tr.ParagraphFormat.Alignment = 2
  $b.TextFrame.VerticalAnchor = 1; $b.TextFrame.MarginTop = 3; $b.TextFrame.MarginLeft = 2; $b.TextFrame.MarginRight = 2
  [void]$names.Add($b.Name)
  for ($i = 0; $i -lt $ins.Count; $i++) {
    $p = $ins[$i]; $bus = $p.Contains('['); $cy = $y + 34 + $i * 20 + 8
    $s = if ($bus) { 10 } else { 8 }
    $pin = $slide.Shapes.AddShape(1, [single]($x - $s), [single]($cy - $s/2), [single]($s), [single]($s))
    $pin.Name = "${id}_pin_$p"; $pin.Line.Visible = 0
    $pin.Fill.ForeColor.RGB = (RGBc $(if ($bus) { '1D4ED8' } else { '60A5FA' }))
    [void]$names.Add($pin.Name)
    $l = Txt $slide $p ($x + 4) ($cy - 7) ($w/2 + 10) 14 8 $bus '1F2937' 1
    $l.Name = "${id}_lbl_$p"; [void]$names.Add($l.Name)
  }
  for ($i = 0; $i -lt $outs.Count; $i++) {
    $p = $outs[$i]; $bus = $p.Contains('['); $cy = $y + 34 + $i * 20 + 8
    $s = if ($bus) { 10 } else { 8 }
    $pin = $slide.Shapes.AddShape(1, [single]($x + $w), [single]($cy - $s/2), [single]($s), [single]($s))
    $pin.Name = "${id}_pin_$p"; $pin.Line.Visible = 0
    $pin.Fill.ForeColor.RGB = (RGBc $(if ($bus) { '15803D' } else { '4ADE80' }))
    [void]$names.Add($pin.Name)
    $l = Txt $slide $p ($x + $w/2 - 14) ($cy - 7) ($w/2 + 10) 14 8 $bus '1F2937' 3
    $l.Name = "${id}_lbl_$p"; [void]$names.Add($l.Name)
  }
  $g = $slide.Shapes.Range([object[]]$names.ToArray()).Group()
  $g.Name = $id
  return $g
}

# top-level port (pentagon). dir 'in' -> pin on right, 'out' -> pin on left
function Port($slide, $id, $label, $x, $y, $dir) {
  $bus = $label.Contains('['); $w = 112; $h = 20
  $names = New-Object System.Collections.ArrayList
  $b = $slide.Shapes.AddShape(51, [single]($x), [single]($y), [single]($w), [single]($h))
  $b.Name = "${id}_body"
  $fill = if ($dir -eq 'in') { 'DBEAFE' } else { 'DCFCE7' }
  $line = if ($dir -eq 'in') { '2563EB' } else { '16A34A' }
  $b.Fill.ForeColor.RGB = (RGBc $fill); $b.Line.ForeColor.RGB = (RGBc $line); $b.Line.Weight = 1.25
  $tr = $b.TextFrame.TextRange; $tr.Text = $label
  $tr.Font.Name = $FONT; $tr.Font.Size = 9; $tr.Font.Bold = 1; $tr.Font.Color.RGB = (RGBc '1F2937')
  $b.TextFrame.MarginLeft = 4; $b.TextFrame.MarginRight = 6; $tr.ParagraphFormat.Alignment = 1
  [void]$names.Add($b.Name)
  $s = if ($bus) { 10 } else { 8 }
  if ($dir -eq 'in') { $px = $x + $w; $col = $(if ($bus) { '15803D' } else { '4ADE80' }) } else { $px = $x - $s; $col = $(if ($bus) { '1D4ED8' } else { '60A5FA' }) }
  $pin = $slide.Shapes.AddShape(1, [single]($px), [single]($y + $h/2 - $s/2), [single]($s), [single]($s))
  $pin.Name = "${id}_pin"; $pin.Line.Visible = 0; $pin.Fill.ForeColor.RGB = (RGBc $col)
  [void]$names.Add($pin.Name)
  $g = $slide.Shapes.Range([object[]]$names.ToArray()).Group()
  $g.Name = $id
  return $g
}

function Pin($g, $name) { return $g.GroupItems.Item($name) }

# wire: from output pin (right side, site 4) to input pin (left side, site 2)
function Wire($slide, $fromShape, $toShape, $bus) {
  $c = $slide.Shapes.AddConnector(2, 0, 0, 10, 10)
  $c.ConnectorFormat.BeginConnect($fromShape, 4)
  $c.ConnectorFormat.EndConnect($toShape, 2)
  $c.Line.ForeColor.RGB = (RGBc $(if ($bus) { '1E3A8A' } else { '475569' }))
  $c.Line.Weight = $(if ($bus) { 2.5 } else { 1.25 })
  $c.Line.EndArrowheadStyle = 2
  return $c
}

function Title($slide, $sec, $title, $lead) {
  [void](Txt $slide $sec 30 16 600 16 10 $true '3730A3' 1)
  [void](Txt $slide $title 30 32 900 28 20 $true '1F2937' 1)
  if ($lead) { [void](Txt $slide $lead 30 62 900 16 10 $false '6B7280' 1) }
}

$app = New-Object -ComObject PowerPoint.Application
$pres = $app.Presentations.Add(0)
$pres.PageSetup.SlideWidth = 960; $pres.PageSetup.SlideHeight = 540

# ---------------- 1. 사용법
$s = $pres.Slides.Add(1, 12)
Title $s 'MODULE LIBRARY' '모듈 라이브러리 사용법' 'vfile/lib 모듈을 블록으로 만들어 둠. 복사해서 붙이고 연결선으로 와이어를 이어 Top 모듈 구성'
$steps = @(
 @('1', '모듈 가져오기', '2~4번 슬라이드에서 필요한 블록 클릭 → Ctrl+C → 작업 슬라이드에 Ctrl+V. 블록은 그룹이라 한 번에 움직임. Ctrl+드래그로 복제도 가능'),
 @('2', '와이어 연결', '삽입 → 도형 → 선 → "연결선: 꺾임 화살표" → 출력 핀(초록 □)에서 입력 핀(파랑 □)으로 드래그. 핀에 회색 점이 뜰 때 놓으면 붙음 → 블록을 옮겨도 선이 따라옴'),
 @('3', '이름 바꾸기', '인스턴스 이름(U_?)·포트 이름은 블록 클릭 → 글자를 한 번 더 클릭해서 수정'),
 @('4', '버스 / 1비트', '버스(여러 비트)는 굵은 남색 선 2.5pt, 1비트는 얇은 회색 선 1.25pt. 서식 복사(Ctrl+Shift+C/V)로 같은 모양 적용'),
 @('5', '예시', '5번 슬라이드 = top_adder_fnd_8bit 를 실제로 연결해 둔 예. 블록을 끌어 보면 선이 따라오는 것 확인 가능')
)
for ($i = 0; $i -lt $steps.Count; $i++) {
  $yy = 100 + $i * 62
  $o = $s.Shapes.AddShape(9, [single](34), [single]($yy), [single](26), [single](26)); $o.Line.Visible = 0; $o.Fill.ForeColor.RGB = (RGBc '3730A3')
  $o.TextFrame.TextRange.Text = $steps[$i][0]; $o.TextFrame.TextRange.Font.Size = 11; $o.TextFrame.TextRange.Font.Bold = 1; $o.TextFrame.TextRange.Font.Name = $FONT
  $o.TextFrame.MarginLeft = 0; $o.TextFrame.MarginRight = 0
  [void](Txt $s $steps[$i][1] 72 ($yy + 1) 150 20 12 $true '1F2937' 1)
  [void](Txt $s $steps[$i][2] 200 ($yy + 2) 520 50 10.5 $false '374151' 1)
}
# legend
$lx = 750
[void](Txt $s '범례' $lx 100 180 16 11 $true '1F2937' 1)
$leg = @(@('60A5FA','입력 핀 (1비트)',8), @('1D4ED8','입력 핀 (버스)',10), @('4ADE80','출력 핀 (1비트)',8), @('15803D','출력 핀 (버스)',10))
for ($i = 0; $i -lt $leg.Count; $i++) {
  $yy = 128 + $i * 24; $sz = $leg[$i][2]
  $p = $s.Shapes.AddShape(1, [single]($lx), [single]($yy + (10 - $sz)/2), [single]($sz), [single]($sz)); $p.Line.Visible = 0; $p.Fill.ForeColor.RGB = (RGBc $leg[$i][0])
  [void](Txt $s $leg[$i][1] ($lx + 18) ($yy - 1) 160 14 10 $false '374151' 1)
}
$kinds = @(@('adder','가산기'), @('disp','표시 · 선택'), @('top','Top 모듈'), @('bus','버스 · 상수'), @('board','보드 I/O'), @('missing','lib에 파일 없음'))
for ($i = 0; $i -lt $kinds.Count; $i++) {
  $yy = 240 + $i * 24; $c = $PAL[$kinds[$i][0]]
  $p = $s.Shapes.AddShape(5, [single]($lx), [single]($yy), [single](14), [single](12)); $p.Fill.ForeColor.RGB = (RGBc $c[0]); $p.Line.ForeColor.RGB = (RGBc $c[1])
  [void](Txt $s $kinds[$i][1] ($lx + 22) ($yy - 1) 160 14 10 $false '374151' 1)
}
$demoA = Port $s 'demo_in' 'i_a[7:0]' 72 450 'in'
$demoB = Module $s 'demo_m' 'module' 'U_?' 260 428 90 @('i_a[7:0]') @() 'gate'
[void](Wire $s (Pin $demoA 'demo_in_pin') (Pin $demoB 'demo_m_pin_i_a[7:0]') $true)
[void](Txt $s '← 연결 예 : 블록을 움직여 보면 선이 따라옴' 370 455 300 14 10 $false '6B7280' 1)

# ---------------- 2. 가산기 + Top
$s = $pres.Slides.Add(2, 12)
Title $s 'LIBRARY ① vfile/lib — 가산기' '가산기 모듈' 'half_adder → full_adder → full_adder_4bit → full_adder_8bit 순으로 아래 모듈을 인스턴스로 사용'
[void](Module $s 'lib_ha'  'half_adder'      'U_HA?'  60  100 120 @('i_a','i_b') @('o_sum','o_cout') 'adder')
[void](Module $s 'lib_fa'  'full_adder'      'U_FA?'  270 100 120 @('i_a','i_b','i_cin') @('o_sum','o_cout') 'adder')
[void](Module $s 'lib_fa4' 'full_adder_4bit' 'U_ADD?' 480 100 140 @('i_a[3:0]','i_b[3:0]','i_cin') @('o_sum[3:0]','o_cout') 'adder')
[void](Module $s 'lib_fa8' 'full_adder_8bit' 'U_ADD'  720 100 140 @('i_a[7:0]','i_b[7:0]','i_cin') @('o_sum[7:0]','o_cout') 'adder')
[void](Txt $s 'Top 모듈 (vfile/source_file) — 블랙박스로 쓸 때' 30 290 600 16 11 $true '1F2937' 1)
[void](Module $s 'lib_top4' 'top_adder_fnd_4bit' 'U_TOP' 60  320 170 @('i_a[3:0]','i_b[3:0]') @('o_cout','o_fnd_com[3:0]','o_fnd_data[7:0]') 'top')
[void](Module $s 'lib_top8' 'top_adder_fnd_8bit' 'U_TOP' 340 320 170 @('i_sel[1:0]','i_a[7:0]','i_b[7:0]') @('o_cout','o_fnd_com[3:0]','o_fnd_data[7:0]') 'top')

# ---------------- 3. 표시 · 선택
$s = $pres.Slides.Add(3, 12)
Title $s 'LIBRARY ② vfile/lib — 표시 · 선택' 'FND 표시용 모듈' '빨간 블록(decoder_2x4, fnd_decoder)은 top에서 쓰지만 vfile/lib에 파일이 없음 → 포트는 top의 연결 기준'
[void](Module $s 'lib_split' 'digit_splitter' 'U_SPLIT  #(WIDTH=9)' 60  100 150 @('i_data[8:0]') @('o_digit_1[3:0]','o_digit_10[3:0]','o_digit_100[3:0]','o_digit_1000[3:0]') 'disp')
[void](Module $s 'lib_mux'   'mux_4x1'        'U_MUX  #(WIDTH=4)'    300 100 150 @('i_d0[3:0]','i_d1[3:0]','i_d2[3:0]','i_d3[3:0]','i_sel[1:0]') @('o_data[3:0]') 'disp')
[void](Module $s 'lib_dec'   'decoder_2x4'    'U_DEC'                540 100 140 @('i_sel[1:0]') @('o_dec_n[3:0]') 'missing')
[void](Module $s 'lib_fnd'   'fnd_decoder'    'U_FND_DEC'            760 100 140 @('i_hex[3:0]') @('o_fnd_data[7:0]') 'missing')
[void](Txt $s ("digit_splitter : 입력을 1·10·100·1000의 자리 숫자(0~9)로 나눔`r" + "mux_4x1 : i_sel 값에 따라 4개 입력 중 하나 선택`r" + "decoder_2x4 : i_sel → 켤 자리 선택 (Active-Low, 예 00 → 1110)`r" + "fnd_decoder : 4비트 숫자 → 7-Segment 표시 패턴 (8비트, 점 포함)") 60 300 840 90 11 $false '374151' 1)

# ---------------- 4. 게이트 · 버스 · 포트 · 보드
$s = $pres.Slides.Add(4, 12)
Title $s 'LIBRARY ③ 기본 요소' '게이트 · 버스 · 상수 · 포트 · 보드 I/O' '포트 이름과 비트 폭은 글자를 클릭해서 바꿔 쓰면 됨'
[void](Module $s 'g_xor' 'XOR' '^' 40  95 70 @('a','b') @('y') 'gate')
[void](Module $s 'g_and' 'AND' '&' 150 95 70 @('a','b') @('y') 'gate')
[void](Module $s 'g_or'  'OR'  '|' 260 95 70 @('a','b') @('y') 'gate')
[void](Module $s 'g_not' 'NOT' '~' 370 95 70 @('a') @('y') 'gate')
[void](Module $s 'b_split' 'bus split' '[7:0] → [3:0], [7:4]' 500 95 120 @('in[7:0]') @('[3:0]','[7:4]') 'bus')
[void](Module $s 'b_merge' 'bus merge' '[3:0], [7:4] → [7:0]' 680 95 120 @('[3:0]','[7:4]') @('out[7:0]') 'bus')
[void](Module $s 'b_cat'   'concat { }' '{hi, lo}' 500 210 120 @('hi','lo[7:0]') @('out[8:0]') 'bus')
[void](Module $s 'b_bit'   'bit select' 'in[n]' 680 210 120 @('in[7:0]') @('in[n]') 'bus')
[void](Module $s 'c_0' "1'b0" 'const' 40 210 70 @() @('0') 'bus')
[void](Module $s 'c_1' "1'b1" 'const' 150 210 70 @() @('1') 'bus')
[void](Port $s 'p_in1'  'i_cin'      40  320 'in')
[void](Port $s 'p_inb'  'i_a[7:0]'   40  350 'in')
[void](Port $s 'p_out1' 'o_cout'     230 320 'out')
[void](Port $s 'p_outb' 'o_sum[7:0]' 230 350 'out')
[void](Txt $s '입력 포트 (Top의 input)' 40 380 160 14 9 $false '6B7280' 1)
[void](Txt $s '출력 포트 (Top의 output)' 230 380 160 14 9 $false '6B7280' 1)
[void](Txt $s 'Basys3 보드' 420 300 300 16 11 $true '1F2937' 1)
[void](Module $s 'bd_swl' 'SW0 ~ SW7'  'V17 … W13' 420 325 110 @() @('sw[7:0]') 'board')
[void](Module $s 'bd_swh' 'SW8 ~ SW15' 'V2 … R2'   420 400 110 @() @('sw[15:8]') 'board')
[void](Module $s 'bd_btn' 'BTN'        'U18 C / W19 L / T17 R' 420 470 110 @() @('btn') 'board')
[void](Module $s 'bd_led' 'LED'        'LD0 … LD15' 640 325 110 @('led[15:0]') @() 'board')
[void](Module $s 'bd_fnd' '7-Segment (FND)' 'com : U2 U4 V4 W4' 640 400 130 @('com[3:0]','data[7:0]') @() 'board')

# ---------------- 5. 예시 : top_adder_fnd_8bit
$s = $pres.Slides.Add(5, 12)
Title $s 'EXAMPLE' 'top_adder_fnd_8bit 연결 예' '블록을 끌어 보면 선이 따라옴. 같은 방법으로 새 Top 구성'
$frame = $s.Shapes.AddShape(5, [single](120), [single](82), [single](700), [single](440)); $frame.Adjustments.Item(1) = 0.02
$frame.Fill.Visible = 0; $frame.Line.ForeColor.RGB = (RGBc '9CA3AF'); $frame.Line.DashStyle = 4; $frame.Line.Weight = 1
$frame.Name = 'top_frame'
[void](Txt $s 'top_adder_fnd_8bit' 130 86 300 14 10 $true '6B7280' 1)
$inA   = Port $s 'in_a'   'i_a[7:0]'   8 140 'in'
$inB   = Port $s 'in_b'   'i_b[7:0]'   8 180 'in'
$inSel = Port $s 'in_sel' 'i_sel[1:0]' 8 420 'in'
$k0    = Module $s 'k0' "1'b0" 'const' 150 205 50 @() @('0') 'bus'
$add   = Module $s 'U_ADD' 'full_adder_8bit' 'U_ADD' 230 120 130 @('i_a[7:0]','i_b[7:0]','i_cin') @('o_sum[7:0]','o_cout') 'adder'
$cat   = Module $s 'CAT' 'concat { }' '{hi, lo}' 405 120 85 @('lo[7:0]','hi') @('out[8:0]') 'bus'
$spl   = Module $s 'U_SPLIT' 'digit_splitter' 'U_SPLIT #(9)' 520 195 130 @('i_data[8:0]') @('o_digit_1[3:0]','o_digit_10[3:0]','o_digit_100[3:0]','o_digit_1000[3:0]') 'disp'
$mux   = Module $s 'U_MUX' 'mux_4x1' 'U_MUX #(4)' 680 195 125 @('i_d0[3:0]','i_d1[3:0]','i_d2[3:0]','i_d3[3:0]','i_sel[1:0]') @('o_data[3:0]') 'disp'
$dec   = Module $s 'U_DEC' 'decoder_2x4' 'U_DEC' 400 420 120 @('i_sel[1:0]') @('o_dec_n[3:0]') 'missing'
$fnd   = Module $s 'U_FND' 'fnd_decoder' 'U_FND_DEC' 560 430 120 @('i_hex[3:0]') @('o_fnd_data[7:0]') 'missing'
$oData = Port $s 'out_data' 'o_fnd_data[7:0]' 840 450 'out'
$oCom  = Port $s 'out_com'  'o_fnd_com[3:0]'  840 400 'out'
$oCout = Port $s 'out_cout' 'o_cout'          840 92 'out'
[void](Wire $s (Pin $inA 'in_a_pin') (Pin $add 'U_ADD_pin_i_a[7:0]') $true)
[void](Wire $s (Pin $inB 'in_b_pin') (Pin $add 'U_ADD_pin_i_b[7:0]') $true)
[void](Wire $s (Pin $k0 'k0_pin_0') (Pin $add 'U_ADD_pin_i_cin') $false)
[void](Wire $s (Pin $add 'U_ADD_pin_o_cout') (Pin $cat 'CAT_pin_hi') $false)
[void](Wire $s (Pin $add 'U_ADD_pin_o_sum[7:0]') (Pin $cat 'CAT_pin_lo[7:0]') $true)
[void](Wire $s (Pin $add 'U_ADD_pin_o_cout') (Pin $oCout 'out_cout_pin') $false)
[void](Wire $s (Pin $cat 'CAT_pin_out[8:0]') (Pin $spl 'U_SPLIT_pin_i_data[8:0]') $true)
[void](Wire $s (Pin $spl 'U_SPLIT_pin_o_digit_1[3:0]')    (Pin $mux 'U_MUX_pin_i_d0[3:0]') $true)
[void](Wire $s (Pin $spl 'U_SPLIT_pin_o_digit_10[3:0]')   (Pin $mux 'U_MUX_pin_i_d1[3:0]') $true)
[void](Wire $s (Pin $spl 'U_SPLIT_pin_o_digit_100[3:0]')  (Pin $mux 'U_MUX_pin_i_d2[3:0]') $true)
[void](Wire $s (Pin $spl 'U_SPLIT_pin_o_digit_1000[3:0]') (Pin $mux 'U_MUX_pin_i_d3[3:0]') $true)
[void](Wire $s (Pin $inSel 'in_sel_pin') (Pin $mux 'U_MUX_pin_i_sel[1:0]') $true)
[void](Wire $s (Pin $inSel 'in_sel_pin') (Pin $dec 'U_DEC_pin_i_sel[1:0]') $true)
[void](Wire $s (Pin $mux 'U_MUX_pin_o_data[3:0]') (Pin $fnd 'U_FND_pin_i_hex[3:0]') $true)
[void](Wire $s (Pin $fnd 'U_FND_pin_o_fnd_data[7:0]') (Pin $oData 'out_data_pin') $true)
[void](Wire $s (Pin $dec 'U_DEC_pin_o_dec_n[3:0]') (Pin $oCom 'out_com_pin') $true)

# ---------------- 6. 빈 작업판
$s = $pres.Slides.Add(6, 12)
Title $s 'WORKSPACE' 'Top 모듈 작업판' '이 슬라이드를 복제(Ctrl+D)해서 새 Top을 구성'
$frame = $s.Shapes.AddShape(5, [single](120), [single](90), [single](720), [single](430)); $frame.Adjustments.Item(1) = 0.02
$frame.Fill.Visible = 0; $frame.Line.ForeColor.RGB = (RGBc '9CA3AF'); $frame.Line.DashStyle = 4
[void](Txt $s 'top_module_name' 130 94 300 14 10 $true '6B7280' 1)

$pres.SaveAs($OUT, 24)
"saved " + $pres.Slides.Count + " slides"
$pres.Close()
