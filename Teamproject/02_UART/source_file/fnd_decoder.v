`timescale 1ns / 1ps


module fnd_decoder(

input [7:0] i_fnd_hex,
output reg [7:0] o_fnd_data

);


	always@(*)begin 
		case(i_fnd_hex)

			8'h00: o_fnd_data = 8'hC0;//1010_0000 			
			8'h01: o_fnd_data = 8'hF9;			
			8'h02: o_fnd_data = 8'hA4;
			8'h03: o_fnd_data = 8'hB0;
			8'h04: o_fnd_data = 8'h99;
			8'h05: o_fnd_data = 8'h92;
			8'h06: o_fnd_data = 8'h82;
			8'h07: o_fnd_data = 8'hF8;
			8'h08: o_fnd_data = 8'h80;
			8'h09: o_fnd_data = 8'h90;

			8'h0A: o_fnd_data = 8'h88 ;
			8'h0B: o_fnd_data = 8'h83 ;
			8'h0C: o_fnd_data = 8'hC6 ;
			8'h0D: o_fnd_data = 8'hA1 ;
			8'h0E: o_fnd_data = 8'h86 ;
			8'h0F: o_fnd_data = 8'h8E ;
 
			default : o_fnd_data = 8'hBF; //1011_1111
		endcase

	end



endmodule
