`timescale 1ns/1ps

`include "uvm_macros.svh"
import uvm_pkg::*;


`include "I2C_interface.sv"
`include "I2C_sequence_item.sv"
`include "I2C_sequence.sv"
`include "I2C_driver.sv"
`include "I2C_monitor.sv"
`include "I2C_agent.sv"
`include "I2C_scoreboard.sv"
`include "I2C_env.sv"
`include "I2C_test.sv"

module tb_top ();

    
    logic clk;
    logic reset;

   
    initial clk = 0;
    always #5 clk = ~clk;

    
    I2C_interface vif(clk, reset);

   
    pullup(vif.scl);
    pullup(vif.sda);

    
    I2C_core_top dut(
        .clk        (clk),
        .reset      (reset),
        
        .m_tx_data  (vif.m_tx_data),
        .m_wr_en    (vif.m_wr_en),
        .m_rd_en    (vif.m_rd_en),
        .m_rx_data  (vif.m_rx_data),
        .m_busy     (vif.m_busy),
        
        .s_tx_data  (vif.s_tx_data),
        .s_rx_data  (vif.s_rx_data),
        .s_rx_valid (vif.s_rx_valid),
        
        .scl        (vif.scl),
        .sda        (vif.sda)
    );

    initial begin
        reset = 1'b1;
        repeat(5) @(posedge clk);
        reset = 1'b0;
    end

    initial begin
        uvm_config_db#(virtual I2C_interface)::set(null, "*", "vif", vif);

        run_test(); 
    end

    initial begin
        $fsdbDumpfile("novas.fsdb");
        $fsdbDumpvars(0, tb_top, "+all");
        
    end

endmodule