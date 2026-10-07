`timescale 1ns / 1ps
//==============================================================================
// Module      : digit_splitter
// Description : Binary -> 4 decimal digits (BCD). o_digit_1 = 1의 자리,
//               o_digit_10 = 10의 자리, o_digit_100, o_digit_1000.
// Type        : Combinational
// Parameter   : WIDTH - 입력 비트 폭 (기본 9 -> 0~511)
//==============================================================================

module digit_splitter #(
    parameter WIDTH = 14
) (
    input  wire [WIDTH-1:0] i_data,

    output wire [3:0]       o_digit_1,
    output wire [3:0]       o_digit_10,
    output wire [3:0]       o_digit_100,
    output wire [3:0]       o_digit_1000
);

assign o_digit_1    =  i_data         % 10;
assign o_digit_10   = (i_data / 10)   % 10;
assign o_digit_100  = (i_data / 100)  % 10;
assign o_digit_1000 = (i_data / 1000) % 10;

endmodule
