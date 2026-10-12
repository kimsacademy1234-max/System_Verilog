`timescale 1ns / 1ps

module tb_dut;

    // 입력 신호 선언
    reg  clk;
    reg  rst;
    reg  din_bit;
	reg  [3:0] bit4;
    // 출력 신호 선언
    wire mealy_out;

    wire moore_out;
	
	
    // DUT 인스턴스화 
    seq_det_mealy DUT_MEALY (
        .i_clk(clk),
        .i_reset(rst),
        .i_din_bit(din_bit),
        .o_dout_bit(mealy_out)
    );


    seq_det_moore DUT_MOORE (
        .i_clk(clk),
        .i_reset(rst),
        .i_din_bit(din_bit),
        .o_dout_bit(moore_out)
    );



task bit4_driver;
begin
	integer i,j;
	reg [3:0] din;
	din = $urandom_range(5,8);
	bit4 = din;
	for(i=0;i<3; i=i+1)begin
		@(negedge clk) #1; 	
		din_bit <= din[i];
		
	end

	


end
endtask








integer i;



    // 클럭 생성 (예: 10ns 주기)
    always #5 clk = ~clk;

    initial begin
        // 초기값 설정
        clk = 0;
        rst = 1;
        din_bit = 0;

        // 리셋 신호
        #15 rst = 0;

    
	for(i=0;i<50; i=i+1)begin
		bit4_driver;
	end


	$finish;

end

endmodule
