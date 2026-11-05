`timescale 1ns / 1ps
//==============================================================================
// tb_debouncer_bounce : bounce / worst-case TB for button_debouncer (100MHz)
//
// DUT model (8-sample filter, sample period 10ns):
//   q_reg <= {i_btn, q_reg[7:1]} every posedge, o_btn = rising edge of &q_reg
//   -> a high level is accepted only if the input is 1 at 8 CONSECUTIVE posedges
//   -> any single posedge that samples 0 restarts the count
//   -> glitches that do not cover a posedge are invisible
//
// Clock rises at 5, 15, 25 ... ns.  Every input edge is placed at
// (posedge + p) with p = x.5 ns so no input edge ever coincides with a clock
// edge (no race).  Posedges seen by a high pulse of length H that rises p ns
// after a posedge: floor((p + H) / 10).  Accepted when that is >= 8.
//
// Cases
//   1. boundary sweep : H = 66..84ns x 10 phases, accept <=> edges >= 8
//   2. 7-sample chatter : high 65ns / low 12ns x10, then stable
//                         -> 0 pulses while chattering, 1 pulse after stable
//   3. glitch visibility : 2ns low glitch between edges (invisible) vs
//                          covering a posedge (restarts the 8-sample count)
//   4. burst limit : high bursts >= 80ns each pass through (3 bursts -> 3
//                    pulses). The filter cannot reject them.
//   5. release bounce : high 90ns after release -> 2nd pulse (double trigger)
//                       high 65ns after release -> filtered (1 pulse)
//==============================================================================

module tb_debouncer_bounce();

reg  CLK;
reg  RESET;
reg  BTN;
wire O_BTN;

button_debouncer DUT (
    .i_clk   (CLK),
    .i_reset (RESET),
    .i_btn   (BTN),
    .o_btn   (O_BTN)
);

always #5 CLK = ~CLK;

integer pulse_cnt;
real    t_first;
real    t_rise;
integer errors;

always @(posedge O_BTN) begin
    pulse_cnt = pulse_cnt + 1;
    if (pulse_cnt == 1) t_first = $realtime;
end

task clear_cnt;
begin
    pulse_cnt = 0;
    t_first   = -1.0;
end
endtask

// drive BTN=1 at (posedge + p)
task rise_at(input real p);
begin
    @(posedge CLK);
    #(p);
    BTN = 1;
    t_rise = $realtime;
end
endtask

task check(input cond, input [8*48-1:0] msg);
begin
    if (!cond) begin
        errors = errors + 1;
        $display("  [FAIL] %0s  (pulses=%0d)", msg, pulse_cnt);
    end
end
endtask

integer h, i, k, edges;
reg [0:9] got, exp_v;
real lat;

initial begin
    CLK = 0; RESET = 1; BTN = 0;
    errors = 0;
    clear_cnt;
    #100;
    RESET = 0;
    #300;

    //--------------------------------------------------------------------------
    // 1. boundary sweep
    //--------------------------------------------------------------------------
    $display("== 1. boundary sweep (columns = phase 0.5 .. 9.5 ns after posedge)");
    for (h = 66; h <= 84; h = h + 1) begin
        for (i = 0; i < 10; i = i + 1) begin
            clear_cnt;
            rise_at(i + 0.5);
            #(h);
            BTN = 0;
            #300;
            got[i] = (pulse_cnt == 1);
            edges  = $rtoi((i + 0.5 + h) / 10.0);
            exp_v[i] = (edges >= 8);
            check(pulse_cnt <= 1, "more than one pulse for a single high");
        end
        $display("  H=%0dns got=%b exp=%b %0s", h, got, exp_v,
                 (got === exp_v) ? "" : "MISMATCH");
        if (got !== exp_v) errors = errors + 1;
    end

    //--------------------------------------------------------------------------
    // 2. 7-sample chatter, then stable
    //--------------------------------------------------------------------------
    $display("== 2. 7-sample chatter (high 65ns / low 12ns) x10, then stable");
    clear_cnt;
    for (k = 0; k < 10; k = k + 1) begin
        rise_at(0.5);
        #65;
        BTN = 0;
        #12;
    end
    check(pulse_cnt == 0, "chatter must not produce a pulse");
    rise_at(0.5);               // final stable high
    #300;
    BTN = 0;
    lat = t_first - t_rise;
    $display("  pulses=%0d  latency from final rise = %0.1f ns (expect 70..80)",
             pulse_cnt, lat);
    check(pulse_cnt == 1, "one pulse after stable high");
    check(lat > 70.0 && lat <= 80.0, "latency from final rise in 70..80ns");
    #300;

    //--------------------------------------------------------------------------
    // 3. glitch visibility
    //--------------------------------------------------------------------------
    $display("== 3a. 2ns low glitches BETWEEN posedges (invisible)");
    clear_cnt;
    rise_at(0.5);
    for (k = 0; k < 6; k = k + 1) begin
        #3.5;                   // posedge+4.0
        BTN = 0;
        #2;                     // posedge+6.0, no clock edge inside
        BTN = 1;
        #4.5;                   // back to next posedge + 0.5 -> k*10 aligned
    end
    #300;
    BTN = 0;
    lat = t_first - t_rise;
    $display("  pulses=%0d  latency = %0.1f ns (expect 70..80, glitches ignored)",
             pulse_cnt, lat);
    check(pulse_cnt == 1, "invisible glitch keeps one pulse");
    check(lat > 70.0 && lat <= 80.0, "invisible glitch: latency unchanged");
    #300;

    $display("== 3b. 2ns low glitch COVERING a posedge (restarts count)");
    clear_cnt;
    rise_at(0.5);               // rise at e0 + 0.5
    #38.5;                      // e0 + 39.0
    BTN = 0;
    #2;                         // e0 + 41.0 : posedge at e0+40 samples 0
    BTN = 1;
    #300;
    BTN = 0;
    lat = t_first - t_rise;
    $display("  pulses=%0d  latency = %0.1f ns (expect ~120: 40 lost + 80)",
             pulse_cnt, lat);
    check(pulse_cnt == 1, "visible glitch still one pulse");
    check(lat > 110.0 && lat < 130.0, "visible glitch delays the pulse");
    #300;

    //--------------------------------------------------------------------------
    // 4. burst limit
    //--------------------------------------------------------------------------
    $display("== 4. bursts: high 90ns / low 15ns x3 (each burst >= 8 samples)");
    clear_cnt;
    for (k = 0; k < 3; k = k + 1) begin
        rise_at(0.5);
        #90;
        BTN = 0;
        #15;
    end
    #300;
    $display("  pulses=%0d (expect 3: bursts >= 80ns cannot be filtered)", pulse_cnt);
    check(pulse_cnt == 3, "each >=80ns burst gives one pulse");

    //--------------------------------------------------------------------------
    // 5. release bounce
    //--------------------------------------------------------------------------
    $display("== 5a. release bounce with high 90ns -> double trigger");
    clear_cnt;
    rise_at(0.5);
    #300;
    BTN = 0;                    // release
    #15;
    BTN = 1;                    // release bounce, 90ns
    #90;
    BTN = 0;
    #300;
    $display("  pulses=%0d (expect 2)", pulse_cnt);
    check(pulse_cnt == 2, "release bounce >=80ns double-triggers");

    $display("== 5b. release bounce with high 65ns -> filtered");
    clear_cnt;
    rise_at(0.5);
    #300;
    BTN = 0;
    #15;
    BTN = 1;
    #65;
    BTN = 0;
    #300;
    $display("  pulses=%0d (expect 1)", pulse_cnt);
    check(pulse_cnt == 1, "release bounce <70ns is filtered");

    //--------------------------------------------------------------------------
    $display("== done, errors = %0d", errors);
    $finish;
end

endmodule
