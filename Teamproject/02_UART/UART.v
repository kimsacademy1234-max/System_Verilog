`timescale 1ns / 1ps



module UART(

input [7:0] i_tx_data,
input i_clk,	
input i_reset,
input i_btnR,
output o_rstx,
output o_TX_busy


);



wire w_b_tick;
wire w_TX_Start;



UART_TX U_UART_TX(

.i_clk(i_clk),
.i_reset(i_reset),
.i_TX_data(i_tx_data),
.i_TX_Start(w_TX_Start),
.i_b_tick(w_b_tick),
.o_tx_busy(o_TX_busy), 
.o_tx(o_rstx)
);

clock_tick_generator#(
	.CLK_FRQ(9600)
) U_CLK_GEN_9600(

.i_clk(i_clk),
.i_reset(i_reset),
.o_clk(w_b_tick)

);


button_debouncer U_BTN_DEBOUNCE(


.i_clk(i_clk),
.i_reset(i_reset),
.i_btn(i_btnR),
.o_btn(w_TX_Start)


);







endmodule
