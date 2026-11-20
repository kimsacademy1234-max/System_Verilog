`ifndef I2C_AGENT_SV
`define I2C_AGENT_SV

`include "uvm_macros.svh"
import uvm_pkg::*;

`include "I2C_sequence_item.sv"
`include "I2C_driver.sv"
`include "I2C_monitor.sv"


typedef uvm_sequencer #(I2C_sequence_item) I2C_sequencer;

class I2C_agent extends uvm_agent;
    `uvm_component_utils(I2C_agent)

  
    I2C_driver    drv;
    I2C_sequencer sqr;
    I2C_monitor   mon;

  
    uvm_analysis_port #(I2C_sequence_item) agt_ap_master;
    uvm_analysis_port #(I2C_sequence_item) agt_ap_slave;

    function new(string name, uvm_component parent);
        super.new(name, parent);
        agt_ap_master = new("agt_ap_master", this);
        agt_ap_slave  = new("agt_ap_slave", this);
    endfunction //new()

    virtual function void build_phase(uvm_phase phase);
        super.build_phase(phase);

      
        mon = I2C_monitor::type_id::create("mon", this);

        if (get_is_active() == UVM_ACTIVE) begin
            `uvm_info(get_type_name(), "Agent is ACTIVE: Building Sequencer and Driver", UVM_LOW)
            sqr = I2C_sequencer::type_id::create("sqr", this);
            drv = I2C_driver::type_id::create("drv", this);
        end else begin
            `uvm_info(get_type_name(), "Agent is PASSIVE: Building Monitor only", UVM_LOW)
        end
    endfunction

    virtual function void connect_phase(uvm_phase phase);
        super.connect_phase(phase);

        
        mon.mon_ap_master.connect(this.agt_ap_master);
        mon.mon_ap_slave.connect(this.agt_ap_slave);

        
        if (get_is_active() == UVM_ACTIVE) begin
            drv.seq_item_port.connect(sqr.seq_item_export);
        end
    endfunction

endclass //

`endif