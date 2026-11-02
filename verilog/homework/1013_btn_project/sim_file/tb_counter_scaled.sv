`timescale 1ns / 1ps
//==============================================================================
// tb_counter_scaled : waveform-oriented TB for counter_10000_v2_scaled
//   Tick and FND scan are scaled by the same factor (1/SCALE), so the
//   tick : scan-cycle ratio (100ms : 4ms = 25 : 1) matches real hardware.
//   The debouncer is not scaled. Its input timing depends on the debouncer:
//     default          : button_debouncer      (100MHz, 8 samples = 80ns)  DEB_SCALE = 1
//     +define DEB_1MHZ : button_debouncer_1MHz (1MHz,   8 samples = 8us)   DEB_SCALE = 100
//   HOLD_NS (press time) is multiplied by DEB_SCALE; driver(2) noise is NOT scaled.
//   (Vivado: Settings > Simulation > Verilog options > Verilog defines: DEB_1MHZ)
//
// driver(1) : Normal scenario (stop -> run -> stop -> mode(down) -> run -> stop -> clear):
//   run 5 ticks, stop, U toggles to DOWN, run 3 ticks, stop, L clears.
//
// driver(2) : Noise scenario - SAME absolute noise (ns, NOT scaled) for both:
//   fixed noise (high 300~5000ns / low 1000~2500ns, same every run) is longer than the 100MHz
//   debouncer window (80ns) but shorter than the 1MHz window (8us)
//     100MHz : every burst is accepted  -> false R pulses, run/stop flips
//     1MHz   : all bursts are filtered  -> only the real press counts
//
// driver(3) : Simultaneous buttons (absolute times, NOT scaled).
//   FSM priority in stop state is R > L > U (state stop: if R / else if L / else if U),
//   in run state only R is looked at (L, U ignored).
//   a. stop : R+L+U together        -> R wins (run), L and U lost
//   b. run  : L+U together          -> ignored (still run, no clear, mode kept)
//   c. run  : R+L together          -> R wins (stop), L ignored (counter kept)
//   d. stop : L+U together          -> L wins (clear), U lost (mode kept)
//   e. stop : L then R 30ns later   -> debouncer dependent (see below)
//   f. stop : L then R 2us later    -> sequential: clear, then run (both modes)
//   In e, 100MHz sees two separate pulses (clear first, then R after the clear
//   state) while 1MHz usually puts both in the same 1us sample (R wins, clear lost).
//==============================================================================
`define DEB_1MHZ
module tb_counter_scaled();

