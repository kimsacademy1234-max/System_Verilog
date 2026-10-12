`timescale 1ns / 1ps




module tb_button_debouncer();


reg i_clk,i_reset,i_btn;

wire o_btn;


button_debouncer DUT(
.i_clk(i_clk),		
.i_reset(i_reset),
.i_btn(i_btn),
.o_btn(o_btn)

);



task driver;

begin
	integer i,j;
	
	i = $urandom_range(5,12);  //  
	
	j = $urandom_range(5,15);  // 
	
	repeat(j) #(i) i_btn = 1;
	#10 i_btn = 0; 
	#100;
	
end
endtask








always #5 i_clk =~i_clk;

integer k;

initial begin	


i_btn =0;
i_clk = 0;
i_reset = 1;
#10 i_reset = 0;

for(k=0;k<50;k=k+1)begin

driver; 
end

$finish;



end


endmodule






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

	//8- input AndGATE 

end

assign debounce = &q_reg; 



//edge detect 

always@(posedge i_clk,posedge i_reset)begin

	if(i_reset) edge_reg <= 0;
	
	else begin

		edge_reg <= debounce;

	end 

end



// rising edge 에서 tick gen 
assign o_btn = ~edge_reg&debounce;




endmodule







