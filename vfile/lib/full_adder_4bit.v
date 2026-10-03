`timescale 1ns / 1ps
//==============================================================================
// Module      : full_adder_4bit
// Description : 4-bit ripple-carry adder (4 x full_adder).
//               {o_cout, o_sum} = i_a + i_b + i_cin
// Type        : Combinational
// Depends on  : full_adder
//==============================================================================

module full_adder_4bit (
    input  wire [3:0] i_a,
    input  wire [3:0] i_b,
    input  wire       i_cin,

    output wire [3:0] o_sum,
    output wire       o_cout
);

wire w_c1;
wire w_c2;
wire w_c3;

full_adder U_FA0 (
    .i_a    (i_a[0]),
    .i_b    (i_b[0]),
    .i_cin  (i_cin),
    .o_sum  (o_sum[0]),
    .o_cout (w_c1)
);

full_adder U_FA1 (
    .i_a    (i_a[1]),
    .i_b    (i_b[1]),
    .i_cin  (w_c1),
    .o_sum  (o_sum[1]),
    .o_cout (w_c2)
);

full_adder U_FA2 (
    .i_a    (i_a[2]),
    .i_b    (i_b[2]),
    .i_cin  (w_c2),
    .o_sum  (o_sum[2]),
    .o_cout (w_c3)
);

full_adder U_FA3 (
    .i_a    (i_a[3]),
    .i_b    (i_b[3]),
    .i_cin  (w_c3),
    .o_sum  (o_sum[3]),
    .o_cout (o_cout)
);

endmodule
