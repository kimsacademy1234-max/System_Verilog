
`timescale 1ns / 1ps



/////////////////////////////////////////////////////////////////////////////
interface cnt_interface(input clk);

	logic       reset;
	logic		[7:0] counter;

endinterface


/////////////////////////////////////////////////////////////////////////////


class transaction;



	rand bit   reset;
	logic [7:0] counter;

constraint reset_distribute{
		
		reset dist{
			0:/80,
			1:/20
		};
}



	function void debug_print(string name);
		$display("%t :[%s] counter= %d , reset = %d ",$time,name,counter,reset);
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
	mailbox #(transaction) gen2scb_mbox;


	function new(mailbox #(transaction) gen2drv_mbox,
				mailbox #(transaction) gen2scb_mbox);
		this.gen2drv_mbox = gen2drv_mbox;
		this.gen2mon_mbox = gen2mon_mbox;
	endfunction


	
	task run(int run_count);

		repeat(run_count) begin
			tr = new;
			tr.randomize;
			tr.debug_print("GEN - RESET");
			gen2drv_mbox.put(tr);
			gen2mon_mbox.put(tr);

			$display("==========================================================================");
			$display(" DRV,SCB PUT FINISH");
			$display("==========================================================================");
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

	virtual cnt_interface cnt_vif;


	function new(mailbox #(transaction) gen2drv_mbox,  virtual cnt_interface cnt_vif,);
		this.cnt_vif = cnt_vif;
		this.gen2drv_mbox = gen2drv_mbox;
	endfunction



	task preset();
	
		forever begin
			gen2drv_mbox.get(tr);
			cnt_vif.reset = tr.reset;
			@(negedge cnt_vif.clk);
			@(negedge cnt_vif.clk);
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
					virtual cnt_interface cnt_vif,	
					);
	
		this.mon2scb_mbox = mon2scb_mbox;  
		this.cnt_vif = cnt_vif;

	endfunction
	

	task run();

			forever begin
				@(posedge cnt_vif.clk);
				tr = new;
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
	mailbox #(transaction) gen2scb_mbox;



	function new(mailbox #(transaction) mon2scb_mbox
				 	);


		this.mon2scb_mbox = mon2scb_mbox;
		this.gen_next_evt = gen_next_evt;
	endfunction 
	
	logic [7:0] expect_data; // 왜 logic으로 선언하는가? DUT 출력이 4상태이기 때문
							// 출력이 x,z가 나온다면 원하는 출력이 아니다.
							// 출력이 x 

	int pass_cnt;
	int fail_cnt;

	task run();

		forever begin
			mon2scb_mbox.get(tr);
			tr.debug_print("SCB");
			
			if(d_cnt > 0)begin

					if( expect_data != tr.q)begin
							$display(" %t : [SCB] fail  d =  %d , q = %d", $time,expect_data,tr.q);
							fail_cnt ++;		
					end
					else begin
							$display(" %t : [SCB] Pass  d =  %d , q = %d", $time,expect_data,tr.q);
							pass_cnt ++;		
					end	
			end 	

			else begin
					d_cnt ++ ;
	
			end 
			
			expect_data = tr.d;
	

			//evt 
			->gen_next_evt;
		end

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

	mailbox #(transaction) gen2drv_mbox;
	mailbox #(transaction) mon2scb_mbox; 
	,mon_next_evt;


	function new(virtual cnt_interface cnt_vif);

		gen2drv_mbox = new;
		mon2scb_mbox = new;
		gen = new(gen2drv_mbox,gen_next_evt);
		drv = new(gen2drv_mbox, cnt_vif,mon_next_evt);
		mon = new(mon2scb_mbox,cnt_vif,mon_next_evt);
		scb = new(mon2scb_mbox,gen_next_evt);

	endfunction




	task run(int run_count);  // argument 선언
		
			drv.preset();
		fork
			gen.run(run_count);
			drv.run();
			mon.run();
			scb.run();
		join_any
		#100;

		$display("total test = %3d",run_count);
		$display("pass count = %3d",scb.pass_cnt);
		$display("fail count = %3d",scb.fail_cnt);
		$display("skip count = %3d",scb.d_cnt);
		$display("==========================================================================");

	endtask

endclass



/////////////////////////////////////////////////////////////////////////////



module tb_counter_256();


logic clk;

cnt_interface cnt_if(clk); 
environment env;


register_8bit DUT(
	 .clk(clk),
	 .i_reset(cnt_if.reset),
	 .counter(cnt_if.counter)
);

always #5 clk = ~clk;

initial begin
	
	$timeformat(-9,0,"ns",0);
	clk = 0;
	env = new(cnt_if);
	env.run(5);
	$finish;

end





endmodule
