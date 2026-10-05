`timescale 1ns / 1ps
//==============================================================================
// Testbench   : tb_fnd_clk_top_v2
// DUT         : top_adder_fnd_for_clk_test (default, exhaustive 131,072 vectors)
//               top_adder_fnd_for_clk      (`define V3 : real clock_div, directed)
//
// Improvements over tb_fnd_clk_top.v
//  (1) Golden model   : w_golden = i_a + i_b + i_cin  (no DUT output used)
//  (2) o_cout check   : LED output o_cout == w_golden[8]
//  (3) Monitor        : sample o_fnd_com/o_fnd_data at i_clk negedge (stable)
//                       -> digit k, font decode, accumulate r_seen[k]
//  (4) Protocol check : one-cold, valid font (0~9), anode order AN0->AN1->AN2->AN3
//  (5) Refresh check  : judge only after all 4 digits are refreshed after an input change
//                       (event based instead of fixed #40 -> independent of scan rate, works for V3)
//                       error if 4 digits are not collected in time (FSM stuck / missing digit)
//  (6) Reset check    : all anodes OFF (1111) during reset, first digit after reset = AN0
//  (7) Input timing   : apply 2 ns after clk edge, rotate scan phase per vector
//==============================================================================
module tb_fnd_clk_top_v2;

`ifdef V3
localparam integer SCAN_TIMEOUT = 6_000_000;   // ns : 4 digits x 1 ms + margin
`else
localparam integer SCAN_TIMEOUT = 200;         // ns : 4 digits x 10 ns + margin
`endif
localparam integer MAX_PRINT    = 5;           // max printed errors per category

reg        i_clk;
reg        i_reset;                            // 1 = reset (BTNC pressed)
reg        i_cin;
reg  [7:0] i_a, i_b;
wire       o_cout;
wire [3:0] o_fnd_com;
wire [7:0] o_fnd_data;

`ifdef V3
// top_adder_fnd_for_clk inverts its i_reset_n port internally -> connect button value (1 = reset) directly
top_adder_fnd_for_clk DUT (
    .i_clk      (i_clk),
    .i_reset_n  (i_reset),
    .i_cin      (i_cin),
    .i_a        (i_a),
    .i_b        (i_b),
    .o_cout     (o_cout),
    .o_fnd_com  (o_fnd_com),
    .o_fnd_data (o_fnd_data)
);
`else
top_adder_fnd_for_clk_test DUT (
    .i_clk        (i_clk),
    .i_reset_n    (~i_reset),
    .i_cin        (i_cin),
    .i_a          (i_a),
    .i_b          (i_b),
    .o_cout       (o_cout),
    .o_fnd_com    (o_fnd_com),
    .o_fnd_data   (o_fnd_data),
    .o_digit_1    (),
    .o_digit_10   (),
    .o_digit_100  (),
    .o_digit_1000 ()
);
`endif

always #5 i_clk = ~i_clk;                      // 100 MHz

