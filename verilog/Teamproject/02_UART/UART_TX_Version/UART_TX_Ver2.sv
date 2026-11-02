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
DATA = 2,
WAIT = 3,
STOP = 4 

} state_t;

state_t state , n_state; 

reg  tx_reg, tx_next;
reg  tx_busy,tx_busy_next;
reg  [2:0] r_count, r_count_next;
reg [7:0] r_data,r_data_next; 





always@(posedge i_clk or posedge i_reset)begin


if(i_reset)begin
	state <= IDLE;
	r_count <= 0;
	r_data <= 8'h0;
	tx_reg <= 1;
	tx_busy <=0;
end
else begin
	
	state <= n_state;
	r_count <= r_count_next;
	r_data <= r_data_next;
	tx_reg <= tx_next;
	tx_busy <= tx_busy_next;
end


end




always@(*)begin

		n_state = state;
		r_count_next = r_count;
		r_data_next = r_data;
	    tx_next = tx_reg;
    	tx_busy_next = tx_busy;
		case(state)

		IDLE  : begin
					if(i_TX_Start)begin 
						n_state = WAIT;
						tx_next = 0;
						r_data_next = i_TX_data;
						
					end
					
					else begin
						n_state = IDLE;
					tx_next = 1;
					tx_busy_next = 0;	
					end

				end


		WAIT  : begin
					if(i_b_tick)begin 
						n_state = DATA;
					end
					
					else begin
						n_state = WAIT;
					end
				end
		 START  :begin 
					if(i_b_tick)begin
						n_state = DATA;
						r_count_next = 0;
						r_busy_next = 1;
					end

					else begin
						n_state = START;
						tx_next = 0;
					end


				end

		  
		 DATA  :begin
		 			tx_next = r_data[0];
					if(i_b_tick)begin
						r_data_next = {1'b0, r_data_next[7:1]};
						if(r_count ==7)begin
						n_state = STOP;
						r_busy_next = 0;
						r_count_next = 0;
						end

						else begin
						n_state = DATA;
						r_count_next =r_count_next + 1;
						end
					end

					else begin 
						n_state = DATA;

					end


				end

		STOP : begin
					tx_next = 1;
					if(i_b_tick)begin
						n_state = IDLE;
					end

					else begin
						n_state = STOP;
					end
				end		



		endcase	

end
assign o_tx_busy = tx_busy;
assign o_tx = tx_reg;


endmodule




		endcase	

end
assign o_tx_busy = tx_busy;
assign o_tx = tx_reg;


endmodule
