`timescale 1ns / 1ps


module tb_FSM_RUN_STOP_cov();


reg i_clk,i_reset;
reg [1:0] i_sw;
wire [2:0] o_sw;


FSM_RUN_STOP DUT_FSM_RUN_STOP(

    .i_clk		(i_clk),
    .i_reset	(i_reset),
    .i_sw		(i_sw), 
    .o_sw		(o_sw)  
);



integer i;
integer k;
always #5 i_clk = ~i_clk;

initial begin







end










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

	 // stop -> stop :     
		set_sw(2'b00);
		for(i=0; i <4; i=i+1) set_sw(i);
		k = k  +1 ;
		pulse_reset;

	 // stop -> clear :     
		set_sw(2'b10);
		for(i=0; i <4; i=i+1) set_sw(i);
		k = k  +1 ;
		pulse_reset;

	 // Stop -> run :     
		set_sw(2'b01);
		for(i=0; i <4; i=i+1) set_sw(i);

		$finish;
end


// ---- measurement hooks (added by Claude, stimulus unchanged) ----
integer cov [0:2][0:3];
integer cs, cw, hit;
initial for (cs=0; cs<3; cs=cs+1) for (cw=0; cw<4; cw=cw+1) cov[cs][cw]=0;
always @(posedge i_clk) if (!i_reset)
    case (o_sw) 3'b001: cov[0][i_sw]=cov[0][i_sw]+1; 3'b010: cov[1][i_sw]=cov[1][i_sw]+1; 3'b100: cov[2][i_sw]=cov[2][i_sw]+1; endcase
always @(negedge i_clk) $display("[TRACE] %0d %b %b %b", $time, i_reset, i_sw, o_sw);
final begin
    hit=0;
    for (cs=0; cs<3; cs=cs+1) for (cw=0; cw<4; cw=cw+1) if (cov[cs][cw]>0) hit=hit+1;
    $display("[COV] STOP %0d %0d %0d %0d", cov[0][0],cov[0][1],cov[0][2],cov[0][3]);
    $display("[COV] RUN  %0d %0d %0d %0d", cov[1][0],cov[1][1],cov[1][2],cov[1][3]);
    $display("[COV] CLEAR %0d %0d %0d %0d", cov[2][0],cov[2][1],cov[2][2],cov[2][3]);
    $display("[COV] arcs %0d / 12", hit);
end
endmodule
