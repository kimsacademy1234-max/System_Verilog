`timescale 1ns / 1ps




module FSM_S3#(


parameter S0 =3'd0, // 000
parameter S1 =3'd1, // 001
parameter S2 =3'd2, // 010
parameter S3 =3'd3, // 100
parameter S4 =3'd4 // 111



        )(

    

    input i_clk,
    input i_reset,
    input[1:0] i_sw, 
    output reg[2:0]    o_led    
    
);


reg [2:0] State, N_State;

always@(posedge i_clk or posedge i_reset)begin

    if(i_reset)begin 
        State <= S0;
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
               
        S0 : if(i_sw == 2'b01)begin N_State = S1; end
			 else begin N_State = S0; end
        S1 : if(i_sw==2'b10)begin N_State = S2; end
			 else begin N_State = S1; end
        S2 : if(i_sw==2'b11)begin N_State = S3; end
			 else begin N_State = S2; end
        S3 : if(i_sw==2'b00)begin N_State = S0; end
			 else if(i_sw == 2'b01)begin N_State = S1; end
			 else if(i_sw == 2'b10)begin N_State = S4; end
			 else begin N_State = S3; end
        S4 : if(i_sw==2'b00)begin N_State = S0; end
			 else begin N_State = S4; end


        default :  N_State = State;
        endcase 

end
    
////////////////////////////////////////////////////////////////
// Output Logic
////////////////////////////////////////////////////////////////
 
always@(*)begin

        case(State)
               
        S0 : o_led = 3'b000;  
        S1 : o_led = 3'b001;  
        S2 : o_led = 3'b010;
        S3 : o_led = 3'b100;
        S4 : o_led = 3'b111;

        default :  o_led = 3'b000;
        endcase 

end





endmodule





