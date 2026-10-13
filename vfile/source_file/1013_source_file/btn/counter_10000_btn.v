`timescale 1ns / 1ps
//==============================================================================
// Module      : top_adder_fnd_8bit
// Description : 8-bit adder 결과(0~510)를 10진수로 분리해 i_sel로 고른
//               자리를 FND에 표시하는 top
// Depends on  : full_adder_8bit, digit_splitter, mux_4x1, decoder_2x4,
//               fnd_decoder
//==============================================================================








/* 001 stop   010 clear  100 mode   */



module counter_10000_v2
(
    input  i_clk,
    input  i_reset,
    input i_btn_L, // clear 
	input i_btn_R, // run_stop
	input i_btn_U, // 이것만 따로 처리한다.
    output wire [3:0] o_fnd_com,
    output wire [7:0] o_fnd_data




);




wire [3:0] w_hex;
wire [3:0] w_digit_1;
wire [3:0] w_digit_10;
wire [3:0] w_digit_100;
wire [3:0] w_digit_1000;
wire w_clk_1kHz;
wire [13:0] w_counter;  /// 9999 = 10k -> 14bit 
wire w_tic;



wire w_btn_L;
wire w_btn_R;
wire w_btn_U;




wire  w_run_stop; //run-stop	
wire  w_clear;//clear
wire  w_mode; //up_down





button_debouncer_1MHz DUT_BTN_L(
.i_clk   (i_clk),
.i_reset (i_reset),
.i_btn	 (i_btn_L),
.o_btn   (w_btn_L)
);

button_debouncer_1MHz DUT_BTN_R(
.i_clk   (i_clk),
.i_reset (i_reset),
.i_btn	 (i_btn_R),
.o_btn   (w_btn_R)
);




button_debouncer_1MHz DUT_BTN_U(
.i_clk   (i_clk),
.i_reset (i_reset),
.i_btn	 (i_btn_U),
.o_btn   (w_btn_U)
);





FSM_RUN_STOP uut(

    .i_clk(i_clk),
    .i_reset(i_reset),
    .i_btn_U(w_btn_U),
	.o_run_stop(w_run_stop), 	
	.o_clear(w_clear), 
	.o_mode(w_mode), 
    .i_btn_L(w_btn_L), // clear 
	.i_btn_R(w_btn_R) // run_stop
	

);





counter_datapath_v2 #(
		.OFFSET(0)
) U_CNT_DATA(

 	.i_clk 		(i_clk),			
	.i_reset	(i_reset),
	.i_run_stop    (w_run_stop), 	
	.i_clear    (w_clear), 
	.i_mode    (w_mode ),
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












































