`timescale 1ns / 1ps


module tb_Led_FSM();


reg i_clk,i_reset,i_sw;
wire [1:0] o_led;


Led_FSM DUT_FSM(

    .i_clk		(i_clk),
    .i_reset	(i_reset),
    .i_sw		(i_sw), 
    .o_led		(o_led)  
);



always #5 i_clk = ~i_clk;

integer i;

initial begin
	 i_sw =0;
	 i_clk = 0;
	 i_reset = 1;
	 
	 #10; i_reset = 0; 

	 for(i=0; i<4; i=i+1)begin
		i_sw = i;
		#10;
	 end


	 $finish;


end



endmodule
