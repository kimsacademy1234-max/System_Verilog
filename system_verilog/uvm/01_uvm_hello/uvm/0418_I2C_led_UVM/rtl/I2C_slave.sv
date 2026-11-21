

`timescale 1ns / 1ps

module I2C_slave(
    input logic clk,
    input logic reset,
    input logic [6:0] slave_addr,

    output logic [7:0] rx_data,
    output logic rx_valid,
    input logic [7:0] tx_data,

    input logic scl,
    inout wire sda
    );

    logic sda_out, sda_en;
    assign sda = sda_en ? (sda_out ? 1'bz : 1'b0) : 1'bz;

    logic [2:0] scl_sync, sda_sync;

    always_ff @(posedge clk or posedge reset) begin
        if (reset) begin
            scl_sync <= 3'b111;
            sda_sync <= 3'b111;
        end else begin
            scl_sync <= {scl_sync[1:0], scl};
            sda_sync <= {sda_sync[1:0], sda};
        end
    end

    wire scl_rising  = (scl_sync[2:1] == 2'b01);
    wire scl_falling = (scl_sync[2:1] == 2'b10);
    wire start_cond  = (scl_sync[1] == 1'b1) && (sda_sync[2:1] == 2'b10);
    wire stop_cond   = (scl_sync[1] == 1'b1) && (sda_sync[2:1] == 2'b01);

    typedef enum logic [2:0] {
        IDLE        = 3'b000,
        ADDR        = 3'b001,
        ADDR_ACK    = 3'b010,
        RX_DATA     = 3'b011,
        TX_DATA     = 3'b100,
        SLAVE_ACK   = 3'b101,
        MASTER_ACK  = 3'b110  
    } state_e;

    state_e state;
    logic [2:0] bit_cnt;
    logic [7:0] shift_reg;
    logic is_read;

    always_ff @(posedge clk or posedge reset) begin
        if (reset) begin
            state <= IDLE;
            sda_en <= 1'b0;
            sda_out <= 1'b1;
            rx_valid <= 1'b0;
            bit_cnt <= 3'd0;
            shift_reg <= 8'h00;
        end else if (start_cond) begin
            state <= ADDR;
            bit_cnt <= 3'd7;
            sda_en <= 1'b0;
        end else if (stop_cond) begin
            state <= IDLE;
            sda_en <= 1'b0;
        end else begin
            rx_valid <= 1'b0;

            case (state)
                IDLE: sda_en <= 1'b0;

                ADDR: begin
                    if (scl_rising) begin
                        shift_reg[bit_cnt] <= sda_sync[1];
                        if (bit_cnt == 0) state <= ADDR_ACK;
                        else             bit_cnt <= bit_cnt - 1;
                    end
                end

                ADDR_ACK: begin
                    if (scl_falling) begin
                        if (shift_reg[7:1] == slave_addr) begin
                            is_read <= shift_reg[0];
                            sda_en <= 1'b1;
                            sda_out <= 1'b0; 
                        end else begin
                            state <= IDLE;
                        end
                    end else if (scl_rising && sda_en) begin
                        state <= is_read ? TX_DATA : RX_DATA;
                        bit_cnt <= 3'd7;
                    end
                end

                RX_DATA: begin
                    if (scl_falling) sda_en <= 1'b0; 
                    if (scl_rising) begin
                        shift_reg[bit_cnt] <= sda_sync[1];
                        if (bit_cnt == 0) begin
                            state <= SLAVE_ACK;
                            rx_data <= {shift_reg[7:1], sda_sync[1]};
                            rx_valid <= 1'b1;
                        end else begin
                            bit_cnt <= bit_cnt - 1;
                        end
                    end
                end

                TX_DATA: begin
                    if (scl_falling) begin
                        sda_en <= 1'b1;
                        sda_out <= tx_data[bit_cnt]; 
                    end else if (scl_rising) begin
                        if (bit_cnt == 0) begin
                            state <= MASTER_ACK; 
                        end else begin
                            bit_cnt <= bit_cnt - 1;
                        end
                    end
                end

                MASTER_ACK: begin
                    if (scl_falling) begin
                        sda_en <= 1'b0; 
                    end else if (scl_rising) begin
                       
                        state <= IDLE; 
                    end
                end

                SLAVE_ACK: begin
                    if (scl_falling) begin
                        sda_en <= 1'b1;
                        sda_out <= 1'b0;
                    end else if (scl_rising) begin
                        state <= RX_DATA;
                        bit_cnt <= 3'd7;
                    end
                end
            endcase
        end
    end
endmodule