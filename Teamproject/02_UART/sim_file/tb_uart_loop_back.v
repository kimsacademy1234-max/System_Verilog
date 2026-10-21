`timescale 1ns / 1ps

module tb_uart_loopback ();

    parameter BAUD_BIT_PERIOD = 100_000_000 / 9600 * 10;
	parameter MONITER_BIT_PERIOD = 100_000_000 / (9600 * 16);
	parameter DRIVER_BIT_PERIOD = 100_000_000 / (9600 * (16-1));
    // 1 frame = 10 bit, 5단계 256 frame + 여유 → 300 frame
    parameter WATCHDOG_TIMEOUT = 300 * (BAUD_BIT_PERIOD * 10);




	reg clk, rst, rx;
    reg [7:0] result_data, expected_data;
    wire tx;
	wire [7:0] o_rx_data,
	wire o_rx_done

    uart_loopback dut (
        .clk(clk),
        .rst(rst),
        .rx (rx),
        .tx (tx),

		.o_rx_data(o_rx_data),
		.o_rx_done(o_rx_done)

    );

    always #5 clk = ~clk;


//watchdog : 제한시간 초과시 에러 출력 후 강제 종료하는 모듈   - 메인 흐름과 따로 살아 있다가 시간이 넘으면 끼어들어야 함
initial begin
    #(WATCHDOG_TIMEOUT);
    $display("[%0t] ERROR : watchdog timeout", $time);
    $finish;
end

initial begin

	rst = 1;
	rx  = 1; 
	
	repeat(2) @(negedge clk);
	rst = 0; //release




end






initial begin





end




/*
Sender - > rx 모듈에 입력을 넣어준다. 


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

        if (result == expected) $display("pass!!!");
        else $display("fail!!!");

	end

	endtask




    initial begin
        clk  = 0;
        rst  = 1;
        rx = 1;
		// random - 256번 자동 검증 해봐라 ACKII table 전송 해봐라 128개 
		// 이런 상황에 맞춰서 패턴을 다양하게 넣어야 한다. 
		// faster frame, slower frame-> 이런 경우에 대해 테스트 해봐라.
        expected_data = $random()/256;

        #10 rst = 0;

        sender_uart(expected_data);
        receive_uart(result_data);

        #100;
        // to compare result data with expected data 
		score_board(result_data,expected_data);


        $stop;
    end*/
endmodule
