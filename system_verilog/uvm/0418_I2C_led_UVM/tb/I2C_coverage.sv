`ifndef I2C_COVERAGE_SV
`define I2C_COVERAGE_SV

`include "uvm_macros.svh"
import uvm_pkg::*;
`include "I2C_sequence_item.sv"

class I2C_coverage extends uvm_subscriber #(I2C_sequence_item);
    `uvm_component_utils(I2C_coverage)
    
    I2C_sequence_item tx;

    
    covergroup I2C_cg;
        // 1. 동작 타입 커버리지 
        cp_rw : coverpoint tx.op_type {
            bins write_op = {I2C_WRITE};
            bins read_op  = {I2C_READ};
        }

        // 2. 마스터 전송 데이터 커버리지 
        cp_m_tx_data : coverpoint tx.m_tx_data {
            bins all_zeros = {8'h00};
            bins all_ones  = {8'hFF};
            bins toggle_55 = {8'h55};
            bins toggle_aa = {8'hAA};
            // APB 형식의 대역 분할 적용
            bins data_low      = {[8'h01 : 8'h3F]};
            bins data_mid_low  = {[8'h40 : 8'h7F]};
            bins data_mid_hi   = {[8'h80 : 8'hBF]};
            bins data_high     = {[8'hC0 : 8'hFE]};
        }

        // 3. 마스터 수신 데이터 커버리지 
        cp_m_rx_data : coverpoint tx.m_rx_data {
            bins all_zeros = {8'h00};
            bins all_ones  = {8'hFF};
            bins toggle_55 = {8'h55};
            bins toggle_aa = {8'hAA};
            bins other     = default;
        }

        // 4. 크로스 커버리지 
        cx_rw_data : cross cp_rw, cp_m_tx_data {
           
            ignore_bins ignore_read_tx = binsof(cp_rw) intersect {I2C_READ};
        }

    endgroup

    function new(string name, uvm_component parent);
        super.new(name, parent);
        I2C_cg = new();
    endfunction //new()

   
    virtual function void write(I2C_sequence_item t);
        tx = t;
        
        
        if (tx.op_type == I2C_READ && tx.m_rx_data === 8'hxx) return;
        
        I2C_cg.sample();
    endfunction

    // 시뮬레이션 종료 시 결과 요약 리포트
    virtual function void report_phase(uvm_phase phase);
        `uvm_info(get_type_name(), "======= I2C Coverage Summary ===========", UVM_LOW);
        `uvm_info(get_type_name(), $sformatf(" Overall Coverage : %.1f%%", I2C_cg.get_coverage()), UVM_LOW);
        `uvm_info(get_type_name(), $sformatf(" Operation (RW)   : %.1f%%", I2C_cg.cp_rw.get_coverage()), UVM_LOW);
        `uvm_info(get_type_name(), $sformatf(" Master TX Data   : %.1f%%", I2C_cg.cp_m_tx_data.get_coverage()), UVM_LOW);
        `uvm_info(get_type_name(), $sformatf(" Master RX Data   : %.1f%%", I2C_cg.cp_m_rx_data.get_coverage()), UVM_LOW);
        `uvm_info(get_type_name(), $sformatf(" Cross(RW, Data)  : %.1f%%", I2C_cg.cx_rw_data.get_coverage()), UVM_LOW);
        `uvm_info(get_type_name(), "========================================\n", UVM_LOW);
    endfunction

endclass

`endif