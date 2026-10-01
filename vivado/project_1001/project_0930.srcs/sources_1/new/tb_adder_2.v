`timescale 1ns / 1ps


module tb_adder();



reg [7:0] a,b;
wire [7:0] sum;
wire c_out;

Full_Adder_8bit DUT(

		.i_a(a),
		.i_b(b),
		.i_cin(1'b0),

		.o_c_out(c_out),
		.o_s(sum)
);


// 값이 바뀔 때마다 자동 출력
initial begin
	$monitor("%3d ns : a=%2d b=%2d -> c_out=%b sum=%2d  (%2d)", $time, a, b, c_out, sum, {c_out, sum});
end


integer i,j;

initial begin
   
    b[0] = 1'b0;

	for(i=0; i<256; i=i+1)begin
		
		for(j=0; j<127; j=j+1)begin
			a = i;
			b[7:1] = j;
			#10;
		end
	end

    $finish;

end


always #3 b[0] = ~b[0];




endmodule
