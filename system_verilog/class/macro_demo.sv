`timescale 1ns / 1ps




`define SHOW(v) $display(`"v = %0d`",v)
`define	MSG(s)	$display(`"name is `\`"s`\`"`")
`define FF(n) logic [3:0] n``_d, n``_q;




module macro_demo;

	int count =7;
	`FF(state) 

	initial begin

	$display("=====================================================");
	$display("");
	$display("");
	$display("");
	$display("");
	$display("");
	$display("");
	$display("");




	`SHOW(count);
	`MSG(alu);
	state_d = 4'd9;
	state_q = state_d ;
	
	`SHOW(state_q);
	$display("");
	$display("");
	$display("");
	$display("");
	$display("");
	$display("");
	$display("=====================================================");
	$finish;
	







	end














endmodule
