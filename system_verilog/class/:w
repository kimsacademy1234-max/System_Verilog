`timescale 1ns / 1ps



/////////////////////////////////////////////////////////////////////////////
interface uart_interface(input clk);

logic       rst;
logic       tx_start;
logic [7:0] tx_data;
logic       tx;
logic       tx_busy;







endinterface


/////////////////////////////////////////////////////////////////////////////


class transaction;

 rand bit [7:0] tx_data;
 logic [7:0] expected_data;
 logic [7:0] result_data;
 logic tx;
 logic rst;
 logic tx_busy;
 logic tx_start;
 
 rand int interval;



constraint tx_data_gen{tx_data inside{[0:255]};}
//constraint rst_gen{ rst dist{ 0:/ 9 , 1:/ 1  }; }
//constraint push_gen{ push dist{ 0:/ 5 , 1:/ 5 }; }
//constraint pop_gen{ pop   dist{ 0:/ 5 , 1:/ 5 }; }

function void debug_print(string name);
	$display("%t :[%s] reset =  %d , start = %d , tx_data = %d , interval = %d , tx_busy =  %d"
				,$time,name,rst,tx_start,tx_data,interval,tx_busy);

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



	task run();
		forever begin
			tr = new();
			tr.randomize();
			gen2drv_mbox.put(tr);
			$display("=========================================================================");
			tr.debug_print("GEN");
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
	virtual uart_interface uart_vif;

	function new( mailbox #(transaction) gen2drv_mbox,virtual uart_interface uart_vif); 
	
		this.uart_vif = uart_vif;
		this.gen2drv_mbox = gen2drv_mbox;

	endfunction



	task preset();
		
	uart_vif.rst = 1;
	@(negedge uart_vif.clk);
	@(negedge uart_vif.clk);
	uart_vif.rst = 0;

	endtask


	task run();
		forever begin
			gen2drv_mbox.get(tr);
			tr.debug_print("DRV");
			uart_vif.tx_data = tr.tx_data;	
			uart_vif.tx_start = 1;
			#10; 
			uart_vif.tx_start = 0;
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

	virtual uart_interface uart_vif;


	function new( mailbox#(transaction) mon2scb_mbox,
					virtual uart_interface uart_vif
					);
	
		this.mon2scb_mbox = mon2scb_mbox;  
		this.uart_vif = uart_vif;
	endfunction
	
	parameter COUNT = 100_000_000/9600;

	bit n_tx ;
	bit n_tx_busy ;
	
	bit c_tx  ;
	bit c_tx_busy  ;

	
	bit tx_edge = n_tx^c_tx;
	bit busy_edge = n_tx_busy^c_tx_busy; 

	bit count_enable;
	bit[$clog2(COUNT/2)-1:0] count; 
	bit [3:0] baud_cnt; 


	bit [7:0] expected_data; 
	bit [7:0] result_data;



	task run();

			forever begin
				@(posedge uart_vif.clk)
				#1; 
				tr = new();
				tr.tx_data	= uart_vif.tx_data ;   
				tr.tx_busy	= uart_vif.tx_busy  ;
				tr.tx	    = uart_vif.tx  ;
				tr.tx_start = uart_vif.tx_start ;
				tr.rst	= uart_vif.rst; 

				c_tx = uart_vif.tx;
				c_tx_busy = uart_vif.tx_busy;

				if(tx_edge && busy_edge)begin
					
					count_enable = 1;
					expected_data = tr.tx_data;
					
				end

				else begin 
				
					if(count_enable)begin 
						
						if(tx_edge == 0 && busy_edge == 1)begin
							
								tr.result_data = result_data;
								tr.expected_data = expected_data;
								mon2scb_mbox.put(tr);
								count_enable = 0;
								$display("PUT RESULT DATA  : %d  EXPECTDATA : %d", result_data,expected_data); 

						end


						else begin
							if(count == (COUNT/2 )-1 )begin
									count = 0;

									if(baud_cnt < 9 && baud_cnt >0)begin
											
											result_data = {uart_vif.tx, result_data[7:1]};
											$display("[DATA %d], %5d", baud_cnt,uart_vif.tx);
									end


									baud_cnt ++; 

							end
							
							else begin 
									count ++;

							end
						end	
		
					end

					else begin
				
						baud_cnt = 0; 
						count = 0; 
						result_data =0;
						expected_data = 0; 
				
					end


		
				end

				n_tx = uart_vif.tx;
				n_tx_busy = uart_vif.tx_busy;


			

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
	event gen_next_evt;
	virtual uart_interface uart_vif;


	localparam int DEPTH = 4;

	logic [7:0] expected_uart[$:3];
	logic [7:0] exp_data;
	bit         exp_full, exp_empty, do_push, do_pop;

	int total_count;
	int reset_count;
	int push_count;
	int pop_count;
	int push_ignored_count;
	int pop_ignored_count;


	int pass_count;
	int fail_count;


	int full_fail_count;
	int full_pass_count;

	int empty_fail_count;
	int empty_pass_count;

	int   option;
	int   max_count;
	bit   push_seen[256];
	bit   pop_seen [256];
	int   push_cover;
	int   pop_cover;
	bit   timeout;
	event end_evt;

	function new(mailbox #(transaction) mon2scb_mbox, virtual uart_interface uart_vif, event gen_next_evt);
		this.uart_vif	  =  uart_vif;
		this.mon2scb_mbox = mon2scb_mbox;
		this.gen_next_evt = gen_next_evt;
		this.cg_uart =		new;
	endfunction 

	covergroup cg_uart;
			// iff(조건) -> push 일때만 집계하겠다. pop 일때도 tr.push data는 매번 posedge + 1ns 바뀌고 있기 때문 
			cp_push_data : coverpoint tr.push_data iff(tr.push){
		
				bins full[] = {[0:255]};  // 값의 범위를 지정할 수 있다
										// 퍼센트로 나온다
			}


			cp_pop_data : coverpoint tr.pop_data iff(tr.pop){
		
				bins full[] = {[0:255]};  // 값의 범위를 지정할 수 있다
										// 퍼센트로 나온다
			}

			// 동작 4가지 다 일어나는가? push + pop 

			cp_push_pop : coverpoint {tr.push,tr.pop} {
		
				bins idle = {2'b00};  
				bins push_only = {2'b10};  
				bins pop_only = {2'b01};  
				bins push_pop = {2'b11};  
										
			}

			cp_empty_full : coverpoint {tr.empty,tr.full} {
		
				bins nomal    = {2'b00};  
				bins empty    = {2'b10};  
				bins full     = {2'b01};  
				//bins error    = {2'b11};  
										
			}

			// check 안한거 -> 메모리 depth ->  depth 가 1일 때, 2일때 확인을 안해봄 
	
			cp_queue_st  : coverpoint expected_uart.size()  {
				bins uart_0 = {0}; //empty 
				bins uart_1 = {1};
				bins uart_2 = {2};
				bins uart_3 = {3};
				bins uart_4 = {4}; //full
			}



			// cross option -> x 조합을 만들어 내겠다. 
			cx_op_st: cross cp_push_pop,cp_empty_full;


			cx_op_st_uart_depth : cross cp_push_pop ,cp_queue_st;



	endgroup

	task run();

		forever begin

			mon2scb_mbox.get(tr);
			tr.debug_print("SCB");
			total_count ++;

			if(tr.rst)begin
				reset_count ++;
				expected_uart.delete();
				check_flags(0, 1);
				cg_uart.sample();
			end

			else begin
				exp_full  = (expected_uart.size() == DEPTH);
				exp_empty = (expected_uart.size() == 0);
				check_flags(exp_full, exp_empty);
				cg_uart.sample();

				do_pop  = tr.pop  && !exp_empty;
				do_push = tr.push && !exp_full;

				if(tr.push && exp_full)  push_ignored_count ++;
				if(tr.pop  && exp_empty) pop_ignored_count ++;

				if(do_pop)begin
					pop_count ++;
					exp_data = expected_uart.pop_front();
					if(exp_data === tr.pop_data)begin
						pass_count ++;
						if(!pop_seen[exp_data]) begin pop_seen[exp_data] = 1; pop_cover ++; end
					end
					else begin
						fail_count ++;
						$display("=========================================================================");
						$display("%t  POP FAIL : pop_data = %d / expected_pop_data = %d",$time,tr.pop_data,exp_data);
						$display("=========================================================================");
					end
				end

				if(do_push)begin
					push_count ++;
					expected_uart.push_back(tr.push_data);
					if(!push_seen[tr.push_data]) begin push_seen[tr.push_data] = 1; push_cover ++; end
				end


			end

			if(((option == 0) ? push_cover : pop_cover) == 256) ->end_evt;
			else if(total_count == max_count) begin timeout = 1; ->end_evt; end

			->gen_next_evt;

		end
	endtask



	function void check_flags(bit expec_full, bit expec_empty);
		if(tr.full === expec_full) full_pass_count ++;
		else begin
			full_fail_count ++;
			$display("%t  FULL FAIL  : full = %b / expected_full = %b (queue size = %0d)",$time,tr.full,expec_full,expected_uart.size());
		end

		if(tr.empty === expec_empty) empty_pass_count ++;
		else begin
			empty_fail_count ++;
			$display("%t  EMPTY FAIL : empty = %b / expected_empty = %b (queue size = %0d)",$time,tr.empty,expec_empty,expected_uart.size());
		end
	endfunction

	function string pad(string s, int w);
		pad = s;
		while(pad.len() < w) pad = {pad, " "};
	endfunction

	function void print_title(string s);
		$display("|  %s|", pad(s, 56));
	endfunction

	function void print_row(string label, string value);
		$display("|    %s : %s|", pad(label, 28), pad(value, 23));
	endfunction

	function string pf(int pass, int fail);
		return $sformatf("PASS %5d   FAIL %3d", pass, fail);
	endfunction

	function string pct(real cov);
		return $sformatf("%5.1f %%", cov);
	endfunction

	task report(int option);
		string case_s, result;

		case(option)
			0 : case_s = "PUSH ONLY";
			1 : case_s = "POP ONLY";
			2 : case_s = "PUSH & POP";
			3 : case_s = "RANDOM without Reset";
			4 : case_s = "RANDOM with Reset";
		endcase

		result = (timeout) ? "TIMEOUT" : (fail_count + full_fail_count + empty_fail_count == 0) ? "PASS" : "FAIL";

		$display("");
		$display("+==========================================================+");
		$display("|  %s%s|", pad($sformatf("[Option-%0d] %s TEST", option, case_s), 46), pad(result, 10));
		$display("+==========================================================+");
		print_title("TRANSACTION");
		$display("+----------------------------------------------------------+");
		print_row("total",                $sformatf("%5d", total_count));
		print_row("reset",                $sformatf("%5d", reset_count));
		print_row("push (accepted)",      $sformatf("%5d", push_count));
		print_row("pop  (accepted)",      $sformatf("%5d", pop_count));
		print_row("push ignored (full)",  $sformatf("%5d", push_ignored_count));
		print_row("pop  ignored (empty)", $sformatf("%5d", pop_ignored_count));
		$display("+----------------------------------------------------------+");
		print_title("CHECK");
		$display("+----------------------------------------------------------+");
		print_row("pop_data vs expected", pf(pass_count, fail_count));
		print_row("full",                 pf(full_pass_count, full_fail_count));
		print_row("empty",                pf(empty_pass_count, empty_fail_count));
		$display("+----------------------------------------------------------+");
		print_title("DATA ACCEPT (0~255)");
		$display("+----------------------------------------------------------+");
		print_row("end condition",        timeout ? "TIMEOUT" : "COVERED");
		print_row("transactions",         $sformatf("%5d / max %0d", total_count, max_count));
		print_row("push accepted (stored)", $sformatf("%3d / 256", push_cover));
		print_row("pop  checked  (PASS)",   $sformatf("%3d / 256", pop_cover));
		$display("+----------------------------------------------------------+");
		print_title("COVERAGE");
		$display("+----------------------------------------------------------+");
		print_row("push_data",             pct(cg_uart.cp_push_data.get_coverage()));
		print_row("pop_data",              pct(cg_uart.cp_pop_data.get_coverage()));
		print_row("push / pop",            pct(cg_uart.cp_push_pop.get_coverage()));
		print_row("empty / full",          pct(cg_uart.cp_empty_full.get_coverage()));
		print_row("uart count (0~3)",      pct(cg_uart.cp_queue_st.get_coverage()));
		print_row("push/pop x empty/full", pct(cg_uart.cx_op_st.get_coverage()));
		print_row("Depth x Push / Pop", pct(cg_uart.cx_op_st_uart_depth.get_coverage()));
		$display("+==========================================================+");
		$display("");
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

	function new(virtual uart_interface uart_vif);
	
		
		gen2drv_mbox = new();
		mon2scb_mbox = new();
		gen = new(gen2drv_mbox,gen_next_evt);
		drv = new(gen2drv_mbox,uart_vif);
		mon = new(mon2scb_mbox,uart_vif);
		scb = new(mon2scb_mbox,uart_vif,gen_next_evt);

	endfunction

	task run(int max_count,int option);
	
		drv.preset();
		scb.option    = option;
		scb.max_count = max_count;

		fork
			gen.run(option);
			drv.run();
			mon.run();
			scb.run();
		join_none

			@(scb.end_evt);

			#1;
			scb.report(option);

			disable fork;

	endtask

endclass



/////////////////////////////////////////////////////////////////////////////



module tb_uart_tx();


logic clk = 0;

uart_interface uart_if(clk); 
//environment env;

parameter BAUD_TIME  = (100_000_000/9600)*10;



uart_tx DUT(

 .clk		(clk				),
 .rst		(uart_if.rst		),
 .tx_start	(uart_if.tx_start	),
 .tx_data	(uart_if.tx_data	),
 .tx		(uart_if.tx			),	
 .tx_busy	(uart_if.tx_busy	)

);

always #5 clk = ~clk;

initial begin
	
	$timeformat(-9,0,"ns",0);
	//env = new(uart_if);
	//env.run(20000,3);  

	uart_if.rst  =1;
	uart_if.tx_start  =1;
	uart_if.tx_data = 8'haa;
	#10;
	uart_if.rst = 0;
	#10;
	uart_if.tx_start = 1;
	#10;
	uart_if.tx_start = 0;
	#(BAUD_TIME *10);
	
	
	










	$finish;

end





endmodule
