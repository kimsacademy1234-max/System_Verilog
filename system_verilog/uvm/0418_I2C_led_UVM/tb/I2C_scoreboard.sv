`ifndef I2C_SCOREBOARD_SV
`define I2C_SCOREBOARD_SV

`include "uvm_macros.svh"
import uvm_pkg::*;
`include "I2C_sequence_item.sv"


`uvm_analysis_imp_decl(_master)
`uvm_analysis_imp_decl(_slave)

class I2C_scoreboard extends uvm_scoreboard;
    `uvm_component_utils(I2C_scoreboard)


    uvm_analysis_imp_master #(I2C_sequence_item, I2C_scoreboard) master_imp;
    uvm_analysis_imp_slave  #(I2C_sequence_item, I2C_scoreboard) slave_imp;

 
    I2C_sequence_item write_expected_q[$]; 
    I2C_sequence_item read_expected_q[$];  

    int match_cnt = 0;
    int error_cnt = 0;

    function new(string name, uvm_component parent);
        super.new(name, parent);
        master_imp = new("master_imp", this);
        slave_imp  = new("slave_imp", this);
    endfunction 




 
    virtual function void write_master(I2C_sequence_item item);
        I2C_sequence_item cloned_item;
        $cast(cloned_item, item.clone());

        if (cloned_item.op_type == I2C_WRITE) begin
            
            write_expected_q.push_back(cloned_item);
            `uvm_info(get_type_name(), $sformatf("[SB_WRITE_STORE] Master sent: 8'h%0h", cloned_item.m_tx_data), UVM_HIGH)
        end else if (cloned_item.op_type == I2C_READ) begin
            
        
            if (cloned_item.m_rx_data === 8'hxx) begin
                read_expected_q.push_back(cloned_item);
                `uvm_info(get_type_name(), $sformatf("[SB_READ_STORE] Slave will send: 8'h%0h", cloned_item.s_tx_data), UVM_HIGH)
            end 
           
            else begin
                I2C_sequence_item exp_item;

                if (read_expected_q.size() == 0) begin
                    `uvm_error(get_type_name(), $sformatf("Master finished Read (8'h%0h) but Q is empty!", cloned_item.m_rx_data))
                    error_cnt++;
                end else begin
                    exp_item = read_expected_q.pop_front();
                    if (cloned_item.m_rx_data === exp_item.s_tx_data) begin
                        `uvm_info(get_type_name(), $sformatf("[SB_PASS_READ] MATCH! Slave sent: 8'h%0h, Master rx: 8'h%0h", exp_item.s_tx_data, cloned_item.m_rx_data), UVM_LOW)
                        match_cnt++;
                    end else begin
                        `uvm_error(get_type_name(), $sformatf("[SB_FAIL_READ] MISMATCH! Slave sent: 8'h%0h, Master rx: 8'h%0h", exp_item.s_tx_data, cloned_item.m_rx_data))
                        error_cnt++;
                    end
                end
            end
        end
    endfunction

   
    virtual function void write_slave(I2C_sequence_item item);
        I2C_sequence_item cloned_item;
        $cast(cloned_item, item.clone());

        if (cloned_item.op_type == I2C_WRITE) begin
           
            I2C_sequence_item exp_item;

            if (write_expected_q.size() == 0) begin
                `uvm_error(get_type_name(), $sformatf("Slave received data (8'h%0h) but Master never sent anything (Q empty)!", cloned_item.s_rx_data))
                error_cnt++;
            end else begin
                exp_item = write_expected_q.pop_front();

               
                if (cloned_item.s_rx_data === exp_item.m_tx_data) begin
                    `uvm_info(get_type_name(), $sformatf("[SB_PASS_WRITE] MATCH! Master tx: 8'h%0h, Slave rx: 8'h%0h", exp_item.m_tx_data, cloned_item.s_rx_data), UVM_LOW)
                    match_cnt++;
                end else begin
                    `uvm_error(get_type_name(), $sformatf("[SB_FAIL_WRITE] MISMATCH! Master tx: 8'h%0h, Slave rx: 8'h%0h", exp_item.m_tx_data, cloned_item.s_rx_data))
                    error_cnt++;
                end
            end

        end else if (cloned_item.op_type == I2C_READ) begin
           
        end
    endfunction

   
    virtual function void check_phase(uvm_phase phase);
        super.check_phase(phase);

        if (write_expected_q.size() > 0) begin
            `uvm_error(get_type_name(), $sformatf("Simulation ended but Slave never received %0d written items!", write_expected_q.size()))
            error_cnt += write_expected_q.size();
        end
        if (read_expected_q.size() > 0) begin
             `uvm_error(get_type_name(), $sformatf("Simulation ended but Master never finished reading %0d items!", read_expected_q.size()))
             error_cnt += read_expected_q.size();
        end
    endfunction


    virtual function void report_phase(uvm_phase phase);
        super.report_phase(phase);
        `uvm_info(get_type_name(), "--------------------------------------------------------", UVM_NONE)
        `uvm_info(get_type_name(), "                 I2C SCOREBOARD RESULTS                 ", UVM_NONE)
        `uvm_info(get_type_name(), $sformatf("  TOTAL MATCHES : %0d", match_cnt), UVM_NONE)
        `uvm_info(get_type_name(), $sformatf("  TOTAL ERRORS  : %0d", error_cnt), UVM_NONE)
        if (error_cnt == 0) begin
            `uvm_info(get_type_name(), "              VERIFICATION SUCCESSFUL              ", UVM_NONE)
        end else begin
            `uvm_error(get_type_name(), "              VERIFICATION FAILED                ")
        end
        `uvm_info(get_type_name(), "--------------------------------------------------------", UVM_NONE)
    endfunction

endclass //

`endif