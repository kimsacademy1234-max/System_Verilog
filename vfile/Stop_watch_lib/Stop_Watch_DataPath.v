`timescale 1ns / 1ps


module Stop_Watch_DataPath(

input i_clk,
input i_reset,
input i_run_stop,
input i_clear,
input i_mode,
output reg [6:0] msec, 
output reg [5:0] sec,
output reg [5:0] min,
output reg [5:0] hour

);


wire w_sec; 




tick_gen_100Hz STOP_WATCH_TICK(

	.i_clk(i_clk),
	.i_reset(i_reset),
	.i_run_stop(i_run_stop),
	.i_clear(i_clear),
	.o_tic(w_sec)

);



endmodule 




module counter#(
	parameter COUNT = 60,
	parameter DATA_WIDTH = 6
)(
	input i_tic,
	input i_reset,
	input i_clk,
	input i_clear,
	input i_mode,
	output o_time_tic, 	
	output [DATA_WIDTH-1:0] o_time
)




















