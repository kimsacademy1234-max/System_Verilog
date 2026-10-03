`timescale 1ns / 1ps
//==============================================================================
// Module      : carry_display
// Description : 2-digit FND scan. 매 클럭마다 digit0(합 폰트)과
//               digit1(캐리 표시)을 번갈아 출력한다.
// Type        : Sequential (posedge i_clk, async active-low reset)
//==============================================================================

module carry_display (
    input  wire       i_clk,
    input  wire       i_rst_n,
    input  wire       i_cout,
    input  wire [7:0] i_fnd_data,

    output reg  [7:0] o_fnd_data,
    output reg  [3:0] o_fnd_com
);

reg r_digit_sel;    // 0: digit0(합), 1: digit1(캐리)

always @(posedge i_clk or negedge i_rst_n) begin
    if (!i_rst_n) begin
        o_fnd_data  <= 8'b1100_0000;
        o_fnd_com   <= 4'b1111;
        r_digit_sel <= 1'b0;
    end
    else begin
        r_digit_sel <= ~r_digit_sel;
        if (!r_digit_sel) begin
            o_fnd_data <= i_fnd_data;
            o_fnd_com  <= 4'b1110;
        end
        else begin
            o_fnd_data <= i_cout ? 8'b1111_1100 : 8'b1100_0000;
            o_fnd_com  <= 4'b1101;
        end
    end
end

endmodule
