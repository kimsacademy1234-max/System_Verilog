`timescale 1ns / 1ps


module top_adder_fnd(

input [3:0] i_a, 
input [3:0] i_b,

output Dp,
output o_cout,
output [3:0] o_an,
output [7:0]fnd_out



);


wire [3:0] w_sum;


assign o_an = 4'b1110;  
assign Dp = fnd_out[7];

Full_Adder_4bit DUT_2 (

		 .i_a(i_a),	
		 .i_b(i_b),
		 .i_cin(1'b0),
		 .o_c_out(o_cout),
		 .o_s(w_sum)
);




adder_fnd DUT_1(

	.bin(w_sum),
	.fnd_font(fnd_out)


	);



endmodule
