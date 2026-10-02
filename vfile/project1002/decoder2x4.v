`timescale 1ns / 1ps


module decoder2x4(

	input [1:0] i_sel,
	output reg [3:0] o_an

);


always@(*)begin
	case(i_sel) 
	2'b00 : o_an = 4'b1110 ;	
	2'b01 : o_an = 4'b1101 ;
	2'b10 : o_an = 4'b1011 ;
	2'b11 : o_an = 4'b0111 ;
	endcase 

end

endmodule
