`timescale 1ns / 1ps


module button_debouncer(


input i_clk,i_reset,i_btn,
output o_btn


);



reg [7:0] q_reg;

reg edge_reg;

wire debounce;





// 8bit shift register SIPO

always@(posedge i_clk,posedge i_reset)begin

	if(i_reset) q_reg <= 8'h00;

	else begin

		// msb : in  lsb : 7:1 -> q_reg[6:0]
		q_reg <= {i_btn,q_reg[7:1]};  // Right shift >>


	end

end

// 8-input AND gate
assign debounce = &q_reg;



//edge detect

always@(posedge i_clk,posedge i_reset)begin

	if(i_reset) edge_reg <= 0;

	else begin

		edge_reg <= debounce;

	end

end



// one-cycle tick at rising edge of debounce
assign o_btn = ~edge_reg&debounce;




endmodule
