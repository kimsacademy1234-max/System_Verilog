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
constraint interval_range{interval < 10416;}
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



	task run(int run_count);
		repeat(run_count) begin
			tr = new();
			tr.randomize();
			tr.rst = 0; 
			tr.tx_start = 0; 
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

	int  busy_check; 

	task run();
		forever begin
			@(negedge uart_vif.clk);
			busy_check = 0;
			gen2drv_mbox.get(tr);
			//check tx_busy
			
			while(uart_vif.tx_busy)begin
				@(negedge uart_vif.clk);
				busy_check ++;
				if(busy_check > 10416*10)begin

					$display("tx_busy hige was too long");
					break;
				end

			end



			//tx_busy
			if(!uart_vif.tx_busy) begin
				repeat(tr.interval) @(negedge uart_vif.clk);
				uart_vif.rxt = 0; 
				uart_vif.tx_start = 1;
				uart_vif.tx_data = tr.tx_data; 
				@(negedge uart_vif.clk);
				uart_vif.start = 0;
				uart_vif.tx_data = 8'hxx; 
			end

		end
	endtask

	
endclass

/////////////////////////////////////////////////////////////////////////////
//
//									03_MONITOR
//
/////////////////////////////////////////////////////////////////////////////


class monitor;

	transaction tr_in , tr_out;
	mailbox #(transaction) mon2scb_in;
	mailbox #(transaction) mon2scb_out;


	virtual uart_interface uart_vif;


	function new( mailbox#(transaction) mon2scb_in,mailbox #(transaction) mon2scb_out,
					virtual uart_interface uart_vif
					);
	
		this.mon2scb_in = mon2scb_in;  
		this.mon2scb_out = mon2scb_out;  
		this.uart_vif = uart_vif;

	endfunction
	
	
	task uart_receive(output logic [7:0] receive_data);

			@(posedge uart_vif.clk);
			#(10416/2);
	
			for(int i=0; i< 8; i++)begin 

			receive_data[i] = uart_vif.tx;
			#(10416);
			
			end

			#(10416);
			#(10416/2);

	endtask











	task run();

		forever begin

			//1.wait start check
			@(posedge uart_vif.clk);
			while(!uart_vif.tx_start)begin
					
					@(posedge uart_vif.clk);

			end

			tr_in = new;
			tr_in.tx_data = uart_vif.tx_data; 
			mon2scb_in.put(tr_in);
		

			tr_out = new;
			uart_receive(tr_out.tx_data);
			tr_out.rst = uart_vif.rst;
			tr_out.tx_busy= uart_vif.tx_busy;
			tr_out.tx = uart_vif.tx;
			mon2scb_out.put(tr_out);


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
	mailbox #(transaction) mon2scb_in;
	mailbox #(transaction) mon2scb_out;
	event gen_next_evt;


	function new(mailbox #(transaction) mon2scb_in, mailbox #(transaction) mon2scb_out,event gen_next_evt);
		this.mon2scb_in = mon2scb_in;
		this.mon2scb_out = mon2scb_out;
		this.gen_next_evt = gen_next_evt;
	endfunction 




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
	mailbox #(transaction) mon2scb_in; 
	mailbox #(transaction) mon2scb_out; 
	mailbox #(transaction) gen2drv_mbox; 
	event gen_next_evt;

	function new(virtual uart_interface uart_vif);
	
		
		gen2drv_mbox = new();
		mon2scb_in = new();
		mon2scb_out = new();
		gen = new(gen2drv_mbox,gen_next_evt);
		drv = new(gen2drv_mbox,uart_vif);
		mon = new(mon2scb_in,mon2scb_out,uart_vif);
		scb = new(mon2scb_in,mon2scb_out,uart_vif,gen_next_evt);

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
environment env;

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
	env = new(uart_if);
	env.run(20000,3);  




	$finish;

end





endmodule
