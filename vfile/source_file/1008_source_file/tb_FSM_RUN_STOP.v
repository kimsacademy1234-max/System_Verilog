`timescale 1ns / 1ps


module tb_FSM_RUN_STOP();


reg i_clk,i_reset;
reg [1:0] i_sw;
wire [2:0] o_sw;


FSM_RUN_STOP DUT_FSM_RUN_STOP(

    .i_clk		(i_clk),
    .i_reset	(i_reset),
    .i_sw		(i_sw), 
    .o_sw		(o_sw)  
);



always #5 i_clk = ~i_clk;

initial begin


$monitor("%3d ns , Phase : %d",$time,k);




end




integer i;
integer k;





initial begin
	 i_sw =0;
	 i_clk = 0;
	 i_reset = 1;
	 k = 0;	 
	 #10; i_reset = 0; 


	 	

	 // stop -> stop : 모든 스위치 경우에 대해 체크 
		i_sw = 2'b00;
		#10;
		for(i=0; i <4; i=i+1)begin
			i_sw = i;
			#10;
		end 
		k = k  +1 ;
		i_reset = 1;
		#10 i_reset = 0;


	 // stop -> clear : 모든 스위치 경우에 대해 체크 

		i_sw = 2'b10;
		#10;
		for(i=0; i <4; i=i+1)begin
			i_sw = i;
			#10;
		end	
		k = k  +1 ;

		i_reset = 1;
		#10 i_reset = 0;
	 // Stop -> run : 모든 스위치 경우에 대해 체크 

		i_sw = 2'b01;
		#10;
		for(i=0; i <4; i=i+1)begin
			i_sw = i;
			#10;
		end

		$finish;
end

endmodule
