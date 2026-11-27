`timescale 1ns / 1ps


module uart_top (
    input clk,
    input rst,
    input rx, // from PC
	input tx_start,
	input [7:0] tx_data,
    output tx,
	output tx_busy,
	output [7:0] rx_data,
	output rx_done


	// 아스키


);

    wire w_b_tick ;



    uart_rx U_UART_RX (
        .clk    (clk),
        .rst    (rst),
        .b_tick (w_b_tick),
        .rx     (rx),
        .rx_data(rx_data),
        .rx_done(rx_done)
    );
    
	uart_tx U_UART_TX (
        .clk     (clk),
        .rst     (rst),
        .tx_start(tx_start),
        .tx_data (tx_data),
        .b_tick  (w_b_tick),
        .tx      (tx),
        .tx_busy (tx_busy)
    );



    baud_tick_gen U_BAUD_TICK_GEN (
        .clk   (clk),
        .rst   (rst),
        .b_tick(w_b_tick)
    );






endmodule


module baud_tick_gen (
    input      clk,
    input      rst,
    output reg b_tick
);
    // 100Mhz -> 153,600 Hz (9600hz * 16)
    parameter F_COUNT = 100_000_000 / (9600 * 16);
    reg [$clog2(F_COUNT)-1:0] counter_reg;

    always @(posedge clk, posedge rst) begin
        if (rst) begin
            counter_reg <= 0;
            b_tick      <= 1'b0;
        end else begin
            counter_reg <= counter_reg + 1;
            if (counter_reg == F_COUNT - 1) begin
                counter_reg <= 0;
                b_tick      <= 1'b1;
            end else begin
                b_tick <= 1'b0;
            end
        end
    end
endmodule










