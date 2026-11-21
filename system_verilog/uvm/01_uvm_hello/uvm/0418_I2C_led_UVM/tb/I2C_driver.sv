`ifndef I2C_DRIVER_SV
`define I2C_DRIVER_SV

`include "uvm_macros.svh"
import uvm_pkg::*;
`include "I2C_sequence_item.sv"

class I2C_driver extends uvm_driver #(I2C_sequence_item);
    `uvm_component_utils(I2C_driver)
    
    // I2C 가상 인터페이스
    virtual I2C_interface vif;

    function new(string name, uvm_component parent);
        super.new(name, parent);
    endfunction //new()

    virtual function void build_phase(uvm_phase phase);
        super.build_phase(phase);
        if (!uvm_config_db#(virtual I2C_interface)::get(this, "", "vif", vif)) begin
            `uvm_fatal(get_type_name(), "driver에서 uvm_config_db 에러 발생. (vif 못 찾음)");
        end
    endfunction

    virtual task run_phase(uvm_phase phase);
        i2c_bus_init();
        
        
        wait(vif.reset == 0); 
        `uvm_info(get_type_name(), "리셋 해제 확인. 트랜잭션 대기중...", UVM_MEDIUM)

        forever begin
            I2C_sequence_item tx;
            seq_item_port.get_next_item(tx);
            driver_i2c(tx);
            seq_item_port.item_done();
        end
    endtask

    
    task i2c_bus_init();
        vif.drv_cb.m_wr_en   <= 0;
        vif.drv_cb.m_rd_en   <= 0;
        vif.drv_cb.m_tx_data <= 0;
        vif.drv_cb.s_tx_data <= 0;
    endtask //

    
    task driver_i2c(I2C_sequence_item tx);
        
        @(vif.drv_cb);
        if (tx.op_type == I2C_WRITE) begin
            vif.drv_cb.m_tx_data <= tx.m_tx_data;
            vif.drv_cb.m_wr_en   <= 1;
        end else begin
            vif.drv_cb.s_tx_data <= tx.s_tx_data;
            vif.drv_cb.m_rd_en   <= 1;
        end

       
        @(vif.drv_cb);
        vif.drv_cb.m_wr_en <= 0;
        vif.drv_cb.m_rd_en <= 0;

        
        while(!vif.drv_cb.m_busy) @(vif.drv_cb);
        
        
        while(vif.drv_cb.m_busy) @(vif.drv_cb);

        
        if (tx.op_type == I2C_READ) begin
            tx.m_rx_data = vif.drv_cb.m_rx_data;
        end

        
        @(vif.drv_cb);
        
        
        `uvm_info(get_type_name(), $sformatf("drv i2c 구동 완료:\n%s", tx.sprint()), UVM_MEDIUM)

    endtask //

endclass //

`endif