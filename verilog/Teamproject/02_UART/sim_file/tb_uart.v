`timescale 1ns / 1ps

module tb_uart ();

    parameter BAUD_BIT_PERIOD = 100_000_000 / 9600 * 10;
    parameter RUN_START_GLITCH = 1;  // start glitch test
    parameter RUN_DATA_GLITCH  = 1;  // data bit glitch test

    reg clk, rst, rx;
    reg [7:0] result_data, expected_data;
    wire tx;

	integer i;
	integer err_cnt,pss_cnt;
    integer gw[0:7];
    integer dw[0:3], doff[0:4];
    integer j, k, n;
    time g_at;  // data glitch start time (for the waveform)

    uart_loopback dut (
        .clk(clk),
        .rst(rst),
        .rx (rx),
        .tx (tx)
    );

    always #5 clk = ~clk;
/*
Sender - > rx 모듈에 입력을 넣어준다. 




*/

// chattering 이 후 데이터를 보냈을 경우 -> 이 노이즈를 무시할 수 있는지 




    // ------------------------------------------------------------------
    // Glitch test
    //  - uart_rx IDLE looks at rx only on the clk edge where b_tick = 1
    //    (sampling edge, every TICK = 1/16 bit = 6510 ns).
    //    A low pulse that covers a sampling edge is taken as a start bit.
    //  - Pass rule (normal UART): a low pulse shorter than 1/2 bit is noise.
    //    -> no rx_done, no tx echo, and the next real byte is received intact.
    // ------------------------------------------------------------------
    localparam TICK = BAUD_BIT_PERIOD / 16;  // 6510 ns

    // monitors: count every rx_done and every tx frame (catch phantom frames)
    integer rx_done_cnt, tx_frame_cnt;
    reg [7:0] rx_last, tx_last;

    always @(posedge clk) begin
        if (dut.o_rx_done) begin
            rx_done_cnt = rx_done_cnt + 1;
            rx_last     = dut.o_rx_data;
        end
    end

    always begin : TX_MON
        integer b;
        @(negedge tx);
        #(BAUD_BIT_PERIOD / 2);
        for (b = 0; b < 8; b = b + 1) begin
            #(BAUD_BIT_PERIOD);
            tx_last[b] = tx;
        end
        #(BAUD_BIT_PERIOD);
        tx_frame_cnt = tx_frame_cnt + 1;
    end

    // num low pulses of 'width' ns, 'gap' ns high between them, rx = 1 at the end
    task sender_glitch(input integer width, input integer num, input integer gap);
        integer k;
        begin
            for (k = 0; k < num; k = k + 1) begin
                rx = 0;
                #(width);
                rx = 1;
                if (k < num - 1) #(gap);
            end
        end
    endtask

    // place the first glitch edge relative to a sampling edge
    // (sampling edge = 10 ns after b_tick rises)
    //  on_tick = 1 : glitch centered on a sampling edge
    //  on_tick = 0 : glitch starts 3 ns after a sampling edge
    task align_glitch(input integer width, input on_tick);
        begin
            @(posedge dut.w_b_tick);
            if (on_tick) #(5 * TICK + 10 - width / 2 + 2);
            else #(10 + 3);
        end
    endtask

    integer g_pass, g_fail;

    // glitch only: expect no rx_done and no tx echo
    task check_glitch(input integer width, input integer num, input integer gap, input on_tick);
        integer rx0, tx0;
        begin
            align_glitch(width, on_tick);
            rx0 = rx_done_cnt;
            tx0 = tx_frame_cnt;
            sender_glitch(width, num, gap);
            #(BAUD_BIT_PERIOD * 25);  // phantom RX (9.5 bit) + its echo (10 bit) are over
            if (rx_done_cnt == rx0 && tx_frame_cnt == tx0) begin
                g_pass = g_pass + 1;
                $display("%0d ns : PASS glitch w=%0d ns x%0d gap=%0d %s : ignored",
                         $time, width, num, gap, on_tick ? "on-tick " : "off-tick");
            end else begin
                g_fail = g_fail + 1;
                $display("%0d ns : FAIL glitch w=%0d ns x%0d gap=%0d %s : rx_done %0d (last %h), tx echo %0d (last %h)",
                         $time, width, num, gap, on_tick ? "on-tick " : "off-tick",
                         rx_done_cnt - rx0, rx_last, tx_frame_cnt - tx0, tx_last);
            end
        end
    endtask

    // glitch, 'gap' ns idle, then a real byte: expect exactly that byte once on rx and tx
    task check_glitch_data(input integer width, input on_tick, input integer gap, input [7:0] data);
        integer rx0, tx0;
        begin
            align_glitch(width, on_tick);
            rx0 = rx_done_cnt;
            tx0 = tx_frame_cnt;
            sender_glitch(width, 1, 0);
            #(gap);
            sender_uart(data);
            #(BAUD_BIT_PERIOD * 25);
            if (rx_done_cnt == rx0 + 1 && rx_last == data && tx_frame_cnt == tx0 + 1 && tx_last == data) begin
                g_pass = g_pass + 1;
                $display("%0d ns : PASS glitch w=%0d ns %s + %0d ns + data %h : received %h",
                         $time, width, on_tick ? "on-tick " : "off-tick", gap, data, rx_last);
            end else begin
                g_fail = g_fail + 1;
                $display("%0d ns : FAIL glitch w=%0d ns %s + %0d ns + data %h : rx_done %0d (last %h), tx echo %0d (last %h)",
                         $time, width, on_tick ? "on-tick " : "off-tick", gap, data,
                         rx_done_cnt - rx0, rx_last, tx_frame_cnt - tx0, tx_last);
            end
        end
    endtask

    // ------------------------------------------------------------------
    // Data bit glitch test
    //  - frame starts 3 ns before a sampling edge -> start detected 3 ns late,
    //    so uart_rx samples data bit k at (sender bit k center + 3 ns)
    //  - one glitch per frame on data bit 'gbit', opposite level of that bit,
    //    centered at (bit center + goff), width gw
    //  - pass rule: glitch shorter than 1 tick (6510 ns) is noise
    //    -> exactly one rx_done and one tx echo, both == sent byte
    // ------------------------------------------------------------------
    task sender_uart_data_glitch(input [7:0] send_data, input integer gbit, input integer goff, input integer gw);
        integer b, gs;
        begin
            gs = BAUD_BIT_PERIOD / 2 + goff - gw / 2;  // glitch start from bit start
            rx = 0;  // start bit
            #(BAUD_BIT_PERIOD);
            for (b = 0; b < 8; b = b + 1) begin
                rx = send_data[b];
                if (b == gbit) begin
                    #(gs);
                    g_at = $time;
                    rx = ~send_data[b];
                    #(gw);
                    rx = send_data[b];
                    #(BAUD_BIT_PERIOD - gs - gw);
                end else begin
                    #(BAUD_BIT_PERIOD);
                end
            end
            rx = 1;  // stop bit
            #(BAUD_BIT_PERIOD);
        end
    endtask

    // start edge 3 ns before the next sampling edge
    task align_frame;
        begin
            @(posedge dut.w_b_tick);
            #(TICK + 10 - 3);
        end
    endtask

    integer d_pass, d_fail;

    // print only failures: where the glitch was, expected vs actual
    task check_data_glitch(input [7:0] data, input integer gbit, input integer goff, input integer gw);
        integer rx0, tx0;
        begin
            align_frame;
            rx0 = rx_done_cnt;
            tx0 = tx_frame_cnt;
            sender_uart_data_glitch(data, gbit, goff, gw);
            #(BAUD_BIT_PERIOD * 12);  // echo is over
            if (rx_done_cnt == rx0 + 1 && rx_last == data && tx_frame_cnt == tx0 + 1 && tx_last == data) begin
                d_pass = d_pass + 1;
            end else begin
                d_fail = d_fail + 1;
                $display("[FAIL %0d] data %h, bit %0d glitch %b->%b, width %0d ns, offset %0d tick from bit center, glitch at %0d ns",
                         d_fail, data, gbit, data[gbit], ~data[gbit], gw, goff / TICK, g_at);
                $display("    expected : %h (%b)", data, data);
                $display("    rx_data  : %h (%b)   rx_done x%0d", rx_last, rx_last, rx_done_cnt - rx0);
                $display("    tx echo  : %h (%b)   frame   x%0d", tx_last, tx_last, tx_frame_cnt - tx0);
                $display("    diff     :    (%b)   (b7..b0, 1 = wrong bit)", data ^ rx_last);
            end
        end
    endtask 
            
            


    task sender_uart_rx_chattering(input [7:0] send_data);
        integer i;
        begin
            rx = 1; // start bit
            for(i= 0; i< 5; i = i+1)begin
                #(BAUD_BIT_PERIOD/16);
                rx = ~rx;
            end
            

            #(BAUD_BIT_PERIOD);
            // check start bit 0
            for (i = 0; i < 8; i = i + 1) begin
                rx = send_data[i];
                #(BAUD_BIT_PERIOD);
            end
            rx = 1;  // stop bit
            #(BAUD_BIT_PERIOD);
        end
    endtask






    task sender_uart(input [7:0] send_data);
        integer i;
        begin
            rx = 0;  // start bit
            #(BAUD_BIT_PERIOD);
            // check start bit 0
            for (i = 0; i < 8; i = i + 1) begin
                rx = send_data[i];
                #(BAUD_BIT_PERIOD);
            end
            rx = 1;  // stop bit
            #(BAUD_BIT_PERIOD);
        end
    endtask

    task receive_uart(output [7:0] rx_data);
        integer i;
        begin
            wait (~tx);
            #(BAUD_BIT_PERIOD / 2);
            // check start bit 0. 중간 지점에서 start bit가 아직 0인지 확인.
            if (tx != 0) begin
                $display("error start bit error");
            end
            for (i = 0; i < 8; i = i + 1) begin
                #(BAUD_BIT_PERIOD);
                rx_data[i] = tx;
            end
            #(BAUD_BIT_PERIOD);
            if (!tx) $display("error stop bit");

        end
    endtask


	task score_board(input [7:0] result,expected);
	begin

        if (result !== expected)begin
			
			err_cnt = err_cnt +1;
			$display("%04d ns : ERROR - Result Data : %d / Expect data : %d",$time,result,expected);end 
            else pss_cnt = pss_cnt +1; 	


	end

	endtask





    initial begin
		err_cnt = 0; pss_cnt = 0;
        rx_done_cnt = 0; tx_frame_cnt = 0;
        clk  = 0;
        rst  = 1;
        rx = 1;
		// random - 256번 자동 검증 해봐라 ACKII table 전송 해봐라 128개 
		// 이런 상황에 맞춰서 패턴을 다양하게 넣어야 한다. 
		// faster frame, slower frame-> 이런 경우에 대해 테스트 해봐라.

        #10 rst = 0;

		for(i=0; i<256; i=i+1)begin
		expected_data = i;
        sender_uart(expected_data);
        receive_uart(result_data);
        #100;
        // to compare result data with expected data 
		score_board(result_data,expected_data);
		end
		

        $display("INPUT for 256 case Result");
        $display("%d case  pass : %d  fail : %d ",i,pss_cnt,err_cnt);


        $stop;
        $display("glitch test start");

        // ---------------- glitch test ----------------
        g_pass = 0; g_fail = 0;
        if (RUN_START_GLITCH) begin
        gw[0] = 20;   gw[1] = 200;      gw[2] = 2000;              gw[3] = 6000;
        gw[4] = TICK; gw[5] = 2 * TICK; gw[6] = BAUD_BIT_PERIOD / 4; gw[7] = 50000;

        $display("---- single glitch (expect: ignored) ----");
        for (i = 0; i < 8; i = i + 1) begin
            check_glitch(gw[i], 1, 0, 0);
            check_glitch(gw[i], 1, 0, 1);
        end

        $display("---- glitch burst / chattering (expect: ignored) ----");
        check_glitch(200, 5, 1000, 0);   // 5.0 us burst inside one tick gap
        check_glitch(1000, 8, 1000, 0);  // 15.0 us burst, one pulse covers a sampling edge

        $display("---- glitch then real byte (expect: byte received once) ----");
        check_glitch_data(200, 0, BAUD_BIT_PERIOD, 8'h55);       // glitch missed
        check_glitch_data(200, 1, BAUD_BIT_PERIOD, 8'h55);       // byte arrives inside phantom frame, D7 = 0
        check_glitch_data(200, 1, BAUD_BIT_PERIOD, 8'hD5);       // same, D7 = 1
        check_glitch_data(200, 1, 3 * BAUD_BIT_PERIOD, 8'h55);
        check_glitch_data(200, 1, 12 * BAUD_BIT_PERIOD, 8'h55);  // phantom frame already over

        $display("GLITCH Result  pass : %0d  fail : %0d", g_pass, g_fail);
        end

        // ---------------- data bit glitch test ----------------
        d_pass = 0; d_fail = 0;
        dw[0] = 20; dw[1] = 200; dw[2] = 2000; dw[3] = 6000;   // all < 1 tick
        doff[0] = -7 * TICK; doff[1] = -TICK; doff[2] = 0; doff[3] = TICK; doff[4] = 7 * TICK;
        if (RUN_DATA_GLITCH) begin
            $display("---- data bit glitch (expect: data kept) ----");
            for (n = 0; n < 2; n = n + 1)          // 0x55 / 0xAA: every bit gets both levels
                for (j = 0; j < 4; j = j + 1)
                    for (k = 0; k < 5; k = k + 1)
                        for (i = 0; i < 8; i = i + 1)
                            check_data_glitch(n ? 8'hAA : 8'h55, i, doff[k], dw[j]);
            $display("==== DATA GLITCH : %0d case  pass %0d  fail %0d ====", d_pass + d_fail, d_pass, d_fail);
        end
       
		
		


        $stop;

    end
endmodule
