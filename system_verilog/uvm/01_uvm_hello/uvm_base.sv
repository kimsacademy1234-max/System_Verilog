

`include "uvm_macros.svh"
import uvm_pkg::*;


//===================================================================================
//  	interface, virtual interface 
//===================================================================================

interface base_interface(input clk);

	logic [7:0] wdata;   // drive wdata 
	logic [7:0] rdata;	// monitor rdata
	logic [7:0] addr;	// drive  if ( kind == WRITE ) we = 1 
	logic we; 
	

endinterface 





//===================================================================================
//   트랜잭션이라 생각하면 됨 - uvm_sequence_item 
//===================================================================================


typedef enum { READ, WRITE} kind_e;

class base_item extends uvm_sequence_item;       




	rand bit [7:0] wdata;
	rand bit [7:0] t_addr;
	rand kind_e kind;

	logic [7:0] rdata;
	

	constraint c_addr { 
			t_addr inside{[0:255]};
	}

	// 아이템 등록

	`uvm_object_utils_begin(base_item)
	`uvm_field_int (wdata,UVM_ALL_ON)       // *UVM_ALL_ON 기능 - print/copy/compare 가 wdata를 다룰 수 있도록 등록 
	`uvm_field_int (t_addr,UVM_ALL_ON)
	`uvm_field_enum(kind_e,kind,UVM_ALL_ON)
	`uvm_object_utils_end


	function new(string name = " base_item");
		
		super.new(name);

	endfunction
	
	function void debug_print(string name);

			`uvm_info(name,$sformatf("wdata = %d, t_addr = %d, kind = %d",wdata,
			t_addr, kind),UVM_MEDIUM)  // sformatf -> string 안에 자료형 값을 넣고 싶을때 -> 출력은 string

	endfunction


endclass






//===================================================================================
//
//									UVM 시퀀스 	
//
//			어떤 데이터를 보낼 지 결정해야한다. -> 아이템이 여러개일 수 있으므로,
// 			파라미터화 해서 보낼 수 있다. -> 즉 지정이 필요함 
//===================================================================================

class base_seq extends uvm_sequence #(base_item);

	`uvm_object_utils(base_seq)

	base_item seq_item;
	
	function new(string name = "base_seq");
				super.new(name);	
	endfunction 

	task body();
		repeat(10)begin
		seq_item = base_item::type_id::create("base_seq_item");
		`uvm_info("base_seq","body - 1 start", UVM_LOW)
		
		start_item(seq_item); //driver에서 요청이 올때까지 기다림 
			seq_item.randomize();
			if(!seq_item.randomize())begin
		
				`uvm_fatal("base_seq","fail base_item randomized")

			end
		
			seq_item.debug_print("=>SEQUENCE");
	
			finish_item(seq_item);


		end
	endtask 




endclass






//===================================================================================
//
//							UVM  컴포넌트 
//		
//
//===================================================================================

// 드라이버는 parameter화 클래스임 - sequence item을 받아서 
// 등록 -> 생성 -> config 

class base_driver extends uvm_driver #(base_item);
		`uvm_component_utils(base_driver)  // 등록
		base_item seq_item;
		virtual base_interface base_vif;


		function new(string name, uvm_component parent);
			super.new(name, parent);
		endfunction


		// configration  

		function void build_phase(uvm_phase phase); 
			super.build_phase(phase);
			if(!uvm_config_db #(virtual base_interface)::get(this,"","base_vif",base_vif))begin
				`uvm_fatal(get_name(),"unable to access base interface") //get_name() - 현재 인스턴스 이름 
			end
			
			`uvm_info("base_driver","build_phase-driver",UVM_LOW)
		endfunction

		task run_phase(uvm_phase phase);
			
			forever begin
				seq_item_port.get_next_item(seq_item);// 시퀀스에서 아이템 전달 받음 
				@(negedge base_vif.clk);
				base_vif.addr = seq_item.t_addr;	
				base_vif.wdata = seq_item.wdata;

				
				if(seq_item.kind == WRITE)begin
					base_vif.we = 1;
				end
				else begin
					base_vif.we = 0;
				end
				
				`uvm_info("base_driver","run_phase - driver",UVM_LOW)
				seq_item_port.item_done();
				seq_item.debug_print("=>DRIVER");
			end
			
			sender.write(seq_item);

		endtask


endclass


//===================================================================================
//
// 				모니터는 파라미터화 클래스가 아님
//
//===================================================================================

