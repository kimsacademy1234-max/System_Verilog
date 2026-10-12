`timescale 1ns / 1ps


module differ_dis_verses_storbe();

reg [7:0] a,b;


initial begin

a =8'h34; 
b =8'h34;
#10 b <= a+1;
$display("$display : time =%0t a=%h b=%h",$realtime,a,b);

$strobe("$display : time =%0t a=%h b=%h",$realtime,a,b);


#5;
$display("$display : time =%0t a=%h b=%h",$time,a,b);
$strobe("$display : time =%0t a=%h b=%h",$time,a,b);








end 	







endmodule
