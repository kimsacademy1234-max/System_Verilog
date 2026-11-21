`timescale 1ns / 1ps

interface I2C_interface(
    input logic clk, 
    input logic reset
);

 

  
    logic [7:0] m_tx_data;
    logic       m_wr_en;
    logic       m_rd_en;

  
    logic [7:0] m_rx_data;
    logic       m_busy;

   
    logic [7:0] s_tx_data;

   
    logic [7:0] s_rx_data;
    logic       s_rx_valid;

    
    wire        scl;
    wire        sda;


    clocking drv_cb @(posedge clk);
        default input #1step output #0; 
        
        
        output m_tx_data;
        output m_wr_en;
        output m_rd_en;
        output s_tx_data;
        
       
        input  m_busy;
        input  m_rx_data;
    endclocking


    clocking mon_cb @(posedge clk);
        default input #1step; 
        
        input m_tx_data;
        input m_wr_en;
        input m_rd_en;
        input m_rx_data;
        input m_busy;
        
        input s_tx_data;
        input s_rx_data;
        input s_rx_valid;
        
        input scl;
        input sda;
    endclocking


    modport mp_drv(clocking drv_cb, input clk, input reset);   
    modport mp_mon(clocking mon_cb, input clk, input reset);

endinterface : I2C_interface