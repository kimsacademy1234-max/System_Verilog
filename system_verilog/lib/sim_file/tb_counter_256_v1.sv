
`timescale 1ns / 1ps



/////////////////////////////////////////////////////////////////////////////
interface cnt_interface(input clk);

	logic       reset;
	logic		[7:0] count;

endinterface


/////////////////////////////////////////////////////////////////////////////


class transaction;



	rand bit   reset;
	logic [7:0] count;

constraint reset_distribute{
		
		reset dist{
			0:/80,
			1:/20
		};
}





	function void debug_print(string name);
		$display("%t :[%s] counter= %d , reset = %d ",$time,name,count,reset);
	endfunction



endclass 


/////////////////////////////////////////////////////////////////////////////
//
//									01_GENERATOR
//
/////////////////////////////////////////////////////////////////////////////
class generator;

	event gen_next_evt;	


	function new(event gen_next_evt);

		this.gen_next_evt =gen_next_evt;
	endfunction


	task run(int count);
			repeat(count)begin
				@(gen_next_evt);
			end
	endtask


endclass


/////////////////////////////////////////////////////////////////////////////
//
//									02_DRIVER
//
/////////////////////////////////////////////////////////////////////////////

class driver;

    transaction tr;
	mailbox #(transaction) gen2drv_mbox;

	event gen_next_evt;	
	virtual cnt_interface cnt_vif;


	function new( virtual cnt_interface cnt_vif,
								event gen_next_evt);
		this.cnt_vif = cnt_vif;
		this.gen_next_evt =gen_next_evt;
	endfunction



	task preset();
			cnt_vif.reset = 1;
			@(negedge cnt_vif.clk);
			@(negedge cnt_vif.clk);
			cnt_vif.reset = 0;
	endtask


	task run();
		forever begin
			@(posedge cnt_vif.clk);
			->gen_next_evt;
	
		end
	endtask




	
endclass

/////////////////////////////////////////////////////////////////////////////
//
//									03_MONITOR
//
/////////////////////////////////////////////////////////////////////////////


class monitor;

	transaction tr;
	mailbox #(transaction) mon2scb_mbox;
	virtual cnt_interface cnt_vif;


	function new( mailbox#(transaction) mon2scb_mbox ,
					virtual cnt_interface cnt_vif	
					);
	
		this.mon2scb_mbox = mon2scb_mbox;  
		this.cnt_vif = cnt_vif;

	endfunction
	

	task run();

			forever begin
				@(posedge cnt_vif.clk);
				tr = new();
				tr.count = cnt_vif.count;
				tr.reset = cnt_vif.reset;
				mon2scb_mbox.put(tr);
				tr.debug_print("MON - PUT");

			end

	endtask 


endclass


/////////////////////////////////////////////////////////////////////////////
//
//									04_SCOREBOARD
//
/////////////////////////////////////////////////////////////////////////////

class scoreboard;
	
	transaction tr;
	mailbox #(transaction) mon2scb_mbox;
	virtual cnt_interface cnt_vif;


	function new(mailbox #(transaction) mon2scb_mbox);
		this.mon2scb_mbox = mon2scb_mbox;
	endfunction 
	
	logic [7:0] expected_count=0;
	int pass_cnt=0;
	int fail_cnt=0;
	int total_cnt =0;
	task run();

		forever begin
			mon2scb_mbox.get(tr);
			total_cnt ++;
			if(!tr.reset) begin
					if(expected_count == tr.count)begin

						pass_cnt ++;

					end

					else begin
		
						fail_cnt ++;

					end
					expected_count ++;
			end
				

			else begin
				
						expected_count = 0;

			end

	

		end


	endtask


	task report();

		$display("==========================================================================");
		$display("total test = %3d",total_cnt);
		$display("pass count = %3d",pass_cnt);
		$display("fail count = %3d",fail_cnt);
		$display("==========================================================================");


	endtask














endclass


/////////////////////////////////////////////////////////////////////////////
//
//									05_ENVIRONMENT
//
/////////////////////////////////////////////////////////////////////////////

class environment;

	generator gen;
	driver drv;
	monitor mon;
	scoreboard scb;
	mailbox #(transaction) mon2scb_mbox; 
	


	event gen_next_evt;

	function new(virtual cnt_interface cnt_vif);
	
		
		mon2scb_mbox = new();
		gen = new(gen_next_evt);
		drv = new(cnt_vif,gen_next_evt);
		mon = new(mon2scb_mbox,cnt_vif);
		scb = new(mon2scb_mbox);

	endfunction




	task run(int run_count);  // argument 선언
		
			drv.preset();
		fork
			gen.run(run_count);
			drv.run();
			mon.run();
			scb.run();
		join_any

			#10;
			scb.report();

			disable fork;

	endtask

endclass



/////////////////////////////////////////////////////////////////////////////



module tb_counter_256();


logic clk;

cnt_interface cnt_if(clk); 
environment env;


counter_256 DUT(
	 .i_clk(clk),
	 .i_reset(cnt_if.reset),
	 .o_count(cnt_if.count)
);

always #5 clk = ~clk;

initial begin
	
	$timeformat(-9,0,"ns",0);
	clk = 0;
	env = new(cnt_if);
	env.run(256);
	$finish;

end





endmodule
