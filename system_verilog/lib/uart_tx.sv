`timescale 1ns / 1ps


module uart_tx(


input logic [7:0] Tx_data,
input b_tick,
input rst,

output Tx_busy,
output Tx


);

typedef enum{



}state_t 


















endmodule






module baud_tic_gen#(

	parameter BAUD_RATE = 9600*16 

)
(

input logic clk,	
input logic	rst,
output logic  b_tick

);



parameter COUNT = 100_000_000/BAUD_RATE;

logic [$clog2(COUNT)-1:0] count_reg;

always_ff@(posedge clk , posedge rst)begin


	if(rst)begin
			count_reg <= 0;
	end

	else begin
			if(count_reg == COUNT - 1)begin
				count_reg <=0 ; b_tick <= 1;
			end
			count_reg <= count_reg + 1;
			
	end



	end




endmodule
