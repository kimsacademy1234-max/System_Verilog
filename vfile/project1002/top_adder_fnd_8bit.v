`timescale 1ns / 1ps


module top_adder_fnd_8bit(

input [1:0] i_sel,
input [7:0] i_a, 
input [7:0] i_b,


output [3:0] o_an,
output [7:0]fnd_out



);

wire [7:0] w_sum;
wire w_cout;



wire [3:0] w_ds_1;
wire [3:0] w_ds_2;
wire [3:0] w_ds_3;
wire [3:0] w_ds_4;
wire [3:0] w_mux_out;
wire [7:0] w_fnd_out;
wire [3:0] w_an;

Full_Adder_8bit ADD (

		 .i_a(i_a),	
		 .i_b(i_b),
		 .i_cin(1'b0),
		 .o_c_out(w_cout),
		 .o_s(w_sum)
);

Digit_spliter SPLIT (

	.i_D({w_cout,w_sum}),
	.o_ds_1(w_ds_1),
	.o_ds_2(w_ds_2),
	.o_ds_3(w_ds_3),
	.o_ds_4(w_ds_4)

);


mux4_1 MUX(

     		
	 .sel(i_sel),
	 .i_ds_1(w_ds_1),	
	 .i_ds_2(w_ds_2),
	 .i_ds_3(w_ds_3),
	 .i_ds_4(w_ds_4),
	 .fnt_out(w_mux_out)
		
     		
);

  

decoder2x4 Decoder(

.i_sel(i_sel),	
.o_an(w_an)

);



adder_fnd DUT_1(

	.bin({4'b0000, w_mux_out}),
	.fnd_font(w_fnd_out)


	);

assign o_an = w_an;
assign fnd_out = w_fnd_out;
assign Dp = w_fnd_out[7];
assign o_cout = w_cout;


endmodule
