`timescale 1ns / 1ps
//==============================================================================
// clock_div_p : same behavior as vfile/lib/clock_div.v, but the scan period is
//               a parameter so simulation can scale it together with the tick.
//   SCAN_COUNT = 100000 (default) -> 100MHz / 100001 = ~1kHz (real hardware)
//   High for the first SCAN_COUNT/2 counts, low for the rest.
// New module name on purpose: it must not shadow the original clock_div.
//==============================================================================

module clock_div_p #(
    parameter SCAN_COUNT = 100000
)(
    input  i_clk,
    input  i_reset_n,
    output reg o_clk_1kHz
);

reg [$clog2(SCAN_COUNT+1)-1:0] r_clk_count;

always @(posedge i_clk or negedge i_reset_n) begin
    if (!i_reset_n) begin
        r_clk_count <= 0;
        o_clk_1kHz  <= 1;
    end
    else begin
        if (r_clk_count < SCAN_COUNT) begin
            r_clk_count <= r_clk_count + 1;
            if (r_clk_count < SCAN_COUNT/2) o_clk_1kHz <= 1'b1;
            else                            o_clk_1kHz <= 1'b0;
        end
        else begin
            r_clk_count <= 0;
        end
    end
end

endmodule
