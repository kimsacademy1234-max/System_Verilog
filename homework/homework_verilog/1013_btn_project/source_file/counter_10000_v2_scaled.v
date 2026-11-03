`timescale 1ns / 1ps
//==============================================================================
// counter_10000_v2_scaled : copy of vfile/.../btn/counter_10000_btn.v
//   (module counter_10000_v2) with the two time constants exposed.
//   TICK_COUNT : tick_gen FCOUNT   (real 10_000_000 = 100ms @100MHz)
//   SCAN_COUNT : clock_div_p count (real    100_000 = 1kHz  @100MHz)
//   Scale both by the same factor to keep the tick : scan ratio of hardware.
//   e.g. 1/100 -> TICK_COUNT=100_000, SCAN_COUNT=1_000  (ratio unchanged)
// Everything else is identical to the original. Do NOT add this file to the
// Vivado project together with the original top (different module name, but
// both exist only for simulation).
//==============================================================================

`define DEB_1MHZ //(simulation Verilog define) -> button_debouncer_1MHz
//                    (sample 1us, 8 samples = 8us), otherwise button_debouncer (100MHz, 80ns)
`ifdef DEB_1MHZ
    `define DEB_MOD button_debouncer_1MHz
`else
    `define DEB_MOD button_debouncer
`endif

module counter_10000_v2_scaled #(
    parameter TICK_COUNT = 10_000_000,
    parameter SCAN_COUNT = 100_000
)(
    input  i_clk,
    input  i_reset,
    input  i_btn_L, // clear
    input  i_btn_R, // run_stop
    input  i_btn_U, // mode
    output wire [3:0] o_fnd_com,
    output wire [7:0] o_fnd_data
);

wire [3:0]  w_hex;
wire [3:0]  w_digit_1;
wire [3:0]  w_digit_10;
wire [3:0]  w_digit_100;
wire [3:0]  w_digit_1000;
wire        w_clk_1kHz;
wire [13:0] w_counter;
wire        w_tic;

wire w_btn_L;
wire w_btn_R;
wire w_btn_U;

wire w_run_stop;
wire w_clear;
wire w_mode;

`DEB_MOD DUT_BTN_L(
    .i_clk   (i_clk),
    .i_reset (i_reset),
    .i_btn   (i_btn_L),
    .o_btn   (w_btn_L)
);

`DEB_MOD DUT_BTN_R(
    .i_clk   (i_clk),
    .i_reset (i_reset),
    .i_btn   (i_btn_R),
    .o_btn   (w_btn_R)
);

`DEB_MOD DUT_BTN_U(
    .i_clk   (i_clk),
    .i_reset (i_reset),
    .i_btn   (i_btn_U),
    .o_btn   (w_btn_U)
);

FSM_RUN_STOP uut(
    .i_clk      (i_clk),
    .i_reset    (i_reset),
    .i_btn_U    (w_btn_U),
    .o_run_stop (w_run_stop),
    .o_clear    (w_clear),
    .o_mode     (w_mode),
    .i_btn_L    (w_btn_L),
    .i_btn_R    (w_btn_R)
);

counter_datapath_v2_scaled #(
    .OFFSET     (0),
    .TICK_COUNT (TICK_COUNT)
) U_CNT_DATA(
    .i_clk      (i_clk),
    .i_reset    (i_reset),
    .i_run_stop (w_run_stop),
    .i_clear    (w_clear),
    .i_mode     (w_mode),
    .o_counter  (w_counter),
    .o_tic      (w_tic)
);

digit_splitter #(
    .WIDTH (14)
) U_SPLIT (
    .i_data       (w_counter),
    .o_digit_1    (w_digit_1),
    .o_digit_10   (w_digit_10),
    .o_digit_100  (w_digit_100),
    .o_digit_1000 (w_digit_1000)
);

clock_div_p #(
    .SCAN_COUNT (SCAN_COUNT)
) U_CLK_DIV(
    .i_clk      (i_clk),
    .i_reset_n  (~i_reset),
    .o_clk_1kHz (w_clk_1kHz)
);

Fnd_Controller U_FND_CON(
    .i_clk        (w_clk_1kHz),
    .i_reset_n    (~i_reset),
    .i_digit_1    (w_digit_1),
    .i_digit_10   (w_digit_10),
    .i_digit_100  (w_digit_100),
    .i_digit_1000 (w_digit_1000),
    .o_fnd_com    (o_fnd_com),
    .o_hex        (w_hex)
);

fnd_decoder U_FND_DEC (
    .i_hex      (w_hex),
    .o_fnd_data (o_fnd_data)
);

endmodule

`undef DEB_MOD