//------------------------------------------------------------------ Golden model
wire [8:0] w_golden = {1'b0, i_a} + {1'b0, i_b} + {8'd0, i_cin};

//------------------------------------------------------------------ Monitor
function [4:0] f_seg2dec;                      // {valid, digit}
    input [7:0] seg;
    case (seg)
        8'hC0: f_seg2dec = 5'h10;  8'hF9: f_seg2dec = 5'h11;
        8'hA4: f_seg2dec = 5'h12;  8'hB0: f_seg2dec = 5'h13;
        8'h99: f_seg2dec = 5'h14;  8'h92: f_seg2dec = 5'h15;
        8'h82: f_seg2dec = 5'h16;  8'hF8: f_seg2dec = 5'h17;
        8'h80: f_seg2dec = 5'h18;  8'h90: f_seg2dec = 5'h19;
        default: f_seg2dec = 5'h00;
    endcase
endfunction

reg  [3:0]  r_dig0, r_dig1, r_dig2, r_dig3;    // 1, 10, 100, 1000
reg  [3:0]  r_seen;                            // digits refreshed in this vector
reg         r_mon_en;
reg         r_allow_idle;                      // allow IDLE (1111) right after reset
integer     r_prev_k;                          // previous digit (-1 = none)
integer     k;
reg  [4:0]  dec;
wire [13:0] w_bcd_sum = r_dig3 * 1000 + r_dig2 * 100 + r_dig1 * 10 + r_dig0;

integer err_onecold, err_font, err_order, err_refresh, err_value, err_cout, err_reset;
integer err_cin [0:1];

always @(negedge i_clk) begin
    if (r_mon_en) begin
        case (o_fnd_com)
            4'b1110: k = 0;
            4'b1101: k = 1;
            4'b1011: k = 2;
            4'b0111: k = 3;
            default: k = -1;
        endcase

        if (k < 0) begin
            if (!(o_fnd_com == 4'b1111 && r_allow_idle)) begin
                err_onecold = err_onecold + 1;
                if (err_onecold <= MAX_PRINT)
                    $display("[ERROR][ONE-COLD] %0d ns : o_fnd_com = %b", $time, o_fnd_com);
            end
        end else begin
            // anode order: first digit after reset is AN0, then same digit or next digit only
            if ((r_prev_k < 0 && k != 0) || (r_prev_k >= 0 && k != r_prev_k && k != (r_prev_k + 1) % 4)) begin
                err_order = err_order + 1;
                if (err_order <= MAX_PRINT)
                    $display("[ERROR][ORDER] %0d ns : AN%0d -> AN%0d", $time, r_prev_k, k);
            end
            r_prev_k     = k;
            r_allow_idle = 1'b0;

            dec = f_seg2dec(o_fnd_data);
            if (!dec[4]) begin
                err_font = err_font + 1;
                if (err_font <= MAX_PRINT)
                    $display("[ERROR][FONT] %0d ns : AN%0d o_fnd_data = %h", $time, k, o_fnd_data);
            end else begin
                case (k)
                    0: r_dig0 = dec[3:0];
                    1: r_dig1 = dec[3:0];
                    2: r_dig2 = dec[3:0];
                    3: r_dig3 = dec[3:0];
                endcase
                r_seen[k] = 1'b1;
            end
        end
    end
end

//------------------------------------------------------------------ Driver + Checker
task t_check_vector;
    input [7:0] a;
    input [7:0] b;
    input       c;
    input [1:0] idle;                          // idle clocks before next vector (rotate scan phase)
    integer     t0;
    begin
        @(posedge i_clk); #2;                  // apply away from clk edge
        i_a = a; i_b = b; i_cin = c;
        if ((a == 8'd1 && b == 8'd255) || (a == 8'd255 && b == 8'd255))
            $display("[MARK] %0d ns : a=%0d b=%0d cin=%0d applied (for waveform capture)", $time, a, b, c);
        r_seen = 4'b0000;                      // do not reuse previous vector values
        r_dig0 = 4'hx; r_dig1 = 4'hx; r_dig2 = 4'hx; r_dig3 = 4'hx;

        t0 = $time;
        while (r_seen !== 4'b1111 && ($time - t0) < SCAN_TIMEOUT)
            @(posedge i_clk);                  // check half a cycle away from Monitor (negedge)
        #1;

        if (r_seen !== 4'b1111) begin
            err_refresh = err_refresh + 1;
            err_cin[c]  = err_cin[c] + 1;
            if (err_refresh <= MAX_PRINT)
                $display("[ERROR][REFRESH] a=%0d b=%0d cin=%0d : digits refreshed within %0d ns = %b",
                         a, b, c, SCAN_TIMEOUT, r_seen);
        end else if (w_bcd_sum !== {5'd0, w_golden}) begin
            err_value = err_value + 1;
            err_cin[c] = err_cin[c] + 1;
            if (err_value <= MAX_PRINT)
                $display("[ERROR][VALUE] a=%0d b=%0d cin=%0d : FND = %0d, expected = %0d",
                         a, b, c, w_bcd_sum, w_golden);
        end

        if (o_cout !== w_golden[8]) begin
            err_cout   = err_cout + 1;
            err_cin[c] = err_cin[c] + 1;
            if (err_cout <= MAX_PRINT)
                $display("[ERROR][COUT] a=%0d b=%0d cin=%0d : o_cout = %b, expected = %b",
                         a, b, c, o_cout, w_golden[8]);
        end

        repeat (idle) @(posedge i_clk);
    end
endtask

integer i, j, c, n_vec;
initial begin
    i_clk = 1'b1;  i_reset = 1'b0;  i_cin = 1'b0;  i_a = 8'd0;  i_b = 8'd0;
    r_mon_en = 1'b0;  r_allow_idle = 1'b1;  r_prev_k = -1;  r_seen = 4'b0000;
    r_dig0 = 4'hx; r_dig1 = 4'hx; r_dig2 = 4'hx; r_dig3 = 4'hx;
    err_onecold = 0; err_font = 0; err_order = 0; err_refresh = 0;
    err_value = 0; err_cout = 0; err_reset = 0; err_cin[0] = 0; err_cin[1] = 0;
    n_vec = 0;

    //---------------------------------------------------------- reset
    #2  i_reset = 1'b1;
    repeat (3) @(posedge i_clk);
    #2;
    if (o_fnd_com !== 4'b1111) begin
        err_reset = err_reset + 1;
        $display("[ERROR][RESET] o_fnd_com = %b during reset (expected 1111 = all OFF)", o_fnd_com);
    end
    i_reset  = 1'b0;                           // release 2 ns after posedge -> no race
    r_mon_en = 1'b1;

    //---------------------------------------------------------- stimulus
`ifdef V3
    // real clock_div (1 kHz): representative inputs only
    t_check_vector(8'd0,   8'd0,   1'b0, 2'd0);
    t_check_vector(8'd1,   8'd255, 1'b0, 2'd1);
    t_check_vector(8'd143, 8'd15,  1'b0, 2'd2);
    t_check_vector(8'd0,   8'd128, 1'b0, 2'd3);
    t_check_vector(8'd255, 8'd255, 1'b0, 2'd0);
    t_check_vector(8'd255, 8'd255, 1'b1, 2'd1);
    t_check_vector(8'd99,  8'd0,   1'b1, 2'd2);
    n_vec = 7;
`else
    for (c = 0; c < 2; c = c + 1)
        for (i = 0; i < 256; i = i + 1)
            for (j = 0; j < 256; j = j + 1) begin
                t_check_vector(i, j, c, (i + j + c) % 4);
                n_vec = n_vec + 1;
            end
`endif

    //---------------------------------------------------------- report
    $display("--------------------------------------------------------------");
    $display(" vectors = %0d", n_vec);
    $display(" [i_cin=0] %0s (%0d)   [i_cin=1] %0s (%0d)",
             err_cin[0] == 0 ? "PASS" : "FAIL", err_cin[0], err_cin[1] == 0 ? "PASS" : "FAIL", err_cin[1]);
    $display(" VALUE=%0d COUT=%0d REFRESH=%0d ONE-COLD=%0d ORDER=%0d FONT=%0d RESET=%0d",
             err_value, err_cout, err_refresh, err_onecold, err_order, err_font, err_reset);
    if (err_value + err_cout + err_refresh + err_onecold + err_order + err_font + err_reset == 0)
        $display("[PASS] : %0d vectors, ALL BCD CORRECT! (i_cin = 0, 1)", n_vec);
    else
        $display("[FAIL] : Please Check [ERROR] above");
    $display("--------------------------------------------------------------");
    $finish;
end

endmodule
