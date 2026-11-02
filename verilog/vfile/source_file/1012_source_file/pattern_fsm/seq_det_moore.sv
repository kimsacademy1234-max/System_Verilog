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


		S0		:begin if(!i_din_bit) n_state = S1;  
				  else if (i_din_bit) n_state = S0;  
				  else  n_state = S0;
				  o_dout_bit = 0; end
 				

		S1		: begin if (!i_din_bit) n_state = S1;  
				  else if (i_din_bit) n_state = S2;  
				  else  n_state = S1;  
				  o_dout_bit = 0; end

		S2		: begin if (!i_din_bit) n_state = S3;  
				  else if (i_din_bit) n_state = S0;  
				  else  n_state = S2; 
				  o_dout_bit = 0; end


		S3		: begin if (!i_din_bit) n_state = S1;  
				  else if  (i_din_bit) n_state = S4;  
				   else  n_state = S3;  
				  o_dout_bit = 0; end



		S4		: begin if (!i_din_bit) n_state = S1;  
				  else if  (i_din_bit) n_state = S0;  
				   else  n_state = S4;  
				  o_dout_bit = 1; end


		default : begin	n_state = S0;
				  o_dout_bit = 0; end

        endcase 

end
    

endmodule