class base_monitor extends uvm_monitor;
		`uvm_component_utils(base_monitor)
		base_item seq_item; 
		virtual base_interface base_vif;


		uvm_analysis_port #(base_item) sender;  // #(자료형) sender 핸들 



		function new(string name, uvm_component parent);
			super.new(name, parent);
		endfunction


		function void build_phase(uvm_phase phase);  
			
			super.build_phase(phase);
			
			sender = new("WRITE",this);    // 비로소 모니터에 포트가 하나 만들어진다. 

			
			if(!uvm_config_db #(virtual base_interface)::get(this,"","base_vif",base_vif))begin
				`uvm_fatal(get_name(),"unable to access base interface") //get_name() - 현재 인스턴스 이름 
			end

			`uvm_info("base_monitor","build_phase - monitor",UVM_LOW)

		endfunction


		task run_phase(uvm_phase phase);
			forever begin
				seq_item = base_item::type_id::create("base_seq_item");
				@(posedge base_vif.clk);
				#1;
				seq_item.t_addr= base_vif.addr 
                seq_item.wdata= base_vif.wdata
				seq_item.rdata= base_vif.rdata

				
				if(base_vif.we) seq_item.kind = WRITE;
				else seq_item.kind = READ;
			end
		endtask




endclass

//===================================================================================


// agent 안에 드라이버와 모니터 객체가 있음 
//===================================================================================
class base_agent extends uvm_agent;
		`uvm_component_utils(base_agent)

		base_driver 	drv;
		base_monitor	mon;
		uvm_sequencer #(base_item) base_sqr;

		function new(string name, uvm_component parent);
			super.new(name, parent);
		endfunction


		function void build_phase(uvm_phase phase);  
			super.build_phase(phase);
			`uvm_info("base_agent","build_phase - agent",UVM_LOW)
			
			drv = base_driver::type_id::create("drv",this); //(name, parent)
			mon = base_monitor::type_id::create("mon",this); //(name, parent)
			base_sqr = uvm_sequencer#(base_item)::type_id::create("sqr",this);

		endfunction


		function void connect_phase(uvm_phase phase);

			drv.seq_item_port.connect(base_sqr.seq_item_export); // export 시퀀스의 export 아이템을 드라이버의 포트에 연결
			


		endfunction





endclass


//===================================================================================
class base_env extends uvm_env;

		`uvm_component_utils(base_env)

		base_agent agt;


		function new (string name , uvm_component parent);
			super.new(name, parent);
		endfunction 

		
		function void build_phase(uvm_phase phase); 
			super.build_phase(phase);
			`uvm_info("base_env","build_phase - env",UVM_LOW)
			agt = base_agent::type_id::create("agt",this);

		endfunction 




endclass



//===================================================================================

class uvm_test_base extends uvm_test;
		`uvm_component_utils(uvm_test_base)       // 컴포넌트는 uvm test와 연결
		
		base_seq seq; 
		base_env env;

		function new (string name , uvm_component parent);
			super.new(name, parent);
		endfunction 

	
		// configration phase

		function void build_phase(uvm_phase phase); 
			super.build_phase(phase);
			`uvm_info("uvm_test_base","build_phase - test",UVM_LOW)
			env = base_env::type_id::create("env",this);
			seq = base_seq::type_id::create("seq",this);
		endfunction 


		//exceute phase 

		task run_phase(uvm_phase phase);// run_task라고 생각하면 된다 
			phase.raise_objection(this); // 시퀀스 -> 시퀀서 -> 드라이버  시작을 알림  
			`uvm_info("uvm_test_base","hello uvm",UVM_LOW)
			seq.start(env.agt.base_sqr); // env 내부 agt 의 시퀀서에게 시퀀스를 전달하라고 신호를 보냄 


			#100;
			`uvm_info("uvm_test_base","end of uvm test_base",UVM_LOW)
			phase.drop_objection(this); // drop - 끝 // run_phase 종료 i
			#10;
		endtask 
		

		

		function void end_of_elaboration_phase(uvm_phase phase);
				uvm_root::get().print_topology();
		endfunction


endclass


module tb_top;
	logic clk = 0;
	base_interface base_if(clk);
	
always #5 clk = ~clk;

sram dut(

	 .clk  (base_if.clk),
	 .addr (base_if.addr),
	 .wdata(base_if.wdata),
	 .we   (base_if.we),
	 .rdata(base_if.rdata) 
);
initial begin

	$fsdbDumpfile("novas.fsdb");
	$fsdbDumpvars(0);


end


initial begin 

	// 인터페이스를 uvm_db에 등록한다
	uvm_config_db #(virtual base_interface)::set(null,"*","base_vif",base_if);

	run_test("uvm_test_base");


$finish;

end


endmodule