parameter SCALE      = 100;
parameter TICK_COUNT = 10_000_000 / SCALE;   // 100_000 clk = 1ms
parameter SCAN_COUNT = 100_000 / SCALE;      //   1_000 clk = 10us per digit
parameter TICK_NS    = TICK_COUNT * 10;      // one tick in ns
`ifdef DEB_1MHZ
parameter DEB_SCALE  = 100;                  // sample period 1us (100 clk)
`else
parameter DEB_SCALE  = 1;                    // sample period 10ns (1 clk)
`endif
parameter HOLD_NS    = 1000 * DEB_SCALE;     // press time, > 8 samples
parameter GAP_NS     = 200_000;              // idle time after a release

reg  CLK;
reg  RESET;
reg  BTN_L;   // clear
reg  BTN_R;   // run_stop
reg  BTN_U;   // mode
wire [3:0] FND_COM;
wire [7:0] FND_DATA;

counter_10000_v2_scaled #(
    .TICK_COUNT (TICK_COUNT),
    .SCAN_COUNT (SCAN_COUNT)
) DUT (
    .i_clk      (CLK),
    .i_reset    (RESET),
    .i_btn_L    (BTN_L),
    .i_btn_R    (BTN_R),
    .i_btn_U    (BTN_U),
    .o_fnd_com  (FND_COM),
    .o_fnd_data (FND_DATA)
);

always #5 CLK = ~CLK;

// sel: 0 = R(run/stop), 1 = L(clear), 2 = U(mode)
task press(input integer sel);
begin
    case (sel)
        0: BTN_R = 1;
        1: BTN_L = 1;
        default: BTN_U = 1;
    endcase
    #(HOLD_NS);
    BTN_R = 0; BTN_L = 0; BTN_U = 0;
    #(GAP_NS);
end
endtask

task set_btn(input integer sel, input v);
begin
    case (sel)
        0: BTN_R = v;
        1: BTN_L = v;
        default: BTN_U = v;
    endcase
end
endtask

// front bounce (n_pre x high hi_pre / low lo_pre) -> stable high (hold)
// -> release bounce (n_post x low lo_post / high hi_post) -> low
task bounce_press(input integer sel,
                  input integer n_pre,  input integer hi_pre,  input integer lo_pre,
                  input integer hold,
                  input integer n_post, input integer hi_post, input integer lo_post);
integer k;
begin
    for (k = 0; k < n_pre; k = k + 1) begin
        set_btn(sel, 1); #(hi_pre);
        set_btn(sel, 0); #(lo_pre);
    end
    set_btn(sel, 1); #(hold);
    for (k = 0; k < n_post; k = k + 1) begin
        set_btn(sel, 0); #(lo_post);
        set_btn(sel, 1); #(hi_post);
    end
    set_btn(sel, 0);
    #(GAP_NS);
end
endtask

// debouncer output pulses seen per button
integer cnt_R, cnt_L, cnt_U;
always @(posedge DUT.w_btn_R) cnt_R = cnt_R + 1;
always @(posedge DUT.w_btn_L) cnt_L = cnt_L + 1;
always @(posedge DUT.w_btn_U) cnt_U = cnt_U + 1;

integer cnt_clr;                                  // clear states entered
always @(posedge DUT.w_clear) cnt_clr = cnt_clr + 1;

task clr_cnt;
begin
    cnt_R = 0; cnt_L = 0; cnt_U = 0; cnt_clr = 0;
end
endtask

// mask bit0 = R, bit1 = L, bit2 = U ; dR/dL/dU = start delay (ns) of each button
task press_multi(input integer mask, input integer dR, input integer dL, input integer dU,
                 input integer hold);
begin
    fork
        if (mask[0]) begin #(dR); BTN_R = 1; #(hold); BTN_R = 0; end
        if (mask[1]) begin #(dL); BTN_L = 1; #(hold); BTN_L = 0; end
        if (mask[2]) begin #(dU); BTN_U = 1; #(hold); BTN_U = 0; end
    join
    #(GAP_NS);
end
endtask

task show(input [8*44-1:0] msg);
begin
    $display("%0s pulses R/L/U=%0d/%0d/%0d clr=%0d | cnt=%0d run=%b mode=%b",
             msg, cnt_R, cnt_L, cnt_U, cnt_clr, DUT.w_counter, DUT.w_run_stop, DUT.w_mode);
end
endtask

// Fixed noise pattern (ns). NOT random on purpose: every simulation, and both
// debouncer modes, must see exactly the same input times.
// high 300~5000ns (>= 80ns: 100MHz accepts, < 8us: 1MHz filters)
// low  1000~2500ns (>= 1us: always covers one 1MHz sample, so the count resets)
function integer noise_hi(input integer k);
begin
    case (k)
        0: noise_hi = 5000;
        1: noise_hi = 3000;
        2: noise_hi = 1500;
        3: noise_hi = 300;
        4: noise_hi = 4000;
        default: noise_hi = 1000;
    endcase
end
endfunction

function integer noise_lo(input integer k);
begin
    case (k)
        0: noise_lo = 2000;
        1: noise_lo = 1500;
        2: noise_lo = 1200;
        3: noise_lo = 1000;
        4: noise_lo = 2500;
        default: noise_lo = 1000;
    endcase
end
endfunction

// n noise bursts from the fixed table above
task noise_burst(input integer sel, input integer n);
integer k;
begin
    for (k = 0; k < n; k = k + 1) begin
        set_btn(sel, 1); #(noise_hi(k));
        set_btn(sel, 0); #(noise_lo(k));
    end
end
endtask

task note(input [8*24-1:0] msg);
begin
    $display("%0t ns | %0s | cnt=%0d run=%b clr=%b mode=%b",
             $time, msg, DUT.w_counter, DUT.w_run_stop, DUT.w_clear, DUT.w_mode);
end
endtask

// driver(1) : normal scenario  (run / stop / mode / clear)
// driver(2) : noise scenario   (noise a debouncer must filter, see header)
task driver(input integer i);
begin
    case (i)

        1 : begin
            press(0);                  // R : stop -> run
            note("run started");
            #(5 * TICK_NS);
            note("after 5 ticks");

            press(0);                  // R : run -> stop
            note("stopped");
            #(2 * TICK_NS);
            note("2 ticks while stop");

            press(2);                  // U : mode up -> down
            note("mode toggled");

            press(0);                  // R : run (down)
            #(3 * TICK_NS);
            note("down 3 ticks");

            press(0);                  // R : stop
            press(1);                  // L : clear
            note("cleared");

            #(2 * TICK_NS);
        end

        2 : begin
            cnt_R = 0; cnt_L = 0; cnt_U = 0;

            // a : 5 noise bursts (fixed table: 300~5000ns high), then one real press (20us)
            noise_burst(0, 5);
`ifdef DEB_1MHZ
            $display("(a) noise only        cnt_R=%0d (1MHz: expect 0) run=%b", cnt_R, DUT.w_run_stop);
