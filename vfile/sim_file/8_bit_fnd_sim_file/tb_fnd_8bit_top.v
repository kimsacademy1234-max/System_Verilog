`timescale 1ns / 1ps


module tb_fnd_8bit_top();


reg [7:0] i_a,i_b;
reg [1:0] i_sel; 



wire o_cout;
wire [3:0] o_fnd_com;
wire [7:0] o_fnd_data;
wire [8:0] w_bcd_sum;





reg [8:0] r_bcd_sum;
reg [3:0] r_fnd_out1;
reg [3:0] r_fnd_out10;
reg [3:0] r_fnd_out100;
reg [3:0] r_fnd_out1000;




assign w_bcd_sum = (r_fnd_out1000*1000 + r_fnd_out100*100 + r_fnd_out10*10 + r_fnd_out1);



top_adder_fnd_8bit U_FND_CLK(

     .i_sel(i_sel),
     .i_a(i_a),
     .i_b(i_b),

     .o_cout(o_cout),
     .o_fnd_com(o_fnd_com),
     .o_fnd_data(o_fnd_data)


);

    

	always@(*)begin


    if(o_fnd_com == 4'b1110)begin
		case(o_fnd_data)

			8'hC0: r_fnd_out1 = 4'h0; 			
			8'hF9: r_fnd_out1 = 4'h1;			
			8'hA4: r_fnd_out1 = 4'h2;
			8'hB0: r_fnd_out1 = 4'h3;
			8'h99: r_fnd_out1 = 4'h4;
			8'h92: r_fnd_out1 = 4'h5;
			8'h82: r_fnd_out1 = 4'h6;
			8'hF8: r_fnd_out1 = 4'h7;
			8'h80: r_fnd_out1 = 4'h8;
			8'h90: r_fnd_out1 = 4'h9;
			default: r_fnd_out1 = r_fnd_out1;
		endcase
    end


    else if(o_fnd_com == 4'b1101)begin
		case(o_fnd_data)

			8'hC0: r_fnd_out10 = 4'h0; 			
			8'hF9: r_fnd_out10 = 4'h1;			
			8'hA4: r_fnd_out10 = 4'h2;
			8'hB0: r_fnd_out10 = 4'h3;
			8'h99: r_fnd_out10 = 4'h4;
			8'h92: r_fnd_out10 = 4'h5;
			8'h82: r_fnd_out10 = 4'h6;
			8'hF8: r_fnd_out10 = 4'h7;
			8'h80: r_fnd_out10 = 4'h8;
			8'h90: r_fnd_out10 = 4'h9;
			default: r_fnd_out10 = r_fnd_out10 ;
		endcase
    end

    else if(o_fnd_com == 4'b1011)begin
		case(o_fnd_data)

			8'hC0: r_fnd_out100 = 4'h0; 			
			8'hF9: r_fnd_out100 = 4'h1;			
			8'hA4: r_fnd_out100 = 4'h2;
			8'hB0: r_fnd_out100 = 4'h3;
			8'h99: r_fnd_out100 = 4'h4;
			8'h92: r_fnd_out100 = 4'h5;
			8'h82: r_fnd_out100 = 4'h6;
			8'hF8: r_fnd_out100 = 4'h7;
			8'h80: r_fnd_out100 = 4'h8;
			8'h90: r_fnd_out100 = 4'h9;
			default: r_fnd_out100 = r_fnd_out100;
		endcase
    end


    else if(o_fnd_com == 4'b0111)begin
		case(o_fnd_data)

			8'hC0: r_fnd_out1000 = 4'h0; 			
			8'hF9: r_fnd_out1000 = 4'h1;			
			8'hA4: r_fnd_out1000 = 4'h2;
			8'hB0: r_fnd_out1000 = 4'h3;
			8'h99: r_fnd_out1000 = 4'h4;
			8'h92: r_fnd_out1000 = 4'h5;
			8'h82: r_fnd_out1000 = 4'h6;
			8'hF8: r_fnd_out1000 = 4'h7;
			8'h80: r_fnd_out1000 = 4'h8;
			8'h90: r_fnd_out1000 = 4'h9;
			default: r_fnd_out1000 = r_fnd_out1000;
		endcase
    end

end





initial begin
$monitor("%3d ns : i_a = %d / i_b = %d  o_cout = %b  BCD_NUM = %d ", $time, i_a, i_b, o_cout, r_bcd_sum);
end

always #10 i_sel = i_sel + 1; 




integer err_cnt;
integer i,j;


initial begin

//    r_fnd_out1 = 4'h00;
//    r_fnd_out10 = 4'b00;
//    r_fnd_out100 = 4'b00;
//    r_fnd_out1000 = 4'b00;
    
    i_sel = 2'b00;
   
	err_cnt = 0;
	for(i=0; i<256; i=i+1)begin
			
		for(j=0; j<256; j=j+1)begin
			i_a = i;
			i_b = j;
            #30;
            r_bcd_sum = w_bcd_sum;
            #10;
			if({o_cout, (i_a+i_b)}!== w_bcd_sum)begin
				err_cnt = err_cnt +1;
                $display("[ERROR] a:%d +b: %d is not SEG DISPLAY{%d}!!",i_a,i_b,w_bcd_sum);

			end

		end


	end 

	if(err_cnt ==0) $display("[PASS] : ALL BCD CORRECT!");
	else $display("[FAIL] : Please Check %d [ERROR] Diagram",err_cnt);




	$finish;


end





endmodule
