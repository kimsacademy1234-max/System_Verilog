`timescale 1ns / 1ps
//==============================================================================
// tb_FSM_RUN_STOP_v2 : self-checking testbench for FSM_RUN_STOP (HW_4_2)
//   Driver  : i_sw changes only at negedge (stable at every posedge)
//   Golden  : independent spec table (STOP/RUN/CLEAR), not a copy of the DUT
//   Monitor : reads the o_sw port only (no internal signals)
//   Checks  : [C1] o_sw == expected code, one cycle after each posedge
//             [C2] Moore check - o_sw must not move when only i_sw moves
//             [C3] async reset - o_sw = STOP code without any clock edge
//             [C4] arc coverage - all 12 (state x sw) arcs exercised
//==============================================================================
module tb_FSM_RUN_STOP_v2();

reg        i_clk, i_reset;
reg  [1:0] i_sw;
wire [2:0] o_sw;

FSM_RUN_STOP DUT (
    .i_clk   (i_clk),
    .i_reset (i_reset),
    .i_sw    (i_sw),
    .o_sw    (o_sw)
);

always #5 i_clk = ~i_clk;

// ---------------- golden model (spec table) ----------------
localparam G_STOP = 0, G_RUN = 1, G_CLEAR = 2;
integer g_state;
integer err_c1, err_c2, err_c3, cycles;
integer cov [0:2][0:3];
integer s, w, hit;

function integer g_next(input integer st, input [1:0] sw);
    begin
        case (st)
            G_STOP : g_next = (sw[0]) ? G_RUN : (sw[1]) ? G_CLEAR : G_STOP;
            G_RUN  : g_next = (sw[0]) ? G_RUN   : G_STOP;
            G_CLEAR: g_next = (sw[1]) ? G_CLEAR : G_STOP;
            default: g_next = G_STOP;
        endcase
    end
endfunction

function [2:0] g_code(input integer st);
    begin
        case (st)
            G_STOP : g_code = 3'b001;
            G_RUN  : g_code = 3'b010;
            G_CLEAR: g_code = 3'b100;
            default: g_code = 3'bxxx;
        endcase
    end
endfunction

function [8*5-1:0] name(input [2:0] code);
    begin
        case (code)
            3'b001 : name = "STOP ";
            3'b010 : name = "RUN  ";
            3'b100 : name = "CLEAR";
            default: name = "?????";
        endcase
    end
endfunction

// golden model follows the clock and async reset
always @(posedge i_clk or posedge i_reset) begin
    if (i_reset) g_state <= G_STOP;
    else begin
        cov[g_state][i_sw] = cov[g_state][i_sw] + 1;
        g_state <= g_next(g_state, i_sw);
    end
end

// [C1] compare at negedge (half a cycle after the update edge)
always @(negedge i_clk) begin
    if (!i_reset) begin
        cycles = cycles + 1;
        if (o_sw !== g_code(g_state)) begin
            err_c1 = err_c1 + 1;
            if (err_c1 <= 10)
                $display("[C1 FAIL] %0d ns sw=%b exp=%s(%b) got=%s(%b)",
                         $time, i_sw, name(g_code(g_state)), g_code(g_state), name(o_sw), o_sw);
        end
    end
end

// ---------------- driver tasks ----------------
reg [2:0] o_before;

// apply a switch value at negedge, then run [C2] before the next posedge
// negedge 이후 1ns 뒤에 input값을 넣는다. 이때 출력값은 변하지 않아야 하므로 에러를 판단한다.

task drive(input [1:0] sw);
    begin
        @(negedge i_clk);
        #1;                       // after the [C1] sample
        o_before = o_sw;
        i_sw     = sw;
        #2;
        if (o_sw !== o_before) begin
            err_c2 = err_c2 + 1;
            if (err_c2 <= 10)
                $display("[C2 FAIL] %0d ns o_sw moved %b -> %b on input change only (Mealy path)",
                         $time, o_before, o_sw);
        end
    end
endtask

// async reset in the middle of a clock high phase, checked before any edge
task async_reset;
    begin
        @(posedge i_clk); #2;
        i_reset = 1; #1;
        if (o_sw !== 3'b001) begin
            err_c3 = err_c3 + 1;
            $display("[C3 FAIL] %0d ns o_sw=%b right after async reset (exp 001 STOP)", $time, o_sw);
        end
        @(negedge i_clk); #1;
        i_reset = 0;
    end
endtask

// directed arc: reset -> walk to state st -> apply sw for one clock
task arc(input integer st, input [1:0] sw);
    begin
        async_reset;
        if (st == G_RUN)   drive(2'b01);
        if (st == G_CLEAR) drive(2'b10);
        drive(sw);
        drive(sw);                // hold one more clock (RUN -> STOP -> CLEAR path)
    end
endtask

integer i, seed;
initial begin
    i_clk = 0; i_reset = 1; i_sw = 2'b00; g_state = G_STOP;
    err_c1 = 0; err_c2 = 0; err_c3 = 0; cycles = 0; seed = 1008;
    for (s = 0; s < 3; s = s + 1) for (w = 0; w < 4; w = w + 1) cov[s][w] = 0;
    #12 i_reset = 0;

    // phase 1 : 12 directed arcs (3 states x 4 switch codes)
    $display("[MARK] %0d ns phase 1 : directed arcs", $time);
    for (s = 0; s < 3; s = s + 1)
        for (w = 0; w < 4; w = w + 1)
            arc(s, w[1:0]);

    // phase 2 : random switch sequence with occasional async reset
    $display("[MARK] %0d ns phase 2 : random 300 cycles", $time);
    for (i = 0; i < 300; i = i + 1) begin
        if (($random(seed) & 31) == 0) async_reset;
        drive($random(seed));
    end
    @(negedge i_clk);

    // ---------------- report ----------------
    hit = 0;
    $display("------------------------------------------------");
    $display(" Arc coverage (state x sw)   00   01   10   11");
    for (s = 0; s < 3; s = s + 1) begin
        $display("   %s                   %4d %4d %4d %4d", name(g_code(s)),
                 cov[s][0], cov[s][1], cov[s][2], cov[s][3]);
        for (w = 0; w < 4; w = w + 1) if (cov[s][w] > 0) hit = hit + 1;
    end
    $display("------------------------------------------------");
    $display(" checked cycles : %0d", cycles);
    $display(" [C1] output mismatch : %0d", err_c1);
    $display(" [C2] Mealy path      : %0d", err_c2);
    $display(" [C3] async reset     : %0d", err_c3);
    $display(" [C4] arc coverage    : %0d / 12", hit);
    if (err_c1 + err_c2 + err_c3 == 0 && hit == 12)
        $display(" RESULT : PASS");
    else
        $display(" RESULT : FAIL (errors=%0d)", err_c1 + err_c2 + err_c3);
    $display("------------------------------------------------");
    $finish;
end

endmodule
