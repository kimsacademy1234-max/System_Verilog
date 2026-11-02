`timescale 1ns / 1ps


module top_ascii(


input clk,rst,
input rx,
output tx,
output reg [3:0]fnd_com,
output reg [7:0]fnd_font

);



reg [31:0] anode_reg;

wire w_rx_done;
wire [7:0] w_rx_data;
wire [7:0] w_fnd_hex;
wire w_clk_4k;
wire [7:0] w_fnd_font;
wire [1:0] w_sel;


always@(posedge clk or posedge rst)begin



	if(rst)begin
		anode_reg <= 32'hBFBFBFBF;
	end
	
	else begin
			anode_reg <= anode_reg;
		if(w_rx_done)begin
			anode_reg <= {anode_reg[23:0],w_fnd_font};

		end

	end
end




always@(w_sel)begin

	case(w_sel)

	2'b00 : fnd_com = 4'b1110;  
	2'b01 : fnd_com = 4'b1101; 
	2'b10 : fnd_com = 4'b1011; 	
	2'b11 : fnd_com = 4'b0111; 	


	endcase


end

always@(*)begin

	case(w_sel)

	2'b00 : fnd_font = anode_reg[7:0]; 	
	2'b01 : fnd_font = anode_reg[15:8]; 	
	2'b10 : fnd_font = anode_reg[23:16]; 	
	2'b11 : fnd_font = anode_reg[31:24]; 	


	endcase


end









counter_4 U_COUNT(

.i_clk(w_clk_4k),
.i_reset(rst),
.o_sel(w_sel)


);





uart_loopback U_UART_LOOP(

 .clk(clk),
 .rst(rst),
 .rx(rx), // from PC
 .tx(tx),
 .o_rx_data(w_rx_data),
 .o_rx_done(w_rx_done)



);




Ascii_decoder U_ASCII(
//.i_reset(rst),
//.i_clk(clk),
.i_rx_done(w_rx_done),
.i_rx_data(w_rx_data),
.o_fnd_hex(w_fnd_hex)

);

fnd_decoder U_FND_DEC(

.i_fnd_hex   (w_fnd_hex),
.o_fnd_data  (w_fnd_font)


);

clock_tick_gen#(
	.CLK_FRQ(4000)

)U_CLOCK_4K(


.i_clk(clk),
.i_reset(rst),
.o_clk(w_clk_4k)


);








endmodule
