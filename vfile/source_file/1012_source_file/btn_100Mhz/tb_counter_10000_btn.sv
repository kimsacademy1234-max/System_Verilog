`timescale 1ns / 1ps



module tb_counter_10000_btn();


parameter BTL = 1000; // 버튼 유지/해제 clk 수 (디바운스 800clk 이상)


    reg  i_clk;
    reg  i_reset;
    reg i_btn_L; // clear 
	reg i_btn_R; // run_stop
	reg i_btn_U; // 이것만 따로 처리한다.
    wire [3:0] o_fnd_com;
    wire [7:0] o_fnd_data;



counter_10000_v2 DUT(


    .i_clk		(i_clk			),			
    .i_reset	(i_reset		),	
    .i_btn_L	(i_btn_L		),	 
	.i_btn_R	(i_btn_R		),	 
	.i_btn_U	(i_btn_U		),	 
    .o_fnd_com	(o_fnd_com		),	
    .o_fnd_data	(o_fnd_data		)	

);


// 시뮬레이션용 : tick 주기를 줄여서 카운터가 실제로 변하는 걸 확인 (실제 보드는 10_000_000)
defparam DUT.U_CNT_DATA.GEN.FCOUNT = 1000;

always #5 i_clk	= ~i_clk;

task driver;
	integer i;
	reg [2:0] r_btn;
begin
	i_btn_L = 0;
	i_btn_R = 0;
	i_btn_U = 0;

	i = $urandom_range(0,3);

	case (i)
		0: r_btn = 3'b001; // L (clear)
		1: r_btn = 3'b010; // R (run_stop)
		2: r_btn = 3'b100; // U (mode)
		default: r_btn = 3'b000; // 아무것도 안 누름
	endcase

	// 채터링 : 짧게 랜덤으로 토글
	repeat($urandom_range(3,10)) begin
		@(negedge i_clk) #1;
		if (r_btn[0]) i_btn_L = $urandom_range(0,1);
		if (r_btn[1]) i_btn_R = $urandom_range(0,1);
		if (r_btn[2]) i_btn_U = $urandom_range(0,1);
		repeat($urandom_range(0,30)) @(negedge i_clk);
	end

	// 안정 구간 : 디바운서(100clk x 8tap = 800clk)보다 충분히 길게 유지
	@(negedge i_clk) #1;
	i_btn_L = r_btn[0];
	i_btn_R = r_btn[1];
	i_btn_U = r_btn[2];
	repeat(BTL) @(negedge i_clk);

	// 버튼 해제 : 디바운서 shift register 가 비워질 때까지 대기
	@(negedge i_clk) #1;
	i_btn_L = 0;
	i_btn_R = 0;
	i_btn_U = 0;
	repeat(BTL) @(negedge i_clk);
end
endtask



task async_reset;
begin

	integer i;

	i = $urandom_range(1,0);
	
	i_reset =0;
	if(i == 4)begin
		
		i_reset = 1;

		@(negedge i_clk) #1;
		i_reset = 0;


	end
	




end

endtask









integer k;


initial begin


i_clk = 0; i_reset =1; 

i_btn_L = 0; 
i_btn_R = 0; 
i_btn_U = 0;  

#10;
i_reset = 0;

for(k=0;k<50;k=k+1)begin


#100_000_0;
driver;
async_reset;


end


$finish;

end


endmodule
