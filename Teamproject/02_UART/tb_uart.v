`timescale 1ns / 1ps


module tb_uart();


parameter BAUD_BIT_PERIOD =  100_000_000/9600*10 ;// (클럭수 * 10ns)

reg clk,rst,btnR;
wire led,tx;







UART DU(

.i_tx_data(8'h30),
.i_clk	(clk),
.i_reset (rst),
.i_btnR  (btnR),
.o_rstx  (tx),
.o_TX_busy (led) 

);



always #5 clk = ~clk;

initial begin

		clk =0;
		rst =1;
		btnR = 0;
		#10 rst = 0;
		// push 
		btnR =1;
		#(10*100*10);
		btnR = 0; 

		#(BAUD_BIT_PERIOD * 10); // 1frame *10bit 
	
		#100;

		$stop;


end







endmodule
