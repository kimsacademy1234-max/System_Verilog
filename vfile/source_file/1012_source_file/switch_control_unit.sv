`timescale 1ns / 1ps


module switch_control_unit(

input i_clk ,
input i_reset ,

input [2:0] i_sw,

output [2:0] o_sw    //  run 000  010  100


);


typedef enum {


stop  =	2'b00,	
clear = 2'b01,
run	  = 2'b10,
mode  = 2'b11

} state_t;


state_t state n_state;


always@(posedge i_clk or posedge i_reset)begin

    if(i_reset)begin 
        state <= stop;
    end

    else begin

        state <= n_state;
    end
end 


always@(*)begin













end




















endmodule
