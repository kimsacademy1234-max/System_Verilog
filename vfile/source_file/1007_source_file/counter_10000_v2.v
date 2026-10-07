`timescale 1ns / 1ps
//==============================================================================
// Module      : top_adder_fnd_8bit
// Description : 8-bit adder 결과(0~510)를 10진수로 분리해 i_sel로 고른
//               자리를 FND에 표시하는 top
// Depends on  : full_adder_8bit, digit_splitter, mux_4x1, decoder_2x4,
//               fnd_decoder
//==============================================================================

module counter_10000_v2
(
    input  i_clk,
    input  i_reset,
	input  i_sw0, //run-stop	
	input  i_sw1, //clear
	input  i_sw2, //up_down
    output wire [3:0] o_fnd_com,
    output wire [7:0] o_fnd_data,
    output wire [13:0] o_counter,
    output wire         o_tic 


);




wire [3:0] w_hex;
wire [3:0] w_digit_1;
wire [3:0] w_digit_10;
wire [3:0] w_digit_100;
wire [3:0] w_digit_1000;
wire w_clk_1kHz;
wire [13:0] w_counter;  /// 9999 = 10k -> 14bit 
wire w_tic;


assign o_counter = w_counter;
assign o_tic = w_tic;

counter_datapath_v2 #(
		.OFFSET(0)
) U_CNT_DATA(

 	.i_clk 		(i_clk),			
	.i_reset	(i_reset),
	.i_sw0(i_sw0),
	.i_sw1(i_sw1),
	.i_sw2(i_sw2),
	.o_counter(w_counter),
    .o_tic  (w_tic)	


);



digit_splitter #(
    .WIDTH (14)
) U_SPLIT (
    .i_data       (w_counter),
    .o_digit_1    (w_digit_1),
    .o_digit_10   (w_digit_10),
    .o_digit_100  (w_digit_100),
    .o_digit_1000 (w_digit_1000)
);

clock_div U_CLK_DIV(
    .i_clk(i_clk),
    .i_reset_n(~i_reset),
    .o_clk_1kHz(w_clk_1kHz)
);




Fnd_Controller U_FND_CON(

     .i_clk(w_clk_1kHz),
     .i_reset_n(~i_reset),
     .i_digit_1(w_digit_1),
     .i_digit_10(w_digit_10),
     .i_digit_100(w_digit_100),
     .i_digit_1000(w_digit_1000),
     .o_fnd_com(o_fnd_com),    
     .o_hex(w_hex)

        );



fnd_decoder U_FND_DEC (
    .i_hex      (w_hex),
    .o_fnd_data (o_fnd_data)
);

endmodule



/*module counter_datapath(
input i_clk, 	
input i_reset,

output [13:0] o_counter


);

wire w_tic;

tick_counter TICK(


.i_clk(i_clk),
.i_reset(i_reset),
.i_tick(w_tic),
.o_counter(o_counter)

);

tick_gen GEN(


 .i_clk(i_clk),
 .i_reset(i_reset),
 .o_tic(w_tic)


	
);



endmodule




///////////////////////////////////////////////////////////////////

module tick_gen(

input i_clk,
input i_reset,
output reg o_tic

);

parameter FCOUNT = 100_000_00;
reg [$clog2(FCOUNT)-1 :0] r_counter;


always@(posedge i_clk or posedge i_reset)begin

	if(i_reset)begin
		r_counter <= 0;
		o_tic <= 0;
	end

	else begin
		r_counter <= r_counter +1;
		if(r_counter == FCOUNT -1)begin
			r_counter <= 0;
			o_tic <= 1;
		end 
		
		else begin
			o_tic <= 0;
		end
	

	end


end

endmodule

//////////////////////////////////////////////////////////////////////

module tick_counter(

input i_clk,
input i_reset,
input i_tick,
output reg [13:0] o_counter

);

parameter COUNT = 10000;

always@(posedge i_clk or posedge i_reset)begin



	if(i_reset)begin
		o_counter <= 0;
	end

	else begin
	
		if(i_tick)begin
			o_counter <= o_counter + 1;
			if(o_counter ==COUNT -1)begin
				o_counter <= 0;
			end

		end
		
	end



end


endmodule*/












































