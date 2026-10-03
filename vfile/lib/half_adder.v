`timescale 1ns / 1ps
//==============================================================================
// Module      : half_adder
// Description : 1-bit half adder. o_sum = i_a ^ i_b, o_cout = i_a & i_b
// Type        : Combinational
//==============================================================================

module half_adder (
    input  wire i_a,
    input  wire i_b,

    output wire o_sum,
    output wire o_cout
);

assign o_sum  = i_a ^ i_b;
assign o_cout = i_a & i_b;

endmodule
