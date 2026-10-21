`timescale 1ns / 1ps


module tb_ascii();


parameter BAUD_RATE = 100_000_000/9600*10;



reg clk,rst;
reg rx;
wire tx;

wire [3:0] fnd_com;
wire [7:0] fnd_font; 


top_ascii DUT_ASCII(

.clk(clk),
.rst(rst),
.rx(rx),
.tx(tx),
.fnd_com(fnd_com),
.fnd_font(fnd_font)

);


reg [23:0] anode; 
reg [7:0]  FND_OUT;
reg [7:0]  DATA_8BIT;

always@(*)begin 

	case(fnd_com)

	4'b1110 : anode = "AN0";
	4'b1101 : anode = "AN1";
	4'b1011 : anode = "AN2";
	4'b0111 : anode = "AN3";
	default : anode = "ERR";

	endcase


end

always@(*)begin


	case(fnd_font)

	8'hC0 : FND_OUT ="0" ;    
	8'hF9 : FND_OUT ="1" ;  
	8'hA4 : FND_OUT ="2" ;
	8'hB0 : FND_OUT ="3" ;
	8'h99 : FND_OUT ="4" ;
	8'h92 : FND_OUT ="5" ;
	8'h82 : FND_OUT ="6" ;
	8'hF8 : FND_OUT ="7" ;
	8'h80 : FND_OUT ="8" ;
	8'h90 : FND_OUT ="9" ;
	8'h88 : FND_OUT ="A" ; 	
	8'h83 : FND_OUT ="B" ;
	8'hC6 : FND_OUT ="C" ;
	8'hA1 : FND_OUT ="D" ;
	8'h86 : FND_OUT ="E" ;
	8'h8E : FND_OUT ="F" ;

	default : FND_OUT = "R";
	endcase


end


////////////////////////////////////////////////////////////////////////////////////
task sender(input string txt);

	integer i,j;

begin

	for(j=0; j <txt.len();j=j+1)begin
		rx = 0;
		#(BAUD_RATE);
		DATA_8BIT = txt[j];
		for(i=0; i <8; i=i+1)begin
			
			rx = txt[j][i];
			#(BAUD_RATE);
		end 

		rx = 1;
		#(BAUD_RATE);
	end
	#(BAUD_RATE*10);

end
endtask


always #5 clk = ~clk;

initial	begin

clk = 0;
rst = 1;
rx = 1;

#10 rst = 0;

sender("ABCD");
sender("1A5D");



$finish;



end








endmodule
