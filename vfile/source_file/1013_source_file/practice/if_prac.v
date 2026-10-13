`timescale 1ns / 1ps


module if_prac(


input [3:0] enc_in,
output reg valid,
output reg [1:0] enc_out



);






always@(*)begin


	valid = 1'b1;


	if		(enc_in[3]) enc_out = 2'b11; 
	else if(enc_in[2]) enc_out = 2'b10; 
	else if(enc_in[1]) enc_out = 2'b10; 
	else if(enc_in[0]) enc_out = 2'b01; 
	else begin
			valid = 1'b0;
			enc_out = 2'bxx;
	end

end






endmodule
