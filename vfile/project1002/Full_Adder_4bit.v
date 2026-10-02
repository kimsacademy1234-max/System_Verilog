`timescale 1ns / 1ps






module Full_Adder_4bit(

		input [3:0] i_a,	
		input [3:0] i_b,
		input i_cin,
		
		output o_c_out,
		output [3:0] o_s


);



wire w_c1;
wire w_c2;
wire w_c3;
wire w_c4;



Full_Adder U_HA1(

.i_a(i_a[0]),
.i_b(i_b[0]),
.i_cin(i_cin),
.o_s(o_s[0]),
.o_c(w_c1)

);

Full_Adder U_HA2(

.i_a(i_a[1]),
.i_b(i_b[1]),
.i_cin(w_c1),
.o_s(o_s[1]),
.o_c(w_c2)

);
Full_Adder U_HA3(

.i_a(i_a[2]),
.i_b(i_b[2]),
.i_cin(w_c2),
.o_s(o_s[2]),
.o_c(w_c3)

);

Full_Adder U_HA4(

.i_a(i_a[3]),
.i_b(i_b[3]),
.i_cin(w_c3),
.o_s(o_s[3]),
.o_c(w_c4)

);


assign o_c_out = w_c4;



endmodule




























