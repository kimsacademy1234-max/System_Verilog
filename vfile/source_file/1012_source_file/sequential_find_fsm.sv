`timescale 1ns / 1ps




module seq_det_mealy(
    input i_clk,
    input i_reset,
	input i_din_bit, 
    output reg o_dout_bit,
    output reg o_dout_bit_2,
	output w_moore
);

typedef enum logic [2:0]{


start = 3'b000,
rd0_once = 3'b001,
rd1_once = 3'b010,
rd0_twice= 3'b011,
rd1_twice= 3'b100

} state_t;

state_t  state, n_state;

wire w_dout;

//reg [2:0] state, n_state;

always@(posedge i_clk or posedge i_reset)begin

    if(i_reset)begin 
        state <= start;
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


		start		: if(!i_din_bit) n_state = rd0_once;  
					  else if (i_din_bit) n_state = rd1_once;  
					  else  n_state = start; 

		rd0_once	: if (!i_din_bit) n_state = rd0_twice;  
					  else if (i_din_bit) n_state = rd1_once;  
					  else  n_state = rd0_once;  

		rd0_twice	: if (!i_din_bit) n_state = rd0_twice;  
					  else if (i_din_bit) n_state = rd1_once;  
					  else  n_state = rd0_twice;  
		rd1_once	: if (!i_din_bit) n_state = rd0_once;  
					  else if  (i_din_bit) n_state = rd1_twice;  
					  else  n_state = rd1_once;  


		rd1_twice	: if (!i_din_bit) n_state = rd0_once;  
					  else if (i_din_bit) n_state = rd1_twice;  
					  else  n_state = rd1_twice;  

		default : n_state = start;

        endcase 

end
    



assign o_dout_bit = (((state == rd0_twice)&&(i_din_bit == 0))||((state == rd1_twice)&&(i_din_bit == 1))) ? 1:0;


assign w_dout =  (((state == rd0_once)&&(i_din_bit == 0))||((state == rd1_once)&&(i_din_bit == 1))) ? 1:0;

assign o_dout_bit_2 = w_dout || o_dout_bit;

assign w_moore = (state == rd0_twice || state == rd1_twice)?1:0;



endmodule
