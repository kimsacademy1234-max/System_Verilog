`timescale 1ns / 1ps


module b_tick_gen#( parameter TICK_FRQ =1000 
)(
input logic clk,
input logic rst,
output logic b_tick
);


parameter FCOUNT = (100_000_000/TICK_FRQ); 
logic [$clog2(FCOUNT)-1 :0] r_counter;

always@(posedge clk or posedge rst)begin
	if(rst)begin
		r_counter <= 0;
		b_tick <= 0;
	end
	else begin
			r_counter <= r_counter + 1;
			if(r_counter == FCOUNT -1)begin
				r_counter <= 0;
				b_tick <= 1;
			end
			else begin
				b_tick <= 0;
			end
	end
				 

end


endmodule

