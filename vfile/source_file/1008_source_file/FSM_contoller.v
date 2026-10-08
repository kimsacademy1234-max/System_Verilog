`timescale 1ns / 1ps




module Led_FSM#(

parameter S1 = 1'b0,
parameter S2 = 1'b1

        )(

    

    input i_clk,
    input i_reset,
    input i_sw, 
    output reg[1:0]    o_led    
    
);


reg State, N_State;

always@(posedge i_clk or posedge i_reset)begin

    if(i_reset)begin 
        State <= S1;
    end

    else begin

        State <= N_State;
    end

end 

////////////////////////////////////////////////////////////////
// next state logic 
////////////////////////////////////////////////////////////////
always@(*)begin

        case(State)
               
        S1 : if(!i_sw)begin N_State = S1; end
			 else begin N_State = S2; end

            
        S2 : if(!i_sw)begin N_State = S1; end
			 else begin N_State = S2; end

        default :  N_State = S1;
        endcase 

end
    
////////////////////////////////////////////////////////////////
// Output Logic
////////////////////////////////////////////////////////////////
 
always@(*)begin

        case(State)
               
        S1 : o_led = 2'b01;  

        S2 : o_led = 2'b10;
            

        default :  o_led = 2'b00;
        endcase 

end





endmodule

