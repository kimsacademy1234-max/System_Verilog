`timescale 1ns / 1ps


module UART_TX(

input i_clk,
input i_reset,
input i_TX_Start,
input [7:0] i_TX_data,
input i_b_tick,
output reg o_tx_busy, 
output reg o_tx


);

typedef enum{

IDLE = 0 ,
START =1 ,
BIT0 = 2 ,
BIT1 = 3 ,
BIT2 = 4 ,
BIT3 = 5 ,
BIT4 = 6 ,
BIT5 = 7 ,
BIT6 = 8 ,
BIT7 = 9 ,
STOP = 10 



} state_t;

state_t state , n_state; 

reg  tx_reg, tx_next;
reg  tx_busy,tx_busy_next;


always@(posedge i_clk or posedge i_reset)begin


if(i_reset)begin
	state <= IDLE;
	tx_reg <= 1;
	tx_busy <=0;
end
else begin
	
	state <= n_state;
	tx_reg <= tx_next;
	tx_busy <= tx_busy_next;
end


end




always@(*)begin

		n_state = state;
		
	    tx_next = tx_reg;
    	tx_busy_next = tx_busy;
		case(state)

		IDLE  : begin n_state = (i_TX_Start)?  START : IDLE ; tx_next =  1; tx_busy_next = 0; end 
		START : begin n_state = (i_b_tick)?		BIT0 : START; tx_next =  0; tx_busy_next = 0; end
		BIT0  : begin n_state = (i_b_tick)?		BIT1 : BIT0 ; tx_next =  i_TX_data[0]; tx_busy_next = 1  ; end 
		BIT1  : begin n_state = (i_b_tick)?		BIT2 : BIT1 ; tx_next =  i_TX_data[1]; tx_busy_next = 1  ; end
		BIT2  : begin n_state = (i_b_tick)?		BIT3 : BIT2 ; tx_next =  i_TX_data[2]; tx_busy_next = 1  ; end
		BIT3  : begin n_state = (i_b_tick)?		BIT4 : BIT3 ; tx_next =  i_TX_data[3]; tx_busy_next = 1  ; end
		BIT4  : begin n_state = (i_b_tick)?		BIT5 : BIT4 ; tx_next =  i_TX_data[4]; tx_busy_next = 1  ; end
		BIT5  : begin n_state = (i_b_tick)?		BIT6 : BIT5 ; tx_next =  i_TX_data[5]; tx_busy_next = 1  ; end
		BIT6  : begin n_state = (i_b_tick)?		BIT7 : BIT6 ; tx_next =  i_TX_data[6]; tx_busy_next = 1  ; end
		BIT7  : begin n_state = (i_b_tick)?		STOP : BIT7 ; tx_next =  i_TX_data[7]; tx_busy_next = 1  ; end
		STOP  : begin n_state = (i_b_tick)?		IDLE : STOP ; tx_next =  1 ; tx_busy_next = 0  ; end

		endcase	

end
assign o_tx_busy = tx_busy;
assign o_tx = tx_reg;


endmodule
