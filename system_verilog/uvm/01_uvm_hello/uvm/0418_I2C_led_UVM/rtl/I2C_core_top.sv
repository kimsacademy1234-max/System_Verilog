`timescale 1ns / 1ps

module I2C_core_top(
    input  logic clk,
    input  logic reset,

   
    input  logic [7:0] m_tx_data, 
    input  logic       m_wr_en,   
    input  logic       m_rd_en,   
    output logic [7:0] m_rx_data, 
    output logic       m_busy,    

  
    input  logic [7:0] s_tx_data, 
    output logic [7:0] s_rx_data, 
    output logic       s_rx_valid,

    inout  wire        scl,
    inout  wire        sda
);

   
    logic cmd_start, cmd_write, cmd_read, cmd_stop, done;
    logic [7:0] master_tx_internal;
    logic [7:0] master_rx_internal;

    
    I2C_master u_master (
        .clk(clk), 
        .reset(reset),
        .cmd_master(1'b1),
        .cmd_start(cmd_start), 
        .cmd_write(cmd_write), 
        .cmd_read(cmd_read), 
        .cmd_stop(cmd_stop),
        .tx_data(master_tx_internal), 
        .ack_in(1'b1),             
        .rx_data(master_rx_internal), 
        .ack_out(),                 
        .done(done), 
        .busy(m_busy),
        .scl(scl),                  
        .sda(sda)                   
    );

   
    I2C_slave u_slave (
        .clk(clk), 
        .reset(reset),
        .slave_addr(7'h50),         
        .rx_data(s_rx_data), 
        .rx_valid(s_rx_valid),
        .tx_data(s_tx_data),        
        .scl(scl),                  
        .sda(sda)                   
    );

  
    enum logic [3:0] {
        IDLE, 
        START_CMD, WAIT_START,
        ADDR_CMD,  WAIT_ADDR,
        DATA_CMD,  WAIT_DATA,
        STOP_CMD,  WAIT_STOP
    } state;

    logic is_read_op; 

    always_ff @(posedge clk or posedge reset) begin
        if (reset) begin
            state <= IDLE;
            {cmd_start, cmd_write, cmd_read, cmd_stop} <= 4'b0000;
            is_read_op <= 1'b0;
            m_rx_data  <= 8'h00;
        end else begin
            case (state)
                IDLE: begin
                    if (m_wr_en) begin
                        is_read_op <= 1'b0; 
                        cmd_start  <= 1; 
                        state      <= WAIT_START;
                    end else if (m_rd_en) begin
                        is_read_op <= 1'b1; 
                        cmd_start  <= 1; 
                        state      <= WAIT_START;
                    end
                end

                WAIT_START: begin
                    cmd_start <= 0; 
                    if (done) state <= ADDR_CMD;
                end

                ADDR_CMD: begin
                    master_tx_internal <= is_read_op ? 8'hA1 : 8'hA0; 
                    cmd_write          <= 1;   
                    state              <= WAIT_ADDR;
                end

                WAIT_ADDR: begin
                    cmd_write <= 0; 
                    if (done) state <= DATA_CMD;
                end

                DATA_CMD: begin
                    if (is_read_op) begin
                        cmd_read <= 1;
                    end else begin
                        master_tx_internal <= m_tx_data; 
                        cmd_write          <= 1;
                    end
                    state <= WAIT_DATA;
                end

                WAIT_DATA: begin
                    cmd_write <= 0;
                    cmd_read  <= 0;
                    if (done) begin
                        if (is_read_op) m_rx_data <= master_rx_internal;
                        state <= STOP_CMD;
                    end
                end

                STOP_CMD: begin
                    cmd_stop <= 1; 
                    state    <= WAIT_STOP;
                end

                WAIT_STOP: begin
                    cmd_stop <= 0;
                    if (done) state <= IDLE; 
                end
            endcase
        end
    end

endmodule