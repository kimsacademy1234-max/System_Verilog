`timescale 1ns / 1ps


module Ascii_decoder(



//input i_clk,i_reset,
input i_rx_done,
input [7:0] i_rx_data,
output reg [3:0] o_fnd_hex

);



always@(*)begin



	if (i_rx_done)begin
		
		case(i_rx_data)

		8'h30 : o_fnd_hex =  4'h0 ;		
		8'h31 : o_fnd_hex =  4'h1 ;
		8'h32 : o_fnd_hex =  4'h2 ;
		8'h33 : o_fnd_hex =  4'h3 ;
		8'h34 : o_fnd_hex =  4'h4 ;
		8'h35 : o_fnd_hex =  4'h5 ;
		8'h36 : o_fnd_hex =  4'h6 ;
		8'h37 : o_fnd_hex =  4'h7 ;
		8'h38 : o_fnd_hex =  4'h8 ;
		8'h39 : o_fnd_hex =  4'h9 ;
		8'h41 : o_fnd_hex =		4'hA;
		8'h42 : o_fnd_hex =		4'hB;
		8'h43 : o_fnd_hex =		4'hC;
		8'h44 : o_fnd_hex =		4'hD;
		8'h45 : o_fnd_hex =		4'hE;
		8'h46 : o_fnd_hex =		4'hF;
		8'h61 : o_fnd_hex =		4'hA;
		8'h62 : o_fnd_hex =		4'hB;
		8'h63 : o_fnd_hex =		4'hC;
		8'h64 : o_fnd_hex =		4'hD;
		8'h65 : o_fnd_hex =		4'hE;
		8'h66 : o_fnd_hex =		4'hF;
		default : o_fnd_hex = 4'h0;


		endcase 

	end

	else begin
		o_fnd_hex = 4'h0;
	end



end




endmodule
