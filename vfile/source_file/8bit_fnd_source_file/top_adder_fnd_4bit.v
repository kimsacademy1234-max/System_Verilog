`timescale 1ns / 1ps
//==============================================================================
// Module      : top_adder_fnd_4bit
// Description : 4-bit adder 결과(hex)를 FND digit0에 표시하는 top
// Depends on  : full_adder_4bit, fnd_decoder
//==============================================================================

module top_adder_fnd_4bit (
    input  wire [3:0] i_a,
    input  wire [3:0] i_b,

    output wire       o_cout,
    output wire [3:0] o_fnd_com,
    output wire [7:0] o_fnd_data
);

wire [3:0] w_sum;

assign o_fnd_com = 4'b1110;     // digit0만 사용

full_adder_4bit U_ADD (
    .i_a    (i_a),
    .i_b    (i_b),
    .i_cin  (1'b0),
    .o_sum  (w_sum),
    .o_cout (o_cout)
);

fnd_decoder U_FND_DEC (
    .i_hex      (w_sum),
    .o_fnd_data (o_fnd_data)
);

endmodule
