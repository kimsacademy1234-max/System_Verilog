`timescale 1ns / 1ps

// ============================================================================
// tb_uart : uart_fifo_loopback verification (PC = 9600 bps fixed)
//
//   S1  FIFO unit         push / pop / push+pop at empty, middle, full, pointer wrap
//   S2  single byte echo  256 bytes, wait for each echo (PC bit 104166.667 ns)
//   S3  9600 back-to-back 256 bytes with no gap        (PC bit 104166.667 ns)
//   S4  worst case        256 bytes with no gap, PC = FPGA speed (bit 104160 ns)
//                         -> next rx_done meets TX STOP -> IDLE, byte waits in FIFO
//   S5  START glitch      23 glitch cases from the 02_UART test (regression)
//
//   - every scenario ends with a result block and $stop (STOP_EACH = 1)
//   - an error prints expected vs actual with $stime (ns) and pulses err_flag
// ============================================================================
module tb_uart ();

    parameter BAUD_BIT_PERIOD = 100_000_000 / 9600 * 10;  // 104160 ns = FPGA bit (16 x 6510 ns)
    parameter real PC_BIT = 1.0e9 / 9600.0;               // 104166.667 ns = PC 9600 bps
    parameter STOP_EACH = 0;                              // 1: $stop after every scenario
    localparam TICK  = BAUD_BIT_PERIOD / 16;              // 6510 ns
    localparam DEPTH = 4;                                 // FIFO depth in uart_fifo_loopback

    reg clk, rst, rx;
    wire tx;

    reg [3:0] scenario;   // current scenario number (waveform)
    reg err_flag;         // 20 ns pulse on every error (waveform)
    event err_ev;
    always @(err_ev) begin
        err_flag = 1'b1;
        #20 err_flag = 1'b0;
    end

    integer i, k, n;
    integer seed;
    integer res_pass[1:5], res_note[1:5];  // per scenario: pass flag, main count

    uart_fifo_loopback dut (
        .clk(clk),
        .rst(rst),
        .rx (rx),
        .tx (tx)
    );

    always #5 clk = ~clk;

    // ========================================================================
    // S1 : FIFO unit under test + reference model
    // ========================================================================
    reg ut_rst, ut_push, ut_pop;
    reg [7:0] ut_push_data;
    wire [7:0] ut_pop_data;
    wire ut_full, ut_empty;

    fifo #(.DEPTH(DEPTH), .BIT_WIDTH(8)) U_FIFO_UT (
        .i_clk    (clk),
        .i_reset  (ut_rst),
        .push     (ut_push),
        .pop      (ut_pop),
        .push_data(ut_push_data),
        .pop_data (ut_pop_data),
        .full     (ut_full),
        .empty    (ut_empty)
    );

    // model : push accepted only when not full, pop accepted only when not empty
    reg [7:0] m_q[0:DEPTH-1];
    reg [3:0] ut_model_cnt;
    reg [7:0] ut_model_head;
    integer m_wp, ut_steps, ut_err;
    integer cov_push_full, cov_pop_empty, cov_pp_empty, cov_pp_mid, cov_pp_full, cov_wrap;

    task ut_check(input [8*10-1:0] op, input integer cnt_before);
        reg e_empty, e_full;
        begin
            e_empty = (ut_model_cnt == 0);
            e_full  = (ut_model_cnt == DEPTH);
            if (ut_empty !== e_empty || ut_full !== e_full || (ut_model_cnt != 0 && ut_pop_data !== m_q[0])) begin
                ut_err = ut_err + 1;
                -> err_ev;
                $display("[S1][ERROR] t=%0d ns step %0d %0s (count before %0d)", $stime, ut_steps, op, cnt_before);
                $display("            expected : empty=%b full=%b head=%h", e_empty, e_full, ut_model_cnt ? m_q[0] : 8'hxx);
                $display("            result   : empty=%b full=%b pop_data=%h", ut_empty, ut_full, ut_pop_data);
            end
        end
    endtask

    task ut_step(input p, input q, input [7:0] d);
        integer c0, j;
        reg acc_push, acc_pop;
        reg [8*10-1:0] op;
        begin
            op = (p & q) ? "push+pop" : p ? "push" : q ? "pop" : "idle";
            @(negedge clk);
            ut_push = p; ut_pop = q; ut_push_data = d;
            c0 = ut_model_cnt;
            // coverage of the corner cases
            if (p & !q & (c0 == DEPTH)) cov_push_full = cov_push_full + 1;
            if (!p & q & (c0 == 0)) cov_pop_empty = cov_pop_empty + 1;
            if (p & q & (c0 == 0)) cov_pp_empty = cov_pp_empty + 1;
            if (p & q & (c0 == DEPTH)) cov_pp_full = cov_pp_full + 1;
            if (p & q & (c0 > 0) & (c0 < DEPTH)) cov_pp_mid = cov_pp_mid + 1;
            @(posedge clk);
            acc_pop  = q & (c0 > 0);
            acc_push = p & (c0 < DEPTH);
            if (acc_pop) begin
                for (j = 0; j < DEPTH - 1; j = j + 1) m_q[j] = m_q[j+1];
                ut_model_cnt = ut_model_cnt - 1;
            end
            if (acc_push) begin
                m_q[ut_model_cnt] = d;
                ut_model_cnt = ut_model_cnt + 1;
                m_wp = m_wp + 1;
                if (m_wp == DEPTH) begin m_wp = 0; cov_wrap = cov_wrap + 1; end
            end
            ut_model_head = ut_model_cnt ? m_q[0] : 8'h00;
            @(negedge clk);
            ut_push = 0; ut_pop = 0;
            ut_steps = ut_steps + 1;
            ut_check(op, c0);
        end
    endtask

    // ========================================================================
    // UART stimulus : PC sender
    // ========================================================================
    real bit_t;              // sender bit time (PC_BIT or BAUD_BIT_PERIOD)
    integer sent_cnt;
    reg [7:0] exp_q[0:1023];
    reg [7:0] last_sent;

    task send_byte(input [7:0] d);
        integer b;
        begin
            exp_q[sent_cnt] = d;
            sent_cnt = sent_cnt + 1;
            last_sent = d;
            rx = 0;  // start bit
            #(bit_t);
            for (b = 0; b < 8; b = b + 1) begin
                rx = d[b];
                #(bit_t);
            end
            rx = 1;  // stop bit
            #(bit_t);
        end
    endtask

    integer perm[0:255];
    task make_perm(input integer sd);  // 0x00 ~ 0xFF in random order, each once
        integer a, j, t;
        begin
            seed = sd;
            for (a = 0; a < 256; a = a + 1) perm[a] = a;
            for (a = 255; a > 0; a = a - 1) begin
                j = {$random(seed)} % (a + 1);
                t = perm[a]; perm[a] = perm[j]; perm[j] = t;
            end
        end
    endtask

    // ========================================================================
    // TX monitor + scoreboard : decode every tx frame, compare with exp_q
    // ========================================================================
    reg sb_on;
    integer echo_cnt, sb_err, frm_err;
    reg [7:0] echo_byte, echo_last;
    time prev_end, last_rxd_time;
    reg have_prev;
    integer gap_min, gap_max, lat_min, lat_max;

    always begin : TX_MON
        integer b, g;
        time ts;
        @(negedge tx);
        ts = $time;
        if (last_rxd_time > 0 && ts - last_rxd_time < BAUD_BIT_PERIOD) begin  // rx_done -> tx fall
            g = (ts - last_rxd_time) / 10;
            if (g < lat_min) lat_min = g;
            if (g > lat_max) lat_max = g;
        end
        if (have_prev) begin
            g = (ts - prev_end) / 10;
            if (g < gap_min) gap_min = g;
            if (g > gap_max) gap_max = g;
        end
        #(BAUD_BIT_PERIOD / 2);
        if (tx !== 1'b0) begin
            frm_err = frm_err + 1; -> err_ev;
            $display("[S%0d][ERROR] t=%0d ns tx start bit : expected 0, result %b", scenario, $stime, tx);
        end
        for (b = 0; b < 8; b = b + 1) begin
            #(BAUD_BIT_PERIOD);
            echo_byte[b] = tx;
        end
        #(BAUD_BIT_PERIOD);
        if (tx !== 1'b1) begin
            frm_err = frm_err + 1; -> err_ev;
            $display("[S%0d][ERROR] t=%0d ns tx stop bit : expected 1, result %b", scenario, $stime, tx);
        end
        prev_end = ts + 10 * BAUD_BIT_PERIOD;
        have_prev = 1;
        if (sb_on) begin
            if (echo_cnt >= sent_cnt) begin
                sb_err = sb_err + 1; -> err_ev;
                $display("[S%0d][ERROR] t=%0d ns extra echo #%0d : expected none (sent %0d), result %h", scenario, $stime, echo_cnt, sent_cnt, echo_byte);
            end else if (echo_byte !== exp_q[echo_cnt]) begin
                sb_err = sb_err + 1; -> err_ev;
                $display("[S%0d][ERROR] t=%0d ns echo #%0d : expected %h (%b), result %h (%b)",
                         scenario, $stime, echo_cnt, exp_q[echo_cnt], exp_q[echo_cnt], echo_byte, echo_byte);
            end
        end
        echo_last = echo_byte;
        echo_cnt = echo_cnt + 1;
    end

    // ========================================================================
    // inside monitor : rx_done, FIFO occupancy, bytes held in FIFO
    // ========================================================================
    integer rxd_cnt, held_cnt, full_rx_cnt, full_tx_cnt;
    reg [7:0] rxd_last;
    reg [3:0] occ_rx, occ_tx, occ_rx_max, occ_tx_max;
    reg full_rx_d, full_tx_d;

    always @(negedge clk) begin
        occ_rx = dut.DUT_FIFO_RX.full ? DEPTH :
                 ((dut.DUT_FIFO_RX.U_UART_CONTROL.wptr_reg - dut.DUT_FIFO_RX.U_UART_CONTROL.rptr_reg) & (DEPTH - 1));
        occ_tx = dut.DUT_FIFO_TX.full ? DEPTH :
                 ((dut.DUT_FIFO_TX.U_UART_CONTROL.wptr_reg - dut.DUT_FIFO_TX.U_UART_CONTROL.rptr_reg) & (DEPTH - 1));
        if (occ_rx > occ_rx_max) occ_rx_max = occ_rx;
        if (occ_tx > occ_tx_max) occ_tx_max = occ_tx;
        if (dut.DUT_FIFO_RX.full & !full_rx_d) full_rx_cnt = full_rx_cnt + 1;
        if (dut.DUT_FIFO_TX.full & !full_tx_d) full_tx_cnt = full_tx_cnt + 1;
        full_rx_d = dut.DUT_FIFO_RX.full;
        full_tx_d = dut.DUT_FIFO_TX.full;
        if (dut.w_rx_done) begin
            rxd_cnt = rxd_cnt + 1;
            rxd_last = dut.w_rx_data;
            last_rxd_time = $time;
            if (dut.U_UART_TX.c_state != 1) held_cnt = held_cnt + 1;  // TX not IDLE -> byte waits in FIFO
        end
    end

    task clear_stats;
        begin
            sent_cnt = 0; echo_cnt = 0; sb_err = 0; frm_err = 0;
            rxd_cnt = 0; held_cnt = 0; full_rx_cnt = 0; full_tx_cnt = 0;
            occ_rx_max = 0; occ_tx_max = 0;
            have_prev = 0; gap_min = 1 << 30; gap_max = 0;
            last_rxd_time = 0; lat_min = 1 << 30; lat_max = 0;
        end
    endtask

    // wait until echo_cnt reaches target (time-out after max_bits FPGA bits)
    task wait_echo(input integer target, input integer max_bits, output integer ok);
        integer w;
        begin
            for (w = 0; w < max_bits * 10 && echo_cnt < target; w = w + 1) #(BAUD_BIT_PERIOD / 10);
            ok = (echo_cnt >= target);
        end
    endtask

    // missing echo list at the end of a scenario
    task check_missing;
        integer m;
        begin
            if (echo_cnt < sent_cnt) begin
                sb_err = sb_err + (sent_cnt - echo_cnt); -> err_ev;
                $display("[S%0d][ERROR] t=%0d ns missing echo : expected %0d echoes, result %0d", scenario, $stime, sent_cnt, echo_cnt);
                for (m = echo_cnt; m < sent_cnt && m < echo_cnt + 8; m = m + 1)
                    $display("            missing #%0d : expected %h", m, exp_q[m]);
            end
        end
    endtask

    task report_stream(input integer sc, input [8*48-1:0] name);
        begin
            res_pass[sc] = (sb_err == 0 && frm_err == 0 && echo_cnt == sent_cnt);
            res_note[sc] = echo_cnt;
            $display("--------------------------------------------------------------------");
            $display("[S%0d] %0s : %0s", sc, name, res_pass[sc] ? "PASS" : "FAIL");
            $display("     sent %0d / echoed %0d / mismatch %0d / frame error %0d", sent_cnt, echo_cnt, sb_err, frm_err);
            $display("     FIFO_RX max %0d, FIFO_TX max %0d, full RX %0d TX %0d, rx_done while TX busy %0d",
                     occ_rx_max, occ_tx_max, full_rx_cnt, full_tx_cnt, held_cnt);
            if (gap_max > 0) $display("     TX frame gap min %0d clk, max %0d clk", gap_min, gap_max);
            if (lat_max > 0) $display("     rx_done -> tx fall latency min %0d clk, max %0d clk", lat_min, lat_max);
            $display("--------------------------------------------------------------------");
        end
    endtask

    // ========================================================================
    // S5 : START glitch tasks (from 02_UART)
    // ========================================================================
    integer g_pass, g_fail;

    task sender_glitch(input integer width, input integer num, input integer gap);
        integer kk;
        begin
            for (kk = 0; kk < num; kk = kk + 1) begin
                rx = 0;
                #(width);
                rx = 1;
                if (kk < num - 1) #(gap);
            end
        end
    endtask

    // on_tick = 1 : glitch centered on a sampling edge, 0 : starts 3 ns after it
    task align_glitch(input integer width, input on_tick);
        begin
            @(posedge dut.w_b_tick);
            if (on_tick) #(5 * TICK + 10 - width / 2 + 2);
            else #(10 + 3);
        end
    endtask

    task check_glitch(input integer width, input integer num, input integer gap, input on_tick);
        integer r0, t0;
        begin
            align_glitch(width, on_tick);
            r0 = rxd_cnt; t0 = echo_cnt;
            sender_glitch(width, num, gap);
            #(BAUD_BIT_PERIOD * 25);
            if (rxd_cnt == r0 && echo_cnt == t0) g_pass = g_pass + 1;
            else begin
                g_fail = g_fail + 1; -> err_ev;
                $display("[S5][ERROR] t=%0d ns glitch w=%0d ns x%0d gap=%0d %0s", $stime, width, num, gap, on_tick ? "on-tick" : "off-tick");
                $display("            expected : rx_done 0, echo 0");
                $display("            result   : rx_done %0d (last %h), echo %0d (last %h)", rxd_cnt - r0, rxd_last, echo_cnt - t0, echo_last);
            end
        end
    endtask

    task check_glitch_data(input integer width, input on_tick, input integer gap, input [7:0] data);
        integer r0, t0;
        begin
            align_glitch(width, on_tick);
            r0 = rxd_cnt; t0 = echo_cnt;
            sender_glitch(width, 1, 0);
            #(gap);
            send_byte(data);
            #(BAUD_BIT_PERIOD * 25);
            if (rxd_cnt == r0 + 1 && rxd_last == data && echo_cnt == t0 + 1 && echo_last == data) g_pass = g_pass + 1;
            else begin
                g_fail = g_fail + 1; -> err_ev;
                $display("[S5][ERROR] t=%0d ns glitch w=%0d ns %0s + %0d ns + data %h", $stime, width, on_tick ? "on-tick" : "off-tick", gap, data);
                $display("            expected : rx_done 1 (%h), echo 1 (%h)", data, data);
                $display("            result   : rx_done %0d (last %h), echo %0d (last %h)", rxd_cnt - r0, rxd_last, echo_cnt - t0, echo_last);
            end
        end
    endtask

    integer gw[0:7];

    task scenario_end;
        begin
            if (STOP_EACH) $stop;
        end
    endtask

    // ========================================================================
    // main
    // ========================================================================
    integer ok;

    initial begin
        clk = 0; rst = 1; rx = 1; err_flag = 0; scenario = 0;
        ut_rst = 1; ut_push = 0; ut_pop = 0; ut_push_data = 0;
        sb_on = 0; bit_t = PC_BIT; echo_last = 0; rxd_last = 0;
        full_rx_d = 0; full_tx_d = 0;
        clear_stats;
        #100 rst = 0; ut_rst = 0;

        // ---------------------------------------------------------------- S1
        scenario = 1;
        $display("==== [S1] FIFO unit : push / pop / push+pop at empty, middle, full ====");
        ut_model_cnt = 0; ut_model_head = 0; m_wp = 0; ut_steps = 0; ut_err = 0;
        cov_push_full = 0; cov_pop_empty = 0; cov_pp_empty = 0; cov_pp_mid = 0; cov_pp_full = 0; cov_wrap = 0;
        @(negedge clk);
        ut_check("reset", 0);
        for (k = 0; k < DEPTH; k = k + 1) ut_step(1, 0, 8'hA0 + k);  // fill
        ut_step(1, 0, 8'hEE);                                       // push while full : ignored
        ut_step(1, 1, 8'hB0);                                       // push+pop while full
        ut_step(0, 1, 8'h00);                                       // pop
        ut_step(1, 1, 8'hB1);                                       // push+pop in the middle
        for (k = 0; k < DEPTH + 1; k = k + 1) ut_step(0, 1, 8'h00);  // drain + pop while empty
        ut_step(1, 1, 8'hC0);                                       // push+pop while empty
        seed = 32'h5EED;
        for (k = 0; k < 400; k = k + 1) begin                       // random mix, pointer wrap
            n = {$random(seed)} % 4;
            ut_step(n[0], n[1], {$random(seed)} % 256);
        end
        res_pass[1] = (ut_err == 0);
        res_note[1] = ut_steps;
        $display("--------------------------------------------------------------------");
        $display("[S1] FIFO unit : %0s", res_pass[1] ? "PASS" : "FAIL");
        $display("     steps %0d / mismatch %0d", ut_steps, ut_err);
        $display("     covered : push@full %0d, pop@empty %0d, push+pop@empty %0d, push+pop@mid %0d, push+pop@full %0d, wptr wrap %0d",
                 cov_push_full, cov_pop_empty, cov_pp_empty, cov_pp_mid, cov_pp_full, cov_wrap);
        $display("--------------------------------------------------------------------");
        scenario_end;

        // ---------------------------------------------------------------- S2
        scenario = 2;
        $display("==== [S2] single byte echo : 256 bytes, wait for each echo (bit %0.3f ns) ====", PC_BIT);
        clear_stats; sb_on = 1; bit_t = PC_BIT;
        make_perm(32'h0002);
        for (i = 0; i < 256; i = i + 1) begin
            send_byte(perm[i]);
            wait_echo(sent_cnt, 30, ok);
            if (!ok) begin
                -> err_ev;
                $display("[S2][ERROR] t=%0d ns byte #%0d : expected echo %h, result no echo", $stime, i, perm[i]);
            end
            #(BAUD_BIT_PERIOD * 2);
        end
        check_missing;
        report_stream(2, "single byte echo (256)");
        sb_on = 0;
        scenario_end;

        // ---------------------------------------------------------------- S3
        scenario = 3;
        $display("==== [S3] 9600 bps back-to-back : 256 bytes, no gap (bit %0.3f ns) ====", PC_BIT);
        clear_stats; sb_on = 1; bit_t = PC_BIT;
        make_perm(32'h0003);
        for (i = 0; i < 256; i = i + 1) send_byte(perm[i]);
        wait_echo(sent_cnt, 40, ok);
        #(BAUD_BIT_PERIOD * 30);  // extra echo check
        check_missing;
        report_stream(3, "9600 bps back-to-back (256)");
        sb_on = 0;
        scenario_end;

        // ---------------------------------------------------------------- S4
        scenario = 4;
        $display("==== [S4] worst case : 256 bytes, no gap, PC = FPGA speed (bit %0d ns) ====", BAUD_BIT_PERIOD);
        clear_stats; sb_on = 1; bit_t = BAUD_BIT_PERIOD;
        make_perm(32'h0004);
        for (i = 0; i < 256; i = i + 1) send_byte(perm[i]);
        wait_echo(sent_cnt, 40, ok);
        #(BAUD_BIT_PERIOD * 30);
        check_missing;
        report_stream(4, "worst case back-to-back (256)");
        sb_on = 0;
        scenario_end;

        // ---------------------------------------------------------------- S5
        scenario = 5;
        $display("==== [S5] START glitch regression : 23 cases ====");
        clear_stats; sb_on = 0; bit_t = BAUD_BIT_PERIOD;
        g_pass = 0; g_fail = 0;
        gw[0] = 20;   gw[1] = 200;      gw[2] = 2000;                gw[3] = 6000;
        gw[4] = TICK; gw[5] = 2 * TICK; gw[6] = BAUD_BIT_PERIOD / 4; gw[7] = 50000;
        for (k = 0; k < 8; k = k + 1) begin
            check_glitch(gw[k], 1, 0, 0);
            check_glitch(gw[k], 1, 0, 1);
        end
        check_glitch(200, 5, 1000, 0);
        check_glitch(1000, 8, 1000, 0);
        check_glitch_data(200, 0, BAUD_BIT_PERIOD, 8'h55);
        check_glitch_data(200, 1, BAUD_BIT_PERIOD, 8'h55);
        check_glitch_data(200, 1, BAUD_BIT_PERIOD, 8'hD5);
        check_glitch_data(200, 1, 3 * BAUD_BIT_PERIOD, 8'h55);
        check_glitch_data(200, 1, 12 * BAUD_BIT_PERIOD, 8'h55);
        res_pass[5] = (g_fail == 0);
        res_note[5] = g_pass;
        $display("--------------------------------------------------------------------");
        $display("[S5] START glitch regression : %0s", res_pass[5] ? "PASS" : "FAIL");
        $display("     pass %0d / fail %0d", g_pass, g_fail);
        $display("--------------------------------------------------------------------");

        // ---------------------------------------------------------------- summary
        $display("");
        $display("==================== SUMMARY ====================");
        $display(" S1 FIFO unit                  : %0s  (%0d steps)", res_pass[1] ? "PASS" : "FAIL", res_note[1]);
        $display(" S2 single byte echo           : %0s  (%0d / 256)", res_pass[2] ? "PASS" : "FAIL", res_note[2]);
        $display(" S3 9600 bps back-to-back      : %0s  (%0d / 256)", res_pass[3] ? "PASS" : "FAIL", res_note[3]);
        $display(" S4 worst case (PC = FPGA)     : %0s  (%0d / 256)", res_pass[4] ? "PASS" : "FAIL", res_note[4]);
        $display(" S5 START glitch regression    : %0s  (%0d / 23)", res_pass[5] ? "PASS" : "FAIL", res_note[5]);
        $display("=================================================");
        $stop;
    end
endmodule
