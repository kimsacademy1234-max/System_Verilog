`timescale 1ns / 1ps




module FSM_RUN_STOP/*#(


//parameter clear =3'd0, // 000
//parameter stop =3'd1, // 001
//parameter run =3'd2 // 010



        )*/(

    input i_clk,
    input i_reset,
    input[2:0] i_sw, 
    output reg[2:0] o_sw    
    
);

typedef enum logic [2:0]{clear = 3'd0, stop =3'd1 , run = 3'd2} state_t;

state_t  state, n_state;



//reg [2:0] state, n_state;

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

		stop :begin
					case(i_sw) 
						3'b011 : n_state = run;  
						3'b001 : n_state = run;
						3'b010 : n_state = clear;
						default : n_state = stop;
					endcase 	
						o_sw = 3'b001;       //  00 -> stop

					end	


		clear: begin if(!i_sw[1])begin n_state = stop; end 
					 else begin n_state = clear; end

					o_sw = 3'b010; // 중간 run_stop bit  끝 -> clear  // 01 clear


				end

		run: begin if(!i_sw[0])begin n_state = stop; end 
					 else begin n_state = run; end 

					 o_sw = 3'b000;              // 10 run 

				end
              
        default : begin  n_state = state;
						 o_sw = 3'b001;	

				  end

        endcase 

end
    

endmodule





