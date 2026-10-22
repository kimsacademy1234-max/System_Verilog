`timescale 1ns / 1ps


module fifo#(

	parameter DEPTH = 4

)(

input i_clk, 
input i_reset,
input push,pop,
input [7:0] push_data,

output [7:0] pop_data,
output full,
output empty


);



register_file#(
	.DEPTH(DEPTH)
)
U_REG_FILE(




);











endmodule




module control_unit #(

parameter ADDR_BIT_WIDTH = 2)(

input i_clk, 
input i_reset, 
input push,
input pop,

output [ADDR_BIT_WIDTH-1 :0 ]wptr,
output [ADDR_BIT_WIDTH-1 :0 ]rptr,
output we,

output full,
output empty


);



























module register_file#(

	parameter DEPTH = 4,
	parameter ADDR_BIT_WIDTH =$clog2(DEPTH),
	parameter BIT_WIDTH =8
)(

input i_clk,
input we,
input [BIT_WIDTH-1:0]wdata,
input [ADDR_BIT_WIDTH-1:0]waddr,
input [ADDR_BIT_WIDTH-1:0]raddr,
output [7:0] rdata

);


reg[7:0] register_file[0:DEPTH-1];


always@(posedge i_clk)begin

		if(we)begin

			register_file[waddr] <= wdata;

		end


end


assign rdata = register_file[raddr]; 



endmodule
