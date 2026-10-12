`timescale 1ns / 1ps




module FSM_RUN_STOP/*#(


//parameter clear =3'd0, // 000
//parameter stop =3'd1, // 001
//parameter run =3'd2 // 010



        )*/(

    input i_clk,
    input i_reset,
    input i_bts_L, // clear 
	input i_bts_R, // run_stop
	input i_sw,  //mode 
    output reg[2:0] o_sw    
    
);

typedef enum logic [2:0]{clear = 3'd0, stop =3'd1 , run = 3'd2} state_t;

state_t  state, n_state;







always@(posedge i_clk or posedge i_reset)begin

    if(i_reset)begin 
        state <= stop;
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

		stop : begin if(i_bts_R) n_state = run;
					 else if(i_bts_L) n_state = clear ;
					 else n_state = stop;
					 o_sw = 3'b001;                  //  00 -> stop
			   end 


		clear: begin n_state = stop;  
			    	 o_sw = 3'b010; // 중간 run_stop bit  끝 -> clear  // 01 clear

				end

		run: begin if(i_bts_R) n_state = stop;  
				   else  n_state = stop;  
				   o_sw = 3'b000;              // 10 run 

			 end
              
        default : begin  n_state = state;
						 o_sw = 3'b001;	

				  end

        endcase 

end
    

endmodule





