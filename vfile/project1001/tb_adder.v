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


// print automatically whenever a value changes
initial begin
	$monitor("%3d ns : a=%2d b=%2d -> c_out=%b sum=%2d  (%2d)", $time, a, b, c_out, sum, {c_out, sum});
end


integer i,j;
integer err_cnt;
integer carry_cnt;   // number of cases with c_out = 1

initial begin
	err_cnt   = 0;
	carry_cnt = 0;

	for(i=0; i<256; i=i+1)begin
		
		for(j=0; j<256; j=j+1)begin
			a = i;
			b = j;
			#10;

			if (c_out == 1'b1) carry_cnt = carry_cnt + 1;

			// if result is not a+b, print a, b and sum
			if ({c_out, sum} !== {1'b0, a} + b) begin
				err_cnt = err_cnt + 1;
				$display("[FAIL] a=%3d b=%3d -> c_out=%b sum=%3d (%3d), expected %3d", a, b, c_out, sum, {c_out, sum}, {1'b0, a} + b);
			end
		end
	end

	if (err_cnt == 0) $display("[PASS] all 65536 cases correct");
	else              $display("[FAIL] %0d of 65536 cases wrong", err_cnt);

	// carry occurs when a + b >= 256 : for a = k there are k such b values
	// -> expected carry count = 1 + 2 + ... + 255 = 255 * 256 / 2 = 32640
	if (carry_cnt == 32640) $display("[PASS] carry count = %0d (expected 32640)", carry_cnt);
	else                    $display("[FAIL] carry count = %0d (expected 32640)", carry_cnt);


	$finish;
end

endmodule
