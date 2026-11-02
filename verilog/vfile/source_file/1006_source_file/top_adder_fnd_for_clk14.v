`timescale 1ns / 1ps
//==============================================================================
// Module      : top_adder_fnd_8bit
// Description : 8-bit adder 결과(0~510)를 10진수로 분리해 i_sel로 고른
//               자리를 FND에 표시하는 top
// Depends on  : full_adder_8bit, digit_splitter, mux_4x1, decoder_2x4,
//               fnd_decoder
//==============================================================================

module top_adder_fnd_for_clk14 (
    input  i_clk,
    input  i_reset,
    input  i_cin,
    input  wire [7:0] i_a,
    input  wire [7:0] i_b,

    output wire       o_cout,
    output wire [3:0] o_fnd_com,
    output wire [7:0] o_fnd_data,
	output wire o_clk

);

wire [7:0] w_sum;
wire [3:0] w_hex;
wire [3:0] w_digit_1;
wire [3:0] w_digit_10;
wire [3:0] w_digit_100;
wire [3:0] w_digit_1000;
wire w_clk;



assign o_clk = w_clk;

full_adder_8bit U_ADD (
    .i_a    (i_a),
    .i_b    (i_b),
    .i_cin  (i_cin),
    .o_sum  (w_sum),
    .o_cout (o_cout)
);

digit_splitter #(
    .WIDTH (9)
) U_SPLIT (
    .i_data       ({o_cout, w_sum}),
    .o_digit_1    (w_digit_1),
    .o_digit_10   (w_digit_10),
    .o_digit_100  (w_digit_100),
    .o_digit_1000 (w_digit_1000)
);

clock_div14 U_CLK_DIV(
    .i_clk(i_clk),
    .i_reset_n(~i_reset),
    .o_clk(w_clk)
);





Fnd_Controller U_FND_CON(

     .i_clk(w_clk_1kHz),
     .i_reset_n(~i_reset),
     .i_digit_1(w_digit_1),
     .i_digit_10(w_digit_10),
     .i_digit_100(w_digit_100),
     .i_digit_1000(w_digit_1000),
     .o_fnd_com(o_fnd_com),    
     .o_hex(w_hex)

        );



fnd_decoder U_FND_DEC (
    .i_hex      (w_hex),
    .o_fnd_data (o_fnd_data)
);

endmodule
