`timescale 1ns / 1ps


module button_debouncer_1MHz(


input i_clk,i_reset,i_btn,
output o_btn


);


parameter F_COUNT = 100;
reg [$clog2(F_COUNT)-1 :0] counter_reg;
reg clk_1Mhz;




always@(posedge i_clk,posedge i_reset)begin

	if(i_reset)begin

		counter_reg <=0;
		clk_1Mhz <= 0;
	end

	else begin

		if(counter_reg == F_COUNT-1)begin
			counter_reg <= 0;
			clk_1Mhz <=1;
		end
		
		else begin
			counter_reg <= counter_reg +1;
			clk_1Mhz <=0;
		end
		
	end

end







reg [7:0] q_reg;

reg debounce_reg;

wire debounce;





// 8bit shift register SIPO

always@(posedge clk_1Mhz,posedge i_reset)begin

	if(i_reset) q_reg <= 8'h00;

	else begin

		// msb : in  lsb : 7:1 -> q_reg[6:0]
		q_reg <= {i_btn,q_reg[7:1]};  // Right shift >>  


	end

	//8- input AndGATE 

end

assign debounce = &q_reg; 



//edge detect 

always@(posedge i_clk,posedge i_reset)begin

	if(i_reset) debounce_reg <= 0;
	
	else begin

		debounce_reg <= debounce;

	end 

end



// rising edge 에서 tick gen 
assign o_btn = ~debounce_reg&debounce;




endmodule


























