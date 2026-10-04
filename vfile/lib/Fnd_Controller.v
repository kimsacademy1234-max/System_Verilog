`timescale 1ns / 1ps


module Fnd_Controller#(


parameter IDLE = 4'b1111,
parameter BCD1 = 4'b1110,
parameter BCD2 = 4'b1101,
parameter BCD3 = 4'b1011,
parameter BCD4 = 4'b0111 

        )(

    

    input i_clk,
    input i_reset_n,
    input [3:0]    i_digit_1,
    input [3:0]    i_digit_10,
    input [3:0]    i_digit_100,
    input [3:0]    i_digit_1000,
    output wire[3:0]    o_fnd_com,    
    output reg [3:0]    o_hex
);


reg [3:0] State, N_State;

always@(posedge i_clk or negedge i_reset_n)begin

    if(!i_reset_n)begin 
        State <= IDLE;
    end

    else begin

        State <= N_State;
    end

end 



always@(*)begin

        case(State)

        IDLE : begin N_State = BCD1; 
                     o_hex = 4'b1111 ; end
               
        BCD1 : begin N_State = BCD2;
                     o_hex = i_digit_1 ; end

        BCD2 : begin N_State = BCD3;
                     o_hex = i_digit_10 ; end

        BCD3 : begin N_State = BCD4;
                     o_hex = i_digit_100 ; end

        BCD4 : begin N_State = BCD1;
                     o_hex = i_digit_1000 ; end


      
        default : begin N_State = IDLE; 
                        o_hex = 4'b1111 ; end
        endcase 

end
    
assign o_fnd_com = State;
 





endmodule
