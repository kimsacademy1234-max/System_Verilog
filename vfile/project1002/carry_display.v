`timescale 1ns / 1ps


module carry_display(

	input i_clk,
	input i_reset_n,
	input reg c_out,
	input reg [7:0] fnd_out,


	output reg [7:0] o_fnd_out_final,
	output reg [3:0] o_an	
	
);


reg r_cycle;



always@(posedge i_clk or negedge i_reset_n)begin

	if(!i_reset_n)begin
		
		o_fnd_out_final <= 8'b1100_0000;
		r_cycle <= 1'b0;
		o_an <= 4'b1100;

	end

	else begin 

		if(!r_cycle)begin
			
			o_fnd_out_final <= fnd_out;
			r_cycle <= 1'b0;
			o_an <= 4'b1110;

		end

		else begin
			if(c_out)begin
				o_fnd_out_final <= 8'b1111_1100;
				r_cycle <= 1'b1;
				o_an <= 4'b1101;
			end

			else begin
				o_fnd_out_final <= 8'b1100_0000;
				r_cycle <= 1'b1;
				o_an <= 4'b1101;

			end
		end		
	
	end

end







endmodule
