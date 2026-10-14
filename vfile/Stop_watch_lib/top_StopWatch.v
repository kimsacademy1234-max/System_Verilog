`timescale 1ns / 1ps


module top_StopWatch(

input i_clk,
input i_reset,
input btnR,
input btnL,
input btnU,
input sw_display_mode,  //display
output [3:0] o_fnd_com,
output [7:0] o_fnd_out

);


wire w_btn_L;
wire w_btn_R;
wire w_btn_U;
wire  w_run_stop; //run-stop	
wire  w_clear;//clear
wire  w_mode; //up_down



button_debouncer DUT_BTN_L(
.i_clk   (i_clk),
.i_reset (i_reset),
.i_btn	 (btnL),
.o_btn   (w_btn_L)
);

button_debouncer DUT_BTN_R(
.i_clk   (i_clk),
.i_reset (i_reset),
.i_btn	 (btnR),
.o_btn   (w_btn_R)
);


button_debouncer DUT_BTN_U(
.i_clk   (i_clk),
.i_reset (i_reset),
.i_btn	 (btnU),
.o_btn   (w_btn_U)
);




Stop_Watch_DataPath U_STOPWATCH_DATA_PATH(

 .i_clk         ( i_clk),
 .i_reset       ( i_reset),
 .i_run_stop    ( w_run_stop), 
 .i_clear       ( w_clear),
 .i_mode        ( w_mode),
 .msec          ( w_msec),
 .sec           ( w_sec),
 .min           ( w_min),
 .hour          ( w_hour)

 );




Contorol_unit U_STOPWATCH_CONTROL_UNIT(

    .i_clk(i_clk),
    .i_reset(i_reset),
	.o_clear(w_clear), 
	.o_mode(w_mode), 
	.o_run_stop(w_run_stop),	
    .i_btn_L(w_btn_L), // clear 
	.i_btn_R(w_btn_R), // run_stop
    .i_btn_U(w_btn_U)
	

);








endmodule 

