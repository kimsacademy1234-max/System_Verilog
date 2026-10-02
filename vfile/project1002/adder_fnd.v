`timescale 1ns / 1ps


module adder_fnd(


input [3:0] bin,
output [7:0] fnd_font


);



reg [7:0] w_fnd_font;  // or input reg decision!

	always@(bin)begin 
		case(bin)

			4'h0: w_fnd_font = 8'hC0; 			
			4'h1: w_fnd_font = 8'hF9;			
			4'h2: w_fnd_font = 8'hA4;
			4'h3: w_fnd_font = 8'hB0;
			4'h4: w_fnd_font = 8'h99;
			4'h5: w_fnd_font = 8'h92;
			4'h6: w_fnd_font = 8'h82;
			4'h7: w_fnd_font = 8'hF8;
			4'h8: w_fnd_font = 8'h80;
			4'h9: w_fnd_font = 8'h90;
			4'hA: w_fnd_font = 8'h88;
			4'hB: w_fnd_font = 8'h83;
			4'hC: w_fnd_font = 8'hC6;
			4'hD: w_fnd_font = 8'hA1;
			4'hE: w_fnd_font = 8'h86;
			4'hF: w_fnd_font = 8'h8E;
			default : w_fnd_font = 8'hFF;
		endcase

	end


assign fnd_font = w_fnd_font ;




endmodule
