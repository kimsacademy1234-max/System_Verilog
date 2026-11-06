`timescale 1ns / 1ps


module counter_256(


input logic i_clk , 
input logic i_reset ,
output logic [7:0]o_count



);




always_ff@(posedge i_clk or posedge i_reset)begin


if(i_reset)begin

		o_count <= 0;

end

else begin 

		o_count <= o_count + 1; 

end


end






endmodule
