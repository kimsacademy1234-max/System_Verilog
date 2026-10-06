`timescale 1ns / 1ps


module tb_top();


reg [3:0] i_a,i_b;

wire o_cout;
wire [3:0] o_an; 
wire [7:0] fnd_out;


reg [3:0] r_fnd_out;




top_adder_fnd DUT(

	.i_a(i_a), 
	.i_b(i_b),
	.o_cout(o_cout),
	.o_an(o_an),
	.fnd_out(fnd_out)


);



	always@(*)begin 
		case(fnd_out)

			8'hC0: r_fnd_out = 4'h0; 			
			8'hF9: r_fnd_out = 4'h1;			
			8'hA4: r_fnd_out = 4'h2;
			8'hB0: r_fnd_out = 4'h3;
			8'h99: r_fnd_out = 4'h4;
			8'h92: r_fnd_out = 4'h5;
			8'h82: r_fnd_out = 4'h6;
			8'hF8: r_fnd_out = 4'h7;
			8'h80: r_fnd_out = 4'h8;
			8'h90: r_fnd_out = 4'h9;
			8'h88: r_fnd_out = 4'hA;
			8'h83: r_fnd_out = 4'hB;
			8'hC6: r_fnd_out = 4'hC;
			8'hA1: r_fnd_out = 4'hD;
			8'h86: r_fnd_out = 4'hE;
			8'h8E: r_fnd_out = 4'hF;
			default: r_fnd_out = 4'h0;
		endcase

	end




initial begin


$monitor("%3d ns : i_a = %d / i_b = %d  o_cout = %b  SEG_NUM = %d ", $time, i_a, i_b, o_cout, r_fnd_out);



end





integer err_cnt;
integer i,j;


initial begin

	err_cnt = 0;
	for(i=0; i<16; i=i+1)begin
			
		for(j=0; j<16; j=j+1)begin
			i_a = i;
			i_b = j;
			#10;
		

			if((i_a+i_b)!== r_fnd_out)begin
				err_cnt = err_cnt +1;
				$display("[ERROR] a:%d +b: %d is not SEG DISPLAY{%d}!!",i_a,i_b,r_fnd_out);
			end

		end


	end 

	if(err_cnt ==0) $display("[PASS] : ALL BCD CORRECT!");
	else $display("[FAIL] : Please Check %d [ERROR] Diagram",err_cnt);




	$finish;


end


endmodule