`else
            $display("(a) noise only        cnt_R=%0d (100MHz: expect 5) run=%b", cnt_R, DUT.w_run_stop);
`endif
            note("a: after noise");
            bounce_press(0, 0, 0, 0, 20_000, 0, 0, 0);          // real press
`ifdef DEB_1MHZ
            $display("(a) + real press      cnt_R=%0d (1MHz: expect 1) run=%b", cnt_R, DUT.w_run_stop);
`else
            $display("(a) + real press      cnt_R=%0d (100MHz: expect 6) run=%b", cnt_R, DUT.w_run_stop);
`endif
            #(3 * TICK_NS);
            note("a: after real press");

            // b : real press with 2 release-noise bursts (3000ns high / 1500ns low)
            cnt_R = 0;
            bounce_press(0, 0, 0, 0, 20_000, 2, 3000, 1500);
`ifdef DEB_1MHZ
            $display("(b) release noise     cnt_R=%0d (1MHz: expect 1)", cnt_R);
`else
            $display("(b) release noise     cnt_R=%0d (100MHz: expect 3)", cnt_R);
`endif
            #(2 * TICK_NS);
            note("b: after release noise");
        end

        3 : begin
            clr_cnt;

            press_multi(3'b111, 0, 0, 0, 20_000);          // a : stop, R+L+U
            show("(a) stop R+L+U  [exp run=1 clr=0 mode=0]");
            #(3 * TICK_NS);

            clr_cnt;
            press_multi(3'b110, 0, 0, 0, 20_000);          // b : run, L+U
            show("(b) run  L+U    [exp run=1 clr=0 mode=0]");

            clr_cnt;
            press_multi(3'b011, 0, 0, 0, 20_000);          // c : run, R+L
            show("(c) run  R+L    [exp run=0 clr=0 cnt>0]");
            #(2 * TICK_NS);

            clr_cnt;
            press_multi(3'b110, 0, 0, 0, 20_000);          // d : stop, L+U
            show("(d) stop L+U    [exp clr=1 cnt=0 mode=0]");

            // e, f need a non-zero counter: run 3 ticks, stop
            press(0);  #(3 * TICK_NS);  press(0);
            clr_cnt;
            press_multi(3'b011, 30, 0, 0, 20_000);         // e : L first, R 30ns later
            show("(e) L,R+30ns [100M clr=1 / 1M clr=0]");
            press(0);                                      // R : run -> stop (back to stop)

            press(0);  #(3 * TICK_NS);  press(0);
            clr_cnt;
            press_multi(3'b011, 2_000, 0, 0, 20_000);      // f : L first, R 2us later
            show("(f) L,R+2us     [exp clr=1 run=1]");
            #(2 * TICK_NS);
            note("end");
        end

    endcase
end
endtask

initial begin
    CLK = 0; RESET = 1;
    BTN_L = 0; BTN_R = 0; BTN_U = 0;
    cnt_R = 0; cnt_L = 0; cnt_U = 0;
    #100;
    RESET = 0;
    #(GAP_NS);

    driver(3);      // <- scenario number (1: normal, 2: noise, 3: simultaneous)

    $finish;
end

endmodule
