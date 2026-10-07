`timescale 1ns / 1ps



module counter_datapath_v2(
input i_clk, 	
input i_reset,

input  i_sw0, //run-stop	
input  i_sw1, //clear
input  i_sw2, //up_down

output [13:0] o_counter


);

wire w_tic;

tick_counter TICK(


.i_sw0(i_sw0), //run-stop	
.i_sw1(i_sw1), //clear
.i_sw2(i_sw2), //up_down


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

input i_sw0,
input i_sw1,
input i_sw2,

output reg [13:0] o_counter

);

parameter COUNT = 10000;

always@(posedge i_clk or posedge i_reset)begin



	if(i_reset)begin
		o_counter <= 0;
	end

	else begin
	
		if(i_tick)begin
			
			case({i_sw2,i_sw1,i_sw0})
				
				3'b001 : begin 
					o_counter <= o_counter;
				end
				
				3'b101 : begin 
					o_counter <= o_counter;
				end

//////////////////////////////////////////////
				3'b010 : begin
					o_counter <= 0; 
				end


				3'b011 : begin
					o_counter <= 0; 
				end

				3'b110 : begin
					o_counter <= 0; 
				end

				
				3'b111 : begin
					o_counter <= 0; 
				end
//////////////////////////////////////////////

				3'b100 : begin

					if(o_counter == 0)begin o_counter <= 9999; end
					else begin o_counter <= o_counter -1 ; end

				end
	
				default : begin	

					o_counter <= o_counter + 1;
					if(o_counter ==COUNT -1)begin o_counter <= 0; end
				end

			
			endcase 

		end
	end


end



endmodule

















