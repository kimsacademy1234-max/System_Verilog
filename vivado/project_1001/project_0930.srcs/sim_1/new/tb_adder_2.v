`timescale 1ns / 1ps


// 시나리오 1 : 입력 도착 시간차
// a 와 b 를 동시에 바꾸지 않고 skew(ns) 만큼 차이를 두고 바꿨을 때
// 그 사이 출력에 "의도하지 않은 중간값"이 얼마나 나오는지 측정한다.
//   - target : 두 입력이 모두 바뀐 뒤 나와야 할 최종값 {carry, sum}
//   - glitch : 출력이 target 과 다른 구간 (파형에서 1 로 보임)

module tb_adder_2();

reg  [7:0] a, b;
wire [7:0] sum;
wire       c_out;

wire [8:0] result = {c_out, sum};
reg  [8:0] target;               // 의도한 최종값
wire       glitch = (result !== target);

Full_Adder_8bit DUT(

		.i_a(a),
		.i_b(b),
		.i_cin(1'b0),

		.o_c_out(c_out),
		.o_s(sum)
);


// 측정용
reg        tracking;
integer    ev;                   // 출력 변화 횟수
integer    mid_seen;             // 중간값이 나왔는가
reg  [8:0] mid;                  // 나온 중간값
realtime   t0, t_last;
integer    err_cnt, glitch_cnt;

always @(result) begin
	if (tracking) begin
		ev     = ev + 1;
		t_last = $realtime;
		if (result !== target) begin
			mid      = result;
			mid_seen = 1;
		end
	end
end


// a0+b0 상태에서 a1+b1 으로 바꾸되, 두 입력 사이에 skew(ns) 차이를 둔다
task run_case(input [7:0] a0, input [7:0] b0, input [7:0] a1, input [7:0] b1,
              input integer skew, input a_first);
begin
	// 1) 시작값으로 맞추고 충분히 안정
	tracking = 0;
	a = a0;  b = b0;
	target = a0 + b0;
	#20;

	// 2) 입력을 시간차를 두고 변경
	target   = a1 + b1;
	ev       = 0;
	mid_seen = 0;
	t0       = $realtime;
	t_last   = t0;
	tracking = 1;

	if (skew == 0)    begin a = a1; b = b1; end        // 동시에 변경 (기준)
	else if (a_first) begin a = a1; #(skew); b = b1; end
	else              begin b = b1; #(skew); a = a1; end

	#20;
	tracking = 0;

	// 3) 결과 출력
	if (result !== target) err_cnt = err_cnt + 1;
	if (mid_seen)          glitch_cnt = glitch_cnt + 1;

	if (mid_seen)
		$display("%s skew=%0d ns | %3d+%3d -> %3d+%3d | 중간값 %3d (c=%b) %4.1f ns 동안 | 최종 %3d %s",
		         a_first ? "a먼저" : "b먼저", skew, a0, b0, a1, b1,
		         mid, mid[8], t_last - t0, result, (result === target) ? "OK" : "FAIL");
	else
		$display("%s skew=%0d ns | %3d+%3d -> %3d+%3d | 중간값 없음                | 최종 %3d %s",
		         a_first ? "a먼저" : "b먼저", skew, a0, b0, a1, b1,
		         result, (result === target) ? "OK" : "FAIL");
end
endtask


// 같은 입력 변화를 skew 0/1/3/5 ns, a먼저/b먼저 로 반복
task run_all(input [7:0] a0, input [7:0] b0, input [7:0] a1, input [7:0] b1);
	integer k, skew;
begin
	$display("---------------------------------------------------------------------------");
	for (k = 0; k < 4; k = k + 1) begin
		skew = (k == 0) ? 0 : (k == 1) ? 1 : (k == 2) ? 3 : 5;
		run_case(a0, b0, a1, b1, skew, 1'b1);
		run_case(a0, b0, a1, b1, skew, 1'b0);
	end
end
endtask


initial begin
	err_cnt    = 0;
	glitch_cnt = 0;

	// 결과는 256 그대로인데 중간에 257 / 255 가 잠깐 나오는 경우
	run_all(8'd1,   8'd255, 8'd2,   8'd254);

	// carry 가 없어야 하는데(255) 중간에 carry 가 켜지는 경우 (b먼저 -> 255+255=510)
	run_all(8'd255, 8'd0,   8'd0,   8'd255);

	// 0 에서 최댓값으로 : 중간값 255 를 거쳐 510
	run_all(8'd0,   8'd0,   8'd255, 8'd255);

	// 127+1 -> 128+0 : 결과 128 그대로, 중간에 129 / 127
	run_all(8'd127, 8'd1,   8'd128, 8'd0);

	$display("---------------------------------------------------------------------------");
	$display("총 32회 중 중간값 발생 %0d회, 최종값 오류 %0d회", glitch_cnt, err_cnt);

	$finish;
end

endmodule
