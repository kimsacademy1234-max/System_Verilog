`timescale 1ns / 1ps


module Full_Adder_8bit(



		


		input [7:0] i_a,	
		input [7:0] i_b,
		input i_cin,
		
		output o_c_out, 
		output [7:0] o_s
//		output [6:0] seg,
//		output [3:0] an

);



//reg [6:0] r_txt = 7'b1000_110;


wire w_fc;
wire w_c;



//assign an = 4'b1110;
//assign seg = w_fc ? r_txt : 7'b1111_111;
assign o_c_out = w_fc;


Full_Adder_4bit DUT_1(

		 .i_a(i_a[3:0]),	
		 .i_b(i_b[3:0]),
		 .i_cin(i_cin),
		
		 .o_c_out(w_c),
		 .o_s(o_s[3:0])
		);



Full_Adder_4bit DUT_2(

		 .i_a(i_a[7:4]),	
		 .i_b(i_b[7:4]),
		 .i_cin(w_c),
		
		 .o_c_out(w_fc),
		 .o_s(o_s[7:4])
		);








endmodule
