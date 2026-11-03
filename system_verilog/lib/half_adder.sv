`timescale 1ns / 1ps
//==============================================================================
// Module      : half_adder
// Description : 1-bit half adder. o_sum = i_a ^ i_b, o_cout = i_a & i_b
// Type        : Combinational
//==============================================================================

module adder (



input logic [7:0] a,	// input -> 베릴로그에서는 wire 자료형 , input logic -> 통합 4가지 모두 가능한 상태
input logic [7:0] b,

output logic [7:0] s,	
output logic c

);


assign {c,s} = a+b;


/*always_comb begin    // 여기서 사용된 모든 조합논리 입력을 감지하겠다. 단 always@(*) 이것도 써도 됨 - 표현의 차이임 ㅑ 

		{c,s} = a+b;

end*/





endmodule
