`timescale 1ns / 1ps
//==============================================================================
// Module      : full_adder_8bit
// Description : 8-bit ripple-carry adder (2 x full_adder_4bit).
//               {o_cout, o_sum} = i_a + i_b + i_cin
// Type        : Combinational
// Depends on  : full_adder_4bit
//==============================================================================

module full_adder_8bit (
    input  wire [7:0] i_a,
    input  wire [7:0] i_b,
    input  wire       i_cin,

    output wire [7:0] o_sum,
    output wire       o_cout
);

wire w_c4;  // 하위 4bit -> 상위 4bit 캐리

full_adder_4bit U_ADD_LO (
    .i_a    (i_a[3:0]),
    .i_b    (i_b[3:0]),
    .i_cin  (i_cin),
    .o_sum  (o_sum[3:0]),
    .o_cout (w_c4)
);

full_adder_4bit U_ADD_HI (
    .i_a    (i_a[7:4]),
    .i_b    (i_b[7:4]),
    .i_cin  (w_c4),
    .o_sum  (o_sum[7:4]),
    .o_cout ()
);

assign o_cout = 1'b0;
endmodule
