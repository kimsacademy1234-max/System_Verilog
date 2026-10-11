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





// Inputs change only at negedge (middle of the clock period)
// -> inputs are stable at every posedge, so state follows n_state one clock later
// Each task starts at a negedge, applies its value and holds it (ends at a negedge)
// set_sw holds i_sw for 2 clocks: longest path RUN -> STOP -> CLEAR needs 2 transitions
task set_sw(input [1:0] sw);
	begin
		i_sw = sw;
		repeat(2) @(negedge i_clk);
	end
endtask

// reset for one clock (i_sw cleared to 00)
task pulse_reset;
	begin
		i_reset = 1; i_sw = 2'b00;
		@(negedge i_clk);
		i_reset = 0;
	end
endtask

initial begin
	 i_sw =0;
	 i_clk = 0;
	 i_reset = 1;	// reset from 0 ns -> no X on state
	 k = 0;
	 @(negedge i_clk);	// 10 ns : first negedge
	 i_reset = 0;

	 // stop -> stop : 모든 스위치 경우에 대해 체크
		set_sw(2'b00);
		for(i=0; i <4; i=i+1) set_sw(i);
		k = k  +1 ;
		pulse_reset;

	 // stop -> clear : 모든 스위치 경우에 대해 체크
		set_sw(2'b10);
		for(i=0; i <4; i=i+1) set_sw(i);
		k = k  +1 ;
		pulse_reset;

	 // Stop -> run : 모든 스위치 경우에 대해 체크
		set_sw(2'b01);
		for(i=0; i <4; i=i+1) set_sw(i);

		$finish;
end

endmodule
