`timescale 1ns / 1ps


module Ascii_decoder(



//input i_clk,i_reset,
input i_rx_done,
input [7:0] i_rx_data,
output reg [7:0] o_fnd_hex

);



always@(*)begin



	if (i_rx_done)begin
		
		case(i_rx_data)

		8'h30 : o_fnd_hex =      8'h00 ;		
		8'h31 : o_fnd_hex =      8'h01 ;
		8'h32 : o_fnd_hex =      8'h02 ;
		8'h33 : o_fnd_hex =      8'h03 ;
		8'h34 : o_fnd_hex =      8'h04 ;
		8'h35 : o_fnd_hex =      8'h05 ;
		8'h36 : o_fnd_hex =      8'h06 ;
		8'h37 : o_fnd_hex =      8'h07 ;
		8'h38 : o_fnd_hex =      8'h08 ;
		8'h39 : o_fnd_hex =      8'h09 ;
		8'h41 : o_fnd_hex =		 8'h0A;
		8'h42 : o_fnd_hex =		 8'h0B;
		8'h43 : o_fnd_hex =		 8'h0C;
		8'h44 : o_fnd_hex =		 8'h0D;
		8'h45 : o_fnd_hex =		 8'h0E;
		8'h46 : o_fnd_hex =		 8'h0F;
		8'h61 : o_fnd_hex =		 8'h0A;
		8'h62 : o_fnd_hex =		 8'h0B;
		8'h63 : o_fnd_hex =		 8'h0C;
		8'h64 : o_fnd_hex =		 8'h0D;
		8'h65 : o_fnd_hex =		 8'h0E;
		8'h66 : o_fnd_hex =		 8'h0F;
		default : o_fnd_hex = 8'hFF;


		endcase 

	end

	else begin
		o_fnd_hex = 4'h0;
	end



end




endmodule
