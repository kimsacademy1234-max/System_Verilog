`timescale 1ns / 1ps


module mux4_1(


	input[1:0] sel,
	input[3:0] i_ds_1,	
	input[3:0] i_ds_2,
	input[3:0] i_ds_3,
	input[3:0] i_ds_4,
	output reg [3:0]fnt_out


);


always@(*)begin

	case(sel)
		2'b00 : fnt_out = i_ds_1; 	
		2'b01 : fnt_out = i_ds_2; 
		2'b10 : fnt_out = i_ds_3;
		2'b11 : fnt_out = i_ds_4;

	endcase 


end




endmodule
