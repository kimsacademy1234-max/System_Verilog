`timescale 1ns / 1ps



module counter_datapath(
input i_clk, 	
input i_reset,

output [13:0] o_counter


);

wire w_tic;

tick_counter TICK(


.i_clk(i_clk),
.i_reset(i_reset),
.i_tick(w_tic),
.o_counter(o_counter)

);

tick_gen GEN(


 .i_clk(i_clk),
 .i_reset(i_reset),
 .o_tic(w_tic)


	
);



endmodule




///////////////////////////////////////////////////////////////////

module tick_gen(

input i_clk,
input i_reset,
output reg o_tic

);

parameter FCOUNT = 100_000_00;
reg [$clog2(FCOUNT)-1 :0] r_counter;


always@(posedge i_clk or posedge i_reset)begin

	if(i_reset)begin
		r_counter <= 0;
		o_tic <= 0;
	end

	else begin
		r_counter <= r_counter +1;
		if(r_counter == FCOUNT -1)begin
			r_counter <= 0;
			o_tic <= 1;
		end 
		
		else begin
			o_tic <= 0;
		end
	

	end


end

endmodule

//////////////////////////////////////////////////////////////////////

module tick_counter(

input i_clk,
input i_reset,
input i_tick,
output reg [13:0] o_counter

);

parameter COUNT = 10000;

always@(posedge i_clk or posedge i_reset)begin



	if(i_reset)begin
		o_counter <= 0;
	end

	else begin
	
		if(i_tick)begin
			o_counter <= o_counter + 1;
			if(o_counter ==COUNT -1)begin
				o_counter <= 0;
			end

		end
		
	end



end


endmodule

















