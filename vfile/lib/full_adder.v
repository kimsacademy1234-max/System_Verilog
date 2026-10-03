`timescale 1ns / 1ps
//==============================================================================
// Module      : full_adder
// Description : 1-bit full adder built from two half_adder instances.
//               {o_cout, o_sum} = i_a + i_b + i_cin
// Type        : Combinational
// Depends on  : half_adder
//==============================================================================

module full_adder (
    input  wire i_a,
    input  wire i_b,
    input  wire i_cin,

    output wire o_sum,
    output wire o_cout
);

wire w_sum1;    // 첫 번째 half_adder 합
wire w_cout1;   // 첫 번째 half_adder 캐리
wire w_cout2;   // 두 번째 half_adder 캐리

// 1단: i_a + i_b
half_adder U_HA0 (
    .i_a    (i_a),
    .i_b    (i_b),
    .o_sum  (w_sum1),
    .o_cout (w_cout1)
);

// 2단: (i_a + i_b) 합 + i_cin
half_adder U_HA1 (
    .i_a    (w_sum1),
    .i_b    (i_cin),
    .o_sum  (o_sum),
    .o_cout (w_cout2)
);

assign o_cout = w_cout1 | w_cout2;

endmodule
