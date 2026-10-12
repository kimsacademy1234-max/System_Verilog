`timescale 1ns / 1ps




module seq_det_moore(
    input i_clk,
    input i_reset,
	input i_din_bit, 
    output reg o_dout_bit
);

typedef enum logic [2:0]{


S0= 3'b000,
S1= 3'b001,
S2= 3'b010,
S3= 3'b011,
S4= 3'b100



} state_t;

state_t  state, n_state;


//reg [2:0] state, n_state;

always@(posedge i_clk or posedge i_reset)begin

    if(i_reset)begin 
        state <= S0;
    end

    else begin

        state <= n_state;
    end

end 

////////////////////////////////////////////////////////////////
// next state logic 
////////////////////////////////////////////////////////////////
always@(*)begin

        case(state)


		S0		: if(!i_din_bit) n_state = S1;  
				  else if (i_din_bit) n_state = S0;  
				  else  n_state = S0; 
 				

		S1		: if (!i_din_bit) n_state = S1;  
				  else if (i_din_bit) n_state = S2;  
				  else  n_state = S1;  

		S2		: if (!i_din_bit) n_state = S3;  
				  else if (i_din_bit) n_state = S0;  
				  else  n_state = S2;  
		S3		: if (!i_din_bit) n_state = S1;  
				  else if  (i_din_bit) n_state = S0;  
				   else  n_state = S3;  


		default : n_state = S0;

        endcase 

end
    



assign o_dout_bit =((state == S3) && (i_din_bit == 1))? 1:0;







endmodule
