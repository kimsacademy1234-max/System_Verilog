
`timescale 1ns / 1ps



/////////////////////////////////////////////////////////////////////////////
interface cnt_interface(input clk);


logic reset;
logic run_stop;
logic mode;
logic clear;
logic [7:0]  count;


endinterface


/////////////////////////////////////////////////////////////////////////////


class transaction;

rand bit reset;
rand bit run_stop;
rand bit mode;
rand bit clear;
logic [7:0] count;


constraint reset_trigger{
		
		reset dist{
			0:/80,
			1:/20

		};

}

constraint clear_trigger{		// clear가 50%면 카운트가 거의 안 쌓임 → 10%로 낮춤

		clear dist{
			0:/90,
			1:/10
		};

}




	function void debug_print(string name);
		$display("%t :[%s] reset = %d , run_stop = %d ,mode = %d, clear = %d , count= %d ",$time,name,reset,run_stop,mode,clear,count);
	endfunction



endclass 


/////////////////////////////////////////////////////////////////////////////
//
//									01_GENERATOR
//
/////////////////////////////////////////////////////////////////////////////
class generator;

	
    transaction tr;
	mailbox #(transaction) gen2drv_mbox;
	event gen_next_evt;

	function new(mailbox #(transaction) gen2drv_mbox, event gen_next_evt);

		this.gen_next_evt =gen_next_evt;
		this.gen2drv_mbox =gen2drv_mbox;
	endfunction


	task run(int run_count);

			repeat(run_count) begin
				tr = new();
				void'(tr.randomize());
				gen2drv_mbox.put(tr);
				@(gen_next_evt);			// driver가 인가를 끝낼 때까지 대기
			end
			$display("===================================================");
			$display(" 				%t	GEN FINISH 						 ",$time);
			$display("===================================================");

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
								event gen_next_evt,mailbox #(transaction) gen2drv_mbox);
		this.cnt_vif = cnt_vif;
		this.gen_next_evt =gen_next_evt;
		this.gen2drv_mbox =gen2drv_mbox;
	endfunction


	task preset();					// 시작 시 reset : 없으면 count가 X로 시작
		cnt_vif.reset = 1;
		cnt_vif.run_stop = 0;
		cnt_vif.mode = 0;
		cnt_vif.clear = 0;
		$display("%t : PRESET", $time);
		repeat(2) @(posedge cnt_vif.clk);
		@(negedge cnt_vif.clk);
		cnt_vif.reset = 0;
		$display("%t : PRESET FINISH", $time);
	endtask



	task run();
		forever begin
		
			gen2drv_mbox.get(tr);
			tr.debug_print("DRV - GET");
			@(negedge cnt_vif.clk);
			@(negedge cnt_vif.clk);
		 	
			if(tr.reset)begin	
				cnt_vif.reset = tr.reset;
				$display("RESET GEN"); 
				@(posedge cnt_vif.clk);
				#1;
				cnt_vif.reset = 0;				

			end

			else begin
				tr.debug_print("DRV - PUT");
				cnt_vif.mode = tr.mode;
				cnt_vif.run_stop = tr.run_stop;
				cnt_vif.clear = tr.clear;

			end

			-> gen_next_evt;				// generator에게 다음 transaction 요청

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
				tr.reset = cnt_vif.reset;
				tr.mode = cnt_vif.mode;
				tr.clear = cnt_vif.clear;
				tr.run_stop = cnt_vif.run_stop;
				#1;							// posedge 직후 : 이번 엣지 결과가 반영된 count
				tr.count = cnt_vif.count;
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
			tr.debug_print("SCB - GET");

			if(tr.reset|tr.clear) expected_count = 0;
			else begin
				if(tr.run_stop)begin
					
					if(tr.mode) expected_count --;
					else		expected_count ++;

				end
	
			end


			total_cnt ++;
			if(expected_count == tr.count)begin
					pass_cnt ++;
			end
			else begin
					fail_cnt ++;
					tr.debug_print("FAIL");
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
	mailbox #(transaction) gen2drv_mbox; 
	


	event gen_next_evt;

	function new(virtual cnt_interface cnt_vif);
	
		
		mon2scb_mbox = new();
		gen2drv_mbox = new();
		gen = new(gen2drv_mbox,gen_next_evt);
		drv = new(cnt_vif,gen_next_evt,gen2drv_mbox);
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



module tb_counter_rsm();


logic clk;

cnt_interface cnt_if(clk); 
environment env;


counter_rsm DUT(


.i_clk			(cnt_if.clk), 
.i_reset		(cnt_if.reset),
.i_run_stop		(cnt_if.run_stop),
.i_mode 		(cnt_if.mode),
.i_clear 		(cnt_if.clear),
.o_count		(cnt_if.count)


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
