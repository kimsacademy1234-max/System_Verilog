`timescale 1ns / 1ps


module counter_4(


input i_clk , 
input i_reset_n ,
output reg [1:0] o_sel

);




always@(posedge i_clk or negedge i_reset_n)begin


if(!i_reset_n)begin

		o_sel <= 2'b00;

end

else begin 
	
		if(o_sel < 2'b11)begin

			o_sel <= o_sel + 1;
		end

		else o_sel <= 2'b00;
end


end









endmodule
