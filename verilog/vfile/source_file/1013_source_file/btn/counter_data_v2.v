`timescale 1ns / 1ps

module counter_datapath_v2#(
parameter OFFSET = 0
)
(
input i_clk,
input i_reset,

input  i_run_stop, //run-stop
input  i_clear, //clear
input  i_mode, //up_down (0: up, 1: down)
output [13:0] o_counter,
output o_tic
);

wire w_tic;
assign o_tic = w_tic;

// tick은 run 상태일 때만 발생, clear 시 내부 카운터도 초기화
tick_gen GEN(
	.i_clk(i_clk),
	.i_reset(i_reset),
	.i_run_stop(i_run_stop),
	.i_clear(i_clear),
	.o_tic(w_tic)
);

// tick이 들어올 때만 up/down 카운트
tick_counter TICK(
	.i_clk(i_clk),
	.i_reset(i_reset),
	.i_tick(w_tic),
	.i_clear(i_clear),
	.i_mode(i_mode),
	.o_counter(o_counter)
);

endmodule


///////////////////////////////////////////////////////////////////

module tick_gen(
input i_clk,
input i_reset,
input i_run_stop,
input i_clear,
output reg o_tic
);

parameter FCOUNT = 100_000_00; // 100MHz -> 100Hz tick
reg [$clog2(FCOUNT)-1 :0] r_counter;

always@(posedge i_clk or posedge i_reset)begin
	if(i_reset)begin
		r_counter <= 0;
		o_tic <= 0;
	end
	else begin
		o_tic <= 0;
        r_counter <= r_counter;

		if(i_clear)begin
			r_counter <= 0;
		end
		else if(i_run_stop)begin
			if(r_counter == FCOUNT -1)begin
				r_counter <= 0;
				o_tic <= 1;
			end
			else begin
				r_counter <= r_counter + 1;

			end
		end

	end
end

endmodule


//////////////////////////////////////////////////////////////////////

module tick_counter(
input i_clk,
input i_reset,
input i_tick,
input i_clear,
input i_mode, // 0: up, 1: down

output reg [13:0] o_counter
);

parameter COUNT = 10000;

always@(posedge i_clk or posedge i_reset)begin
	if(i_reset)begin
		o_counter <= 0;
	end
	else begin
		if(i_clear)begin
			o_counter <= 0;
		end
		else if(i_tick)begin

            o_counter <= o_counter;

			if(i_mode)begin // down
				if(o_counter == 0) o_counter <= COUNT -1;
				else               o_counter <= o_counter - 1;
			end
			else begin // up
				if(o_counter == COUNT -1) o_counter <= 0;
				else                      o_counter <= o_counter + 1;
			end
		end
	end
end

endmodule
