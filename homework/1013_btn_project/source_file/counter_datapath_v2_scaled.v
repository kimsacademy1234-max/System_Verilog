`timescale 1ns / 1ps
//==============================================================================
// counter_datapath_v2_scaled : counter_datapath_v2 with tick_gen FCOUNT exposed.
//   Reuses tick_gen / tick_counter from vfile/.../btn/counter_data_v2.v
//   (that file must be in the simulation sources; only the wrapper is new).
//==============================================================================

module counter_datapath_v2_scaled #(
    parameter OFFSET     = 0,
    parameter TICK_COUNT = 10_000_000
)(
    input  i_clk,
    input  i_reset,
    input  i_run_stop,
    input  i_clear,
    input  i_mode,       // 0: up, 1: down
    output [13:0] o_counter,
    output o_tic
);

wire w_tic;
assign o_tic = w_tic;

tick_gen #(
    .FCOUNT (TICK_COUNT)
) GEN (
    .i_clk      (i_clk),
    .i_reset    (i_reset),
    .i_run_stop (i_run_stop),
    .i_clear    (i_clear),
    .o_tic      (w_tic)
);

tick_counter TICK(
    .i_clk     (i_clk),
    .i_reset   (i_reset),
    .i_tick    (w_tic),
    .i_clear   (i_clear),
    .i_mode    (i_mode),
    .o_counter (o_counter)
);

endmodule
