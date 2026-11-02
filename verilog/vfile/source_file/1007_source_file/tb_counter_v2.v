`timescale 1ns / 1ps

/*
시나리오 순서대로 
1. 3 repeat 증가 -> 초기화(4개중 1개)
2. 초기화 ->  3 repeat discount
3. discount -> 3 repeat 증가 

*/



module tb_counter_v2();




reg [2:0] i_sw;
reg i_clk;
reg i_reset;

wire [13:0] o_counter;
wire [3:0]  o_fnd_com;
wire [7:0]  o_fnd_data;
wire o_tic;
parameter CONT = 100_000_000;

counter_10000_v2 DUT_CNT10000(
    .i_clk      (i_clk),
    .i_reset    (i_reset),
    .i_sw0      (i_sw[0]), //run-stop
    .i_sw1      (i_sw[1]), //clear
    .i_sw2      (i_sw[2]), //up_down
    .o_fnd_com  (o_fnd_com),
    .o_fnd_data (o_fnd_data),
    .o_counter  (o_counter),
    .o_tic      (o_tic)

);

always #5 i_clk = ~i_clk;



initial begin

    $monitor(" %10d ns | DISCOUNT : %b / CLEAR : %b / STOP : %b / Count_Value : %4d / tick : %d",
             $time, i_sw[2], i_sw[1], i_sw[0], o_counter,o_tic);

    i_clk = 0;
    i_reset = 1;
    #10;
    i_reset = 0;
   
    repeat(2) begin #(CONT);
        i_sw = 0;    // Count
    end 
    repeat(1) begin #(CONT);
        i_sw = 3'b010; // Clear  
    end
    repeat(2) begin #(CONT);
        i_sw = 3'b100; // Discount
    end
   
    repeat(3) begin #(CONT);
        i_sw = 3'b000; // count
    end 
    repeat(1) begin #(CONT);    // Clear
        i_sw = 3'b011; 
    end
    repeat(2) begin #(CONT);
        i_sw = 3'b000; // Count 
    end
    repeat(2) begin #(CONT);
        i_sw = 3'b001; // STOP 
    end
    repeat(1) begin #(CONT);
        i_sw = 3'b110; // Clear
    end

    repeat(3) begin #(CONT);
        i_sw = 3'b000; // Count 
    end 
    repeat(2) begin #(CONT);
        i_sw = 3'b101; // discount vs Stop 
    end 
    repeat(1) begin #(CONT);
        i_sw = 3'b111; // Clear 
    end
    

$stop;

end

    /* DDfor(i=0;i<9;i=i+1)begin

         repeat(3) begin
            #(CONT);
            i_sw = i;
            $display("DISCOUNT : %3d  / CLEAR : %3d / STOP : %3d / Count_Value : %d",i_sw[2],i_sw[1],i_sw[0],o_counter);
         end
    end

    $finish;


end*/


endmodule
