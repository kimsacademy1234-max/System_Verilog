`timescale 1ns / 1ps


module fnd_decoder(

input [3:0] i_fnd_hex,
output reg [7:0] o_fnd_data

);


	always@(*)begin 
		case(i_fnd_hex)

			4'h0: o_fnd_data = 8'hC0; 			
			4'h1: o_fnd_data = 8'hF9;			
			4'h2: o_fnd_data = 8'hA4;
			4'h3: o_fnd_data = 8'hB0;
			4'h4: o_fnd_data = 8'h99;
			4'h5: o_fnd_data = 8'h92;
			4'h6: o_fnd_data = 8'h82;
			4'h7: o_fnd_data = 8'hF8;
			4'h8: o_fnd_data = 8'h80;
			4'h9: o_fnd_data = 8'h90;

			4'hA: o_fnd_data = 8'h88 ;
			4'hB: o_fnd_data = 8'h83 ;
			4'hC: o_fnd_data = 8'hC6 ;
			4'hD: o_fnd_data = 8'hA1 ;
			4'hE: o_fnd_data = 8'h86 ;
			4'hF: o_fnd_data = 8'h8E ;




			default : o_fnd_data = 8'hFF;
		endcase

	end



endmodule
