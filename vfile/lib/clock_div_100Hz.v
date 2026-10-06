`timescale 1ns / 1ps


module clock_div_100Hz(

input i_clk,
input i_reset_n,
output reg o_clk_1kHz


);



reg [19:0] r_clk_count;


always@(posedge i_clk or negedge i_reset_n)begin


    if(!i_reset_n)begin
        r_clk_count <=0;
        o_clk_1kHz <= 1;
    end

    else begin

        if(r_clk_count < 20'd10000)begin
            r_clk_count <= r_clk_count +1;
            if(r_clk_count < 20'd5000)begin
                o_clk_1kHz <= 1'b1;
            end

            else begin
                o_clk_1kHz <= 1'b0;
            end
            
        end

        else begin
              r_clk_count <=20'd0;
        end 
   end 
end
            

















endmodule
