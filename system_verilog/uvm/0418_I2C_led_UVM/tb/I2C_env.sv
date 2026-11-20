`ifndef I2C_ENVIRONMENT_SV
`define I2C_ENVIRONMENT_SV

`include "uvm_macros.svh"
import uvm_pkg::*;

`include "I2C_agent.sv"
`include "I2C_scoreboard.sv"
`include "I2C_coverage.sv" 

class I2C_env extends uvm_env;
    `uvm_component_utils(I2C_env)

    I2C_agent      agt;
    I2C_scoreboard scb;
    I2C_coverage cov;

    function new(string name, uvm_component parent);
        super.new(name, parent);
    endfunction 

    virtual function void build_phase(uvm_phase phase);
        super.build_phase(phase);
        `uvm_info(get_type_name(), "Building Agent and Scoreboard...", UVM_LOW)
        
        agt = I2C_agent::type_id::create("agt", this);
        scb = I2C_scoreboard::type_id::create("scb", this);
         cov =I2C_coverage::type_id::create("cov", this);
    endfunction

    virtual function void connect_phase(uvm_phase phase);
        super.connect_phase(phase);
        `uvm_info(get_type_name(), "Connecting ports...", UVM_LOW)
    
        
        agt.agt_ap_master.connect(scb.master_imp);
        agt.agt_ap_slave.connect(scb.slave_imp);
    
        
         agt.agt_ap_master.connect(cov.analysis_export);
    endfunction

endclass //

`endif