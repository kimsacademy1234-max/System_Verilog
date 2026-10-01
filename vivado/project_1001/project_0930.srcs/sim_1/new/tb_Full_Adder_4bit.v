`timescale 1ns / 1ps


module tb_Full_Adder_4bit();

reg  [3:0] i_a;
reg  [3:0] i_b;
reg        i_cin;

wire [3:0] o_s;
wire       o_c_out;

reg  [4:0] expected;    // 정답 {캐리, 합}
integer    i;
integer    err_cnt;

Full_Adder_4bit U_DUT (
	.i_a     (i_a),
	.i_b     (i_b),
	.i_cin   (i_cin),
	.o_s     (o_s),
	.o_c_out (o_c_out)
);

initial begin
	err_cnt = 0;

	// i_a(16) x i_b(16) x i_cin(2) = 512가지 전부 검사
	for (i = 0; i < 512; i = i + 1) begin
		{i_cin, i_b, i_a} = i[8:0];
		#10;

		expected = i_a + i_b + i_cin;
		if ({o_c_out, o_s} !== expected) begin
			err_cnt = err_cnt + 1;
			$display("[FAIL] %2d + %2d + %0d = %2d (c=%b s=%b), 정답 %2d (c=%b s=%b)",
			         i_a, i_b, i_cin, {o_c_out, o_s}, o_c_out, o_s,
			         expected, expected[4], expected[3:0]);
		end
	end

	if (err_cnt == 0) $display("[PASS] 512가지 모두 정답");
	else              $display("[FAIL] 512가지 중 %0d개 틀림", err_cnt);

	$finish;
end

endmodule
