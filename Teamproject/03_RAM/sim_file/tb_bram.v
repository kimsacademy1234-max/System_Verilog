`timescale 1ns / 1ps


module tb_bram();




reg [7:0] addr;
reg i_clk; 

reg we;
reg [7:0] wdata;
wire [7:0] rdata;




BRAM_IP DUT(
 .addr(addr),
 .i_clk(i_clk),
 .we(we),
 .wdata(wdata),
 .rdata(rdata)
);


always #5 i_clk = ~i_clk;


initial begin



i_clk =0;
we =0;
addr =0;
wdata =0;


@(negedge i_clk);  // 5ns
we =1 ;
addr =10;
wdata = 8'h0a;


@(negedge i_clk);  // 5ns
we =1 ;
addr =11;
wdata = 8'h0b;


@(negedge i_clk);  // 5ns
we =1 ;
addr =31;
wdata = 8'h0c;



@(negedge i_clk);  // 5ns
we =1 ;
addr =32;
wdata = 8'h0d;



// read_to_ram 
@(negedge i_clk);  // 5ns
we = 0;

@(negedge i_clk);  // 5ns
addr = 10;


@(negedge i_clk);  // 5ns
addr = 11;


@(negedge i_clk);  // 5ns
addr = 31;


@(negedge i_clk);  // 5ns
addr = 32;



@(negedge i_clk);  // 5ns
$stop;
end

endmodule
