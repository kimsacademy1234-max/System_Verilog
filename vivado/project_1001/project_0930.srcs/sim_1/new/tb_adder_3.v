`timescale 1ns / 1ps


// 시나리오 2 : 글리치(Glitch)
// a, b 를 "동시에" 바꿨을 때 출력이 최종값으로 한 번에 가지 않고
// 0/1 을 여러 번 오가는지(글리치) 측정한다.
//
// ※ Behavioral Simulation 은 게이트 지연이 0 이라 글리치가 안 보인다.
//    Run Simulation -> Run Post-Implementation Timing Simulation 으로 돌려야 함.
//
//   - 중간값 : 출력이 최종값으로 가기 전에 거친 틀린 값들 (출력 변화가 2번 이상이면 발생)
//   - 글리치 비트 : 바뀌어야 하는 비트는 1번, 안 바뀌어야 하는 비트는 0번 토글이 정상.
//                   그보다 많이 토글한 비트 (0->1->0 처럼 튀는 것)
//   - settle : 입력 변경 후 출력이 마지막으로 바뀐 시점까지 시간 (= 실제 전파 지연)

module tb_adder_3();

parameter HOLD = 50;             // 입력 하나당 대기 시간(ns), 전파 지연보다 충분히 길게

reg  [7:0] a, b;
wire [7:0] sum;
wire       c_out;

wire [8:0] result = {c_out, sum};
reg  [8:0] target;               // 이번 입력의 정답

Full_Adder_8bit DUT(

		.i_a(a),
		.i_b(b),
		.i_cin(1'b0),

		.o_c_out(c_out),
		.o_s(sum)
);


// 측정용
reg        tracking;
reg  [8:0] start_res, prev_res;
reg  [3:0] tog [0:8];            // 비트별 토글 횟수
integer    ev;                   // 출력 변화 횟수
reg  [8:0] seq [0:15];           // 출력이 거친 값 (앞에서 16개까지)
realtime   t0, t_last;
integer    i;

always @(result) begin
	if (tracking) begin
		if (ev < 16) seq[ev] = result;
		ev     = ev + 1;
		t_last = $realtime;
		for (i = 0; i < 9; i = i + 1)
			if (result[i] !== prev_res[i]) tog[i] = tog[i] + 1;
		prev_res = result;
	end
end


// 전체 통계
integer    n_vec, n_mid, n_glitch, n_err;
realtime   max_settle;
reg  [7:0] max_a0, max_b0, max_a1, max_b1;
reg  [8:0] glitch_bits;
reg  [7:0] a0, b0;
realtime   settle;
integer    seed, j;


// 현재 상태에서 a1+b1 으로 a, b 를 동시에 변경
task apply(input [7:0] a1, input [7:0] b1, input show);
	integer k, need;
begin
	a0 = a;  b0 = b;
	start_res = result;
	prev_res  = result;
	for (k = 0; k < 9; k = k + 1) tog[k] = 0;
	ev       = 0;
	target   = a1 + b1;
	t0       = $realtime;
	t_last   = t0;
	tracking = 1;

	a = a1;  b = b1;             // 동시에 변경
	#(HOLD);
	tracking = 0;

	// 글리치 비트 찾기
	glitch_bits = 0;
	for (k = 0; k < 9; k = k + 1) begin
		need = (start_res[k] !== target[k]) ? 1 : 0;
		if (tog[k] > need) glitch_bits[k] = 1'b1;
	end
	settle = (ev > 0) ? (t_last - t0) : 0;

	n_vec = n_vec + 1;
	if (ev > 1)             n_mid    = n_mid + 1;
	if (glitch_bits != 0)   n_glitch = n_glitch + 1;
	if (result !== target)  n_err    = n_err + 1;
	if (settle > max_settle) begin
		max_settle = settle;
		max_a0 = a0;  max_b0 = b0;  max_a1 = a1;  max_b1 = b1;
	end

	if (show || glitch_bits != 0) begin
		$display("%3d+%3d -> %3d+%3d | 정답 %3d | 출력 변화 %2d회 | 안정까지 %6.3f ns | 글리치 비트 c,s[7:0] = %b %s",
		         a0, b0, a1, b1, target, ev, settle, glitch_bits,
		         (result === target) ? "" : "<- 최종값 오류");
		if (show && ev > 1) begin
			$write("        거친 값 : %0d", start_res);
			for (k = 0; k < ev && k < 16; k = k + 1) $write(" -> %0d", seq[k]);
			$write("\n");
		end
	end
end
endtask


initial begin
	n_vec = 0;  n_mid = 0;  n_glitch = 0;  n_err = 0;  max_settle = 0;  seed = 1;
	tracking = 0;
	a = 0;  b = 0;
	#100;                        // 타이밍 시뮬레이션 초기화(GSR) 대기

	$display("==== 1) 지정 입력 : carry 가 길게 전파되는 경우 ====");
	apply(8'd255, 8'd0,   1);    // 기준 상태
	apply(8'd255, 8'd1,   1);    // carry 가 bit0 -> bit7 까지 전부 전파 (256)
	apply(8'd255, 8'd0,   1);    // 반대로 carry 가 전부 사라짐
	apply(8'd127, 8'd0,   1);
	apply(8'd127, 8'd1,   1);    // bit0 -> bit7 까지 전파, carry 없음 (128)
	apply(8'd15,  8'd0,   1);
	apply(8'd15,  8'd1,   1);    // DUT_1 -> DUT_2 경계를 넘는 carry
	apply(8'd1,   8'd255, 1);
	apply(8'd2,   8'd254, 1);    // 결과 256 그대로, 중간 비트만 출렁일 수 있음
	apply(8'd0,   8'd0,   1);
	apply(8'd255, 8'd255, 1);    // 0 -> 510

	$display("==== 2) 무작위 입력 500개 (글리치 난 것만 출력) ====");
	for (j = 0; j < 500; j = j + 1)
		apply($random(seed), $random(seed), 0);

	$display("=========================================================================");
	$display("총 %0d회 입력 변경 | 중간값 거침 %0d회 | 비트 글리치 %0d회 | 최종값 오류 %0d회", n_vec, n_mid, n_glitch, n_err);
	$display("최대 전파 지연 %0.3f ns  (%0d+%0d -> %0d+%0d)", max_settle, max_a0, max_b0, max_a1, max_b1);

	$finish;
end

endmodule
