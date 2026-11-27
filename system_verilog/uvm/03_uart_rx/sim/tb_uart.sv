`timescale 1ns/1ps

`include "uvm_macros.svh"
import uvm_pkg::*;
import uart_package::*;


interface uart_interface(input clk);

	logic rst;
	logic rx;
	logic [7:0] rx_data;
	logic rx_done;

endinterface 




class uart_seq_item extends uvm_sequence_item;       
	

    bit  rst; 
	bit   rx;
	logic rx_done;
	rand bit [7:0] rx_data;
	rand bit [8:0] interval; // range 0~651 clk unit 10 clk 
	rand kind_e kind; 	



	constraint c_rx_data { 
			rx_data inside{[0:255]};
	}


	constraint c_kind_baud { 
			kind dist {FASTER :/ 1 , SLOWER :/ 1, NORMAL :/ 8};  
	}



	
	constraint c_interval { 
			interval inside{[0:65]};

	}
	`uvm_object_utils_begin(uart_seq_item)
	`uvm_field_int (rx_data,UVM_ALL_ON)       // *UVM_ALL_ON 기능 - print/copy/compare 가 wdata를 다룰 수 있도록 등록 
	`uvm_field_enum(kind_e,kind,UVM_ALL_ON)
	`uvm_field_int(interval,UVM_ALL_ON)
	`uvm_object_utils_end


	function new(string name = "uart_seq_item");		
		super.new(name);

	endfunction
	

	function void debug_print(string name);

			`uvm_info(name,$sformatf("rst = %0d, rx = %0d, rx_data = %0d , rx_done = %0d, kind = %0s,interval = %d" ,rst,rx,rx_data,
			rx_done, kind.name(),interval),UVM_MEDIUM)  // sformatf -> string 안에 자료형 값을 넣고 싶을때 -> 출력은 string

	endfunction


endclass


class base_uart_seq extends uvm_sequence #(uart_seq_item);

	`uvm_object_utils(base_uart_seq)
	
	function new(string name = "base_uart_seq");
				super.new(name);	
	endfunction 
	

	virtual function void randomize_item(uart_seq_item item);
		
		if(!item.randomize()) 
			`uvm_fatal(get_type_name(),"randomize fail")

	endfunction


	task body();
		uart_seq_item seq_item;
		seq_item = uart_seq_item::type_id::create("uart_seq_item");

		repeat(SEQ_NUM)begin
		`uvm_info("base_uart_seq","[SEQ-BODY]",UVM_LOW)	
		start_item(seq_item); //driver에서 요청이 올때까지 기다림
		
		randomize_item(seq_item);
	
		seq_item.debug_print("=> SEQUENCE");
		finish_item(seq_item);
		end

	endtask 


endclass


//  시나리오별 시퀀스 상속 부모 : base_uart_seq

//01 모두 random 


/////////////////////////////////////////테스트 시나리오///////////////////////////////////////////////
class uart_rand_seq extends base_uart_seq;
		`uvm_object_utils(uart_rand_seq)
		function new(string name = "uart_rand_seq"); super.new(name); endfunction
endclass


class uart_burst_seq extends base_uart_seq;
		`uvm_object_utils(uart_burst_seq)
		function new(string name = "uart_burst_seq"); super.new(name); endfunction
		
		virtual function void randomize_item(uart_seq_item item);
			if(!item.randomize() with {kind == NORMAL; interval == '0;})
			`uvm_fatal(get_type_name(),"randomize_fail")
		endfunction 
endclass


class uart_normal_seq extends base_uart_seq;
		`uvm_object_utils(uart_normal_seq)
		function new(string name = "uart_normal_seq"); super.new(name); endfunction
		
		virtual function void randomize_item(uart_seq_item item);
			if(!item.randomize() with {kind == NORMAL;})
			`uvm_fatal(get_type_name(),"randomize_fail")
		endfunction 
endclass

class uart_slow_seq extends base_uart_seq;
		`uvm_object_utils(uart_slow_seq)
		function new(string name = "uart_slow_seq"); super.new(name); endfunction
		
		virtual function void randomize_item(uart_seq_item item);
			if(!item.randomize() with {kind == SLOWER;})
			`uvm_fatal(get_type_name(),"randomize_fail")
		endfunction 

endclass


