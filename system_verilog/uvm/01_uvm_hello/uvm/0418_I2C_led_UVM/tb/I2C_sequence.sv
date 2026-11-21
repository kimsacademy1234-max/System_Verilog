`ifndef I2C_SEQUENCE_SV
`define I2C_SEQUENCE_SV

`include "uvm_macros.svh"
import uvm_pkg::*;
`include "I2C_sequence_item.sv"


class I2C_base_seq extends uvm_sequence#(I2C_sequence_item);
    `uvm_object_utils(I2C_base_seq)

    int num_loop = 10;

    function new(string name = "I2C_base_seq");
        super.new(name);
    endfunction 

  
    task write_data(bit [7:0] d);
        I2C_sequence_item item = I2C_sequence_item::type_id::create("item");

        start_item(item);
        if (!item.randomize() with {op_type == I2C_WRITE; m_tx_data == d;}) begin
            `uvm_fatal(get_type_name(), "write_data() Randomize fail!")
        end
        finish_item(item);

        `uvm_info(get_type_name(), $sformatf("write_data() 지시 완료: data = 8'h%0h", d), UVM_HIGH)
    endtask //

   
    task read_data(bit [7:0] s_d);
        I2C_sequence_item item = I2C_sequence_item::type_id::create("item");

        start_item(item);
      
        if (!item.randomize() with {op_type == I2C_READ; s_tx_data == s_d;}) begin
            `uvm_fatal(get_type_name(), "read_data() Randomize fail!")
        end
        finish_item(item);

        `uvm_info(get_type_name(), $sformatf("read_data() 지시 완료: slave expected data = 8'h%0h", s_d), UVM_HIGH)
    endtask 

    virtual task body();
      
    endtask 

endclass 


class I2C_rand_seq extends I2C_base_seq;
    `uvm_object_utils(I2C_rand_seq)

    function new(string name= "I2C_rand_seq");
        super.new(name);
    endfunction 

    virtual task body();
        `uvm_info(get_type_name(), $sformatf("Starting Random Sequence (%0d times)...", num_loop), UVM_LOW)

        repeat(num_loop) begin
            I2C_sequence_item item = I2C_sequence_item::type_id::create("item");

            start_item(item);
            
            if (!item.randomize()) begin
                `uvm_fatal(get_type_name(), "Randomize() FAIL!!")
            end
            finish_item(item);
        end
    endtask 
endclass 


class I2C_pattern_seq extends I2C_base_seq;
    `uvm_object_utils(I2C_pattern_seq)

    function new(string name="I2C_pattern_seq");
        super.new(name);
    endfunction //new()

    virtual task body();
        `uvm_info(get_type_name(), "Starting Pattern & Mixed Sequence...", UVM_LOW)
        
       
        `uvm_info(get_type_name(), "--- [Phase 1] Write Patterns ---", UVM_LOW)
        write_data(8'h00); 
        write_data(8'hFF); 
        write_data(8'h55); 
        write_data(8'hAA); 
        
       
        `uvm_info(get_type_name(), "--- [Phase 2] Read Patterns ---", UVM_LOW)
        read_data(8'h00);
        read_data(8'hFF);
        read_data(8'h55);
        read_data(8'hAA);

       
        `uvm_info(get_type_name(), "--- [Phase 3] Back-to-Back Mixed ---", UVM_LOW)
        write_data(8'h11);
        read_data(8'h22);
        write_data(8'h33);
        read_data(8'h44);
        
    endtask

endclass

`endif
