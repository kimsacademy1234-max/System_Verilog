`timescale 1ns / 1ps


module Digit_spliter(

	input [8:0] i_D,
	
	output[3:0] o_ds_1, 
	output[3:0] o_ds_2,
	output[3:0] o_ds_3,
	output[3:0] o_ds_4


);


//reg [8:0] r_ds_1 ;
//reg [8:0] r_ds_2 ;
//reg [8:0] r_ds_3 ;
//reg [8:0] r_ds_4 ;
//
//
//always@(*)begin

assign o_ds_1 = i_D%10;
assign o_ds_2 = (i_D/10)%10;
assign o_ds_3 = (i_D/100)%10;
assign o_ds_4 = (i_D/1000)%10;

//end





//assign o_ds_1 = r_ds_1[3:0]; 
//assign o_ds_2 = r_ds_2[3:0];
//assign o_ds_3 = r_ds_3[3:0];
//assign o_ds_4 = r_ds_4[3:0]; 



endmodule
