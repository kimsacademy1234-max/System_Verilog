`timescale 1ns / 1ps


module adder_fnd(

input [7:0] bin,
output[7:0] fnd_font


);



reg [7:0] w_fnd_font;  // or input reg decision!

	always@(bin)begin 
		case(bin)

			8'h00: w_fnd_font = 8'hC0; 			
			8'h01: w_fnd_font = 8'hF9;			
			8'h02: w_fnd_font = 8'hA4;
			8'h03: w_fnd_font = 8'hB0;
			8'h04: w_fnd_font = 8'h99;
			8'h05: w_fnd_font = 8'h92;
			8'h06: w_fnd_font = 8'h82;
			8'h07: w_fnd_font = 8'hF8;
			8'h08: w_fnd_font = 8'h80;
			8'h09: w_fnd_font = 8'h90;
			8'h0A: w_fnd_font = 8'h88;
			8'h0B: w_fnd_font = 8'h83;
			8'h0C: w_fnd_font = 8'hC6;
			8'h0D: w_fnd_font = 8'hA1;
			8'h0E: w_fnd_font = 8'h86;
			8'h0F: w_fnd_font = 8'h8E;
			default : w_fnd_font = 8'hFF;
		endcase

	end


assign fnd_font = w_fnd_font ;


endmodule
