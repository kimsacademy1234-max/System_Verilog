`ifndef I2C_SEQUENCE_ITEM_SV
`define I2C_SEQUENCE_ITEM_SV

`include "uvm_macros.svh"
import uvm_pkg::*;


typedef enum bit {
    I2C_WRITE = 1'b0, 
    I2C_READ  = 1'b1
} i2c_op_e;

class I2C_sequence_item extends uvm_sequence_item;
    
   
    rand i2c_op_e    op_type;   
    rand logic [7:0] m_tx_data; 
    rand logic [7:0] s_tx_data; 

    
    logic [7:0] m_rx_data;       
    logic [7:0] s_rx_data;       

  
    `uvm_object_utils_begin(I2C_sequence_item)
        `uvm_field_enum(i2c_op_e, op_type,   UVM_ALL_ON)
        `uvm_field_int(m_tx_data,            UVM_ALL_ON | UVM_HEX)
        `uvm_field_int(s_tx_data,            UVM_ALL_ON | UVM_HEX)
        `uvm_field_int(m_rx_data,            UVM_ALL_ON | UVM_HEX)
        `uvm_field_int(s_rx_data,            UVM_ALL_ON | UVM_HEX)
    `uvm_object_utils_end

    
    function new(string name = "I2C_sequence_item");
        super.new(name);
    endfunction 

    
    virtual function string convert2string();
        if (op_type == I2C_WRITE) begin
            return $sformatf("[I2C_WRITE] Master TX = 8'h%0h | Slave RX = 8'h%0h", m_tx_data, s_rx_data);
        end else begin
            return $sformatf("[I2C_READ]  Slave TX = 8'h%0h | Master RX = 8'h%0h", s_tx_data, m_rx_data);
        end
    endfunction

endclass 

`endif