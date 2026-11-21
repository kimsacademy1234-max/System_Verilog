


`ifndef I2C_MONITOR_SV
`define I2C_MONITOR_SV

`include "uvm_macros.svh"
import uvm_pkg::*;
`include "I2C_sequence_item.sv"

class I2C_monitor extends uvm_monitor;
    `uvm_component_utils(I2C_monitor)

    virtual I2C_interface vif;

    uvm_analysis_port #(I2C_sequence_item) mon_ap_master;
    uvm_analysis_port #(I2C_sequence_item) mon_ap_slave;

    function new(string name, uvm_component parent);
        super.new(name, parent);
        mon_ap_master = new("mon_ap_master", this);
        mon_ap_slave  = new("mon_ap_slave", this);
    endfunction 

    virtual function void build_phase(uvm_phase phase);
        super.build_phase(phase);
        if (!uvm_config_db#(virtual I2C_interface)::get(this, "", "vif", vif)) begin
            `uvm_fatal(get_type_name(), "monitor에서 uvm_config_db 에러 발생. (vif 못 찾음)")
        end
    endfunction

    virtual task run_phase(uvm_phase phase);
        `uvm_info(get_type_name(), "monitor 동작 시작...", UVM_MEDIUM)
        fork
            monitor_master_side();
            monitor_slave_side();
        join
    endtask

    
    task monitor_master_side();
        I2C_sequence_item item;
        
        forever begin
            @(vif.mon_cb);
            
            
            if (vif.mon_cb.m_rd_en === 1'b1) begin
                item = I2C_sequence_item::type_id::create("item_master");
                item.op_type   = I2C_READ;
                item.s_tx_data = vif.mon_cb.s_tx_data; 
                mon_ap_master.write(item); 
                
                
                wait_for_i2c_done();
                item.m_rx_data = vif.mon_cb.m_rx_data;
                mon_ap_master.write(item); 
            end
            
            
            else if (vif.mon_cb.m_wr_en === 1'b1) begin
                item = I2C_sequence_item::type_id::create("item_master");
                item.op_type   = I2C_WRITE;
                item.m_tx_data = vif.mon_cb.m_tx_data;
                mon_ap_master.write(item); 
                
                wait_for_i2c_done();
            end
        end
    endtask 

    
    task wait_for_i2c_done();
        while (vif.mon_cb.m_busy === 1'b0) @(vif.mon_cb);
        while (vif.mon_cb.m_busy === 1'b1) @(vif.mon_cb);
    endtask

    
    task monitor_slave_side();
        I2C_sequence_item item;
        forever begin
            @(vif.mon_cb);
            if (vif.mon_cb.s_rx_valid === 1'b1) begin
                @(vif.mon_cb); 
                item = I2C_sequence_item::type_id::create("item_slave");
                item.op_type = I2C_WRITE;
                item.s_rx_data = vif.mon_cb.s_rx_data; 
                mon_ap_slave.write(item);
            end
        end
    endtask 

endclass 

`endif