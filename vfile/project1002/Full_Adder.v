`timescale 1ns / 1ps


module Full_Adder(


	input i_b,
	input i_a,
	input i_cin,

	output o_s,
	output o_c

);

wire w_s1;  // 첫 번째 Half_Adder 합
wire w_c1;  // 첫 번째 Half_Adder 캐리
wire w_c2;  // 두 번째 Half_Adder 캐리

// 1단: i_a + i_b
Half_Adder U_HA1 (
	.i_a (i_a),
	.i_b (i_b),
	.o_s (w_s1),
	.o_c (w_c1)
);

// 2단: (i_a + i_b) 합 + i_cin
Half_Adder U_HA2 (
	
	.i_a (w_s1),
	.i_b (i_cin),
	.o_s (o_s),
	.o_c (w_c2)
);


assign o_c = w_c1 | w_c2;

endmodule