class uart_fast_seq extends base_uart_seq;
		`uvm_object_utils(uart_fast_seq)
		function new(string name = "uart_fast_seq"); super.new(name); endfunction
		
		virtual function void randomize_item(uart_seq_item item);
			if(!item.randomize() with {kind == FASTER;})
			`uvm_fatal(get_type_name(),"randomize_fail")
		endfunction 
		
endclass



class uart_coner_seq extends base_uart_seq;
		`uvm_object_utils(uart_coner_seq)
		bit [7:0] patterns[] = {8'h00,8'hFF,8'hAA,8'h55,8'h01,8'h80};
		function new(string name = "uart_coner_seq"); super.new(name); endfunction
		
	
		task body();
			uart_seq_item seq_item;
			foreach (patterns[i])begin
				seq_item = uart_seq_item::type_id::create("seq_item");
				start_item(seq_item);
				if(!seq_item.randomize() with {rx_data == local::patterns[i]; kind == NORMAL;})
					`uvm_fatal(get_type_name(),"randomize fail")
				finish_item(seq_item);
			end
		endtask	
		

endclass





/////////////////////////////////////////////////////////////////////////////////////////////////////////




class uart_driver extends uvm_driver #(uart_seq_item);
		`uvm_component_utils(uart_driver)  // 등록
		uart_seq_item seq_item;
		virtual uart_interface uart_vif;


		function new(string name = "uart_driver", uvm_component parent);
			super.new(name, parent);
		endfunction



		function void build_phase(uvm_phase phase); 
			super.build_phase(phase);
			if(!uvm_config_db #(virtual uart_interface)::get(this,"","uart_vif",uart_vif))begin
				`uvm_fatal(get_name(),"unable to access  interface") //get_name() - 현재 인스턴스 이름 
			end
			
			`uvm_info("uvm_driver","[BUILD - DRIVER]",UVM_LOW)
		endfunction

		bit[7:0] b_rx_data;
		shortreal PER_FACTOR; 

		task sender(virtual uart_interface vif,uart_seq_item item);
				
				b_rx_data = item.rx_data;
				kind_f(item,PER_FACTOR);

				@(negedge vif.clk); // 프레임 시작을 negedge에 정렬 → DUT(posedge 샘플)와 race 방지
				for(int i= 0; i<10;i++)begin
					if(!i)begin
						vif.rx = 0;
						item.rx = vif.rx;
						item.debug_print("=> DRIVER");
						#(BAUD_TIME*PER_FACTOR);

					end

					else if(i>0 && i<9)begin
						vif.rx = b_rx_data[0];
						item.rx = vif.rx;
						item.debug_print("=> DRIVER");
						#(BAUD_TIME*PER_FACTOR);
						b_rx_data = {1'b0,b_rx_data[7:1]};
					end

					else begin
						vif.rx = 1;
						item.rx = vif.rx;
						item.debug_print("=> DRIVER");
						#(BAUD_TIME*PER_FACTOR);
					end
	
				end
			
		endtask

		task kind_f(uart_seq_item item, output shortreal factor);
			
				if(item.kind == FASTER) factor = 1-BAUD_PERCENT/100; 
				else if(item.kind == SLOWER) factor = 1+BAUD_PERCENT/100 ;
				else factor = 1;
		
		endtask 
		
		task preset();
			uart_vif.rx  = 1; 
			uart_vif.rst = 1;
			repeat(2)@(negedge uart_vif.clk);
			uart_vif.rst = 0;

		endtask

		task run_phase(uvm_phase phase);

				preset();
			
			forever begin
				seq_item_port.get_next_item(seq_item);// 시퀀스에서 아이템 전달 받음 
				repeat(seq_item.interval*10)begin
					uart_vif.rx = 1;
					@(negedge uart_vif.clk);
				end
				sender(uart_vif,seq_item);
				`uvm_info("uart_driver","[FRAME_DONE]",UVM_LOW)
				`uvm_info("uart_driver","=============================================================================================",UVM_LOW)
				seq_item_port.item_done();
			
			end
			

		endtask


endclass

/////////////////////////monitor////////////////////////////////////


class uart_rx_monitor_in extends uvm_monitor;
		`uvm_component_utils(uart_rx_monitor_in)
		virtual uart_interface uart_vif;


		uvm_analysis_port #(uart_seq_item) in_port;  // 

		

		function new(string name = "uart_rx_monitor_in", uvm_component parent);
			super.new(name, parent);
		endfunction


		function void build_phase(uvm_phase phase);  
			
			super.build_phase(phase);	

			if(!uvm_config_db #(virtual uart_interface)::get(this,"","uart_vif",uart_vif))begin
				`uvm_fatal(get_name(),"unable to access  interface") //get_name() - 현재 인스턴스 이름 
			end

			`uvm_info("uart_rx_monitor_in","[BUILD - MONITOR[IN]]",UVM_LOW)
			
			in_port = new("in_port",this);

		endfunction

		//mon_in run task

		//1. rx 수집 : 

		task uart_rx_collector(uart_seq_item item,output bit [7:0] expect_data);

			#(BAUD_TIME/2);
				item.rx = uart_vif.rx;
				item.debug_print("=> MON_IN");
			for(int i=0; i<8; i++)begin

				#(BAUD_TIME);
				expect_data[i] = uart_vif.rx;
				item.rx = uart_vif.rx;
				item.debug_print("=> MON_IN");
			end
		
			#(BAUD_TIME);

		endtask
		
		//2. frame_period 계산
		//3. excute scb, cov write_in(seq_item) 


		task run_phase(uvm_phase phase);
			uart_seq_item seq_item; 
			seq_item = uart_seq_item::type_id::create("seq_mon_in"); //
			`uvm_info("uart_rx_monitor_in","[RUN - MONITOR[IN]]",UVM_LOW)

			forever begin
				wait(!uart_vif.rx); // @ -> 안쓴 이유 : 값의 변화 있었을 때 사용한다. 그럼 @(neqedge !uart_vif.rx) 는 안되나 
				uart_rx_collector(seq_item, seq_item.rx_data);
				seq_item.interval = 0;
				seq_item.rst	  = uart_vif.rst; 
				seq_item.kind	  = NORMAL;
				in_port.write(seq_item);

			end
			

		endtask

	

endclass

class uart_rx_monitor_out extends uvm_monitor;
		`uvm_component_utils(uart_rx_monitor_out)
		virtual uart_interface uart_vif;


		uvm_analysis_port #(uart_seq_item) out_port;  // #(자료형) sender 핸들 



		function new(string name = "uart_rx_monitor_out", uvm_component parent);
			super.new(name, parent);
		endfunction


		function void build_phase(uvm_phase phase);  
			
			super.build_phase(phase);	
			if(!uvm_config_db #(virtual uart_interface)::get(this,"","uart_vif",uart_vif))begin
				`uvm_fatal(get_name(),"unable to access  interface") //get_name() - 현재 인스턴스 이름 
			end
	
			out_port = new("out_port",this);
	
			`uvm_info("uart_rx_monitor_out","[BUILD - MONITOR[OUT]]",UVM_LOW)

		endfunction


		task run_phase(uvm_phase phase);
			uart_seq_item seq_item; 
			seq_item = uart_seq_item::type_id::create("seq_mon_out"); //
			`uvm_info("uart_rx_monitor_in","[RUN - MONITOR[OUT]]",UVM_LOW)

			forever begin
				@(uart_vif.rx_done); // @ -> 안쓴 이유 : 값의 변화 있었을 때 사용한다. 그럼 @(neqedge !uart_vif.rx) 는 안되나 
				seq_item.rx_done = uart_vif.rx_done;
				seq_item.rx_data = uart_vif.rx_data;
				out_port.write(seq_item);

			end
			

		endtask
			

endclass

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




`uvm_analysis_imp_decl(_in)
`uvm_analysis_imp_decl(_out)


class uart_scb extends uvm_scoreboard;
	`uvm_component_utils(uart_scb)
	
	uvm_analysis_imp_in #(uart_seq_item,uart_scb) imp_in;
	uvm_analysis_imp_out #(uart_seq_item,uart_scb) imp_out;


	function new(string name = "uart_scb", uvm_component parent);
		super.new(name,parent);
	endfunction
	

	function void build_phase(uvm_phase phase);
		super.build_phase(phase);
		`uvm_info("uart_scb","[BUILD - SCOREBOARD]",UVM_LOW)
		imp_in = new("imp_in",this);
		imp_out = new("imp_out",this);
	

	endfunction


	logic [7:0] expect_data; 

	virtual function void write_in(uart_seq_item t);
		// stort expect_data for pass / fail 	
		expect_data = t.rx_data;

	endfunction
	
	int total_cnt,pass_cnt, fail_cnt;
	virtual function void write_out(uart_seq_item t);
		// stort expect_data for pass / fail

			total_cnt++;
		if(expect_data == t.rx_data) begin
		
			pass_cnt++;
		end
		else begin
			fail_cnt++;
			
		end


	endfunction

endclass	

///////////////////////////////////////////////// AGENT ////////////////////////////////////////////////////////////////////////////

class uart_agent_in extends uvm_agent;
		`uvm_component_utils(uart_agent_in)

		uart_driver 	drv;
		uart_rx_monitor_in	mon_in;
		uvm_sequencer #(uart_seq_item) uart_sqr;

		function new(string name = "uart_agent_in", uvm_component parent);
			super.new(name, parent);
		endfunction


		function void build_phase(uvm_phase phase);  
			super.build_phase(phase);
			`uvm_info("uart_agent_in","[BUILD - AGENT[IN]]",UVM_LOW)
			
			drv = uart_driver::type_id::create("drv",this); //(name, parent)
			mon_in = uart_rx_monitor_in::type_id::create("mon_in",this); //(name, parent)
			uart_sqr = uvm_sequencer#(uart_seq_item)::type_id::create("sqr",this);

		endfunction

		function void connect_phase(uvm_phase phase);
			super.connect_phase(phase);

			`uvm_info("uart_agent_in","[CONNECT - AGENT[IN]]",UVM_LOW)
			
			drv.seq_item_port.connect(uart_sqr.seq_item_export); // export 시퀀스의 export 아이템을 드라이버의 포트에 연결
								//드라이버의 port를 시퀀서의 export와 연결한다.


		endfunction

endclass


class uart_agent_out extends uvm_agent;
		`uvm_component_utils(uart_agent_out)

		uart_rx_monitor_out	mon_out;

		function new(string name = "uart_agent_out", uvm_component parent);
			super.new(name, parent);
		endfunction


		function void build_phase(uvm_phase phase);  
			super.build_phase(phase);
			`uvm_info("uart_agent_out","[BUILD - AGENT[OUT]]",UVM_LOW)
			
			mon_out = uart_rx_monitor_out::type_id::create("mon_out",this); //(name, parent)

		endfunction


endclass



//
//
//class _coverage extends uvm_subscriber #(uartuart_seq_item);
//	
//		`uvm_component_utils(_coverage)
//		
//		uart_seq_item seq_item;
//
//		covergroup _cg;
//			option.per_instance = 1 ; 
//			
//			cp_wdata: coverpoint sequart_seq_item.wdata {
//				bins range_wdata[] = {[0:255]};
//			}
//		
//			cp_t_addr: coverpoint sequart_seq_item.t_addr {
//				bins range_t_addr[] = {[0:255]};
//			}
//
//		
//			cp_we: coverpoint sequart_seq_item.kind {
//				bins write  = {WRITE};
//				bins read  = {READ};
//			}
//
//			cx_we_addr: cross cp_we, cp_t_addr; 
//
//		endgroup
//	
//
//
//		function new (string name , uvm_component parent);
//			super.new(name,parent);
//			_cg = new();	
//		endfunction
//
//
//		virtual function void write(uart_seq_item t);
//		
//			this.sequart_seq_item = t;
//			this._cg.sample();
//
//		endfunction
//
//
//
//		function void report_phase(uvm_phase phase);
//				super.report_phase(phase);
//
//				`uvm_info("_cov", $sformatf("******************************"),UVM_NONE)				
//				`uvm_info("_cov", $sformatf("******Coverage - report********"),UVM_NONE)				
//				`uvm_info("_cov", $sformatf("Overal = %6.2f", uart_cg.get_coverage()),UVM_NONE)				
//				`uvm_info("_cov", $sformatf("cp_wdata = %6.2f", uart_cg.cp_wdata.get_coverage()),UVM_NONE)				
//				`uvm_info("_cov", $sformatf("cp_t_addr = %6.2f", uart_cg.cp_t_addr.get_coverage()),UVM_NONE)				
//				`uvm_info("_cov", $sformatf("cp_we = %6.2f", uart_cg.cp_we.get_coverage()),UVM_NONE)				
//				`uvm_info("_cov", $sformatf("cx_we_addr = %6.2f", uart_cg.cx_we_addr.get_coverage()),UVM_NONE)				
//				`uvm_info("_cov", $sformatf("******************************"),UVM_NONE)				
//
//
//
//
//		endfunction
//
//
//
//
//
//
//
//
//
//
//endclass





///////////////////////////////////////////////////////ENVIRONMENT////////////////////////////////////////////////////////////////////


class uart_env extends uvm_env;

		`uvm_component_utils(uart_env)

		uart_agent_in agt_in;
		uart_agent_out agt_out;
		uart_scb   scb;
		//uart_coverage cov;

		function new (string name = "uart_env" , uvm_component parent);
			super.new(name, parent);
		endfunction 

		
		function void build_phase(uvm_phase phase); 
			super.build_phase(phase);
			`uvm_info("_env","[BUILD - ENVIRONMENT]",UVM_LOW)
			agt_in  = uart_agent_in::type_id::create("agt_in",this);
			agt_out = uart_agent_out::type_id::create("agt_out",this);
			scb     = uart_scb::type_id::create("scb",this);
		//	cov     = _coverage::type_id::create("cov",this);
		endfunction 


	function void connect_phase(uvm_phase phase);
		super.connect_phase(phase);
		`uvm_info("_env","[CONNECT - ENV]",UVM_LOW)
		agt_in.mon_in.in_port.connect(scb.imp_in); // env에서 모니터와 스코어보드를 연결한다 
		agt_out.mon_out.out_port.connect(scb.imp_out);


	//	agt.mon.sender.connect(cov.analysis_export); // 모니터는 부르는 자 / 커버리지는 불리는 자 ?:
  		
	endfunction


endclass

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


class base_uart_test extends uvm_test;
		`uvm_component_utils(base_uart_test)       // 컴포넌트는 uvm test와 연결
		
		uart_env env;
		base_uart_seq seq;

		function new (string name="base_uart_test" , uvm_component parent);
			super.new(name, parent);
		endfunction 

	

		function void build_phase(uvm_phase phase); 
			super.build_phase(phase);
			`uvm_info("base_uart_test","[BUILD - TEST]",UVM_LOW)
			env = uart_env::type_id::create("env",this);
			seq = base_uart_seq::type_id::create("seq",this);
		endfunction 



		task run_phase(uvm_phase phase);// run_task라고 생각하면 된다 
			phase.raise_objection(this); // 시퀀스 -> 시퀀서 -> 드라이버  시작을 알림  
			`uvm_info("base_uart_test","[TEST_BASE - RUN]",UVM_LOW)
			seq.start(env.agt_in.uart_sqr); // env 내부 agt 의 시퀀서에게 시퀀스를 전달하라고 신호를 보냄 
			`uvm_info("uvm_test_","[TEST_BASE - END]",UVM_LOW)
			phase.drop_objection(this); // drop - 끝 // run_phase 종료 i
		endtask 
		
		

		function void end_of_elaboration_phase(uvm_phase phase);
				uvm_factory f = uvm_factory::get();
				uvm_root::get().print_topology();
				f.print();
		endfunction

endclass


class uart_fast_test extends base_uart_test;
		`uvm_component_utils(uart_fast_test)       // 컴포넌트는 uvm test와 연결

		function new (string name = "uart_fast_test", uvm_component parent);
			super.new(name, parent);
		endfunction 

	
		virtual function void build_phase(uvm_phase phase); 
			base_uart_seq::type_id::set_type_override(uart_fast_seq::get_type());
			super.build_phase(phase);
		endfunction 
		
endclass



module tb_uart;
	logic clk = 0;
	uart_interface uart_if(clk);
	
always #5 clk = ~clk;

uart_top dut(
	 .rst     (uart_if.rst),
	 .clk     (clk),
	 .rx      (uart_if.rx),
	 .rx_data (uart_if.rx_data),
	 .rx_done (uart_if.rx_done)
);


initial begin 

	uvm_config_db #(virtual uart_interface)::set(null,"*","uart_vif",uart_if);

	run_test("base_uart_test");


	$finish;

end


endmodule





