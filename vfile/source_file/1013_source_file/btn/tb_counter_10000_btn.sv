`timescale 1ns / 1ps



module tb_counter_10000_btn();


parameter BTL = 1000; // 버튼 유지/해제 clk 수 (디바운스 800clk 이상)


    reg CLK;
    reg  RESET;
    reg BTN_L; // clear 
	reg BTN_R; // run_stop
	reg BTN_U; // 이것만 따로 처리한다.
    wire [3:0] FND_COM;
    wire [7:0] FND_DATA;



counter_10000_v2 DUT(


    .i_clk		(CLK	    ),			
    .i_reset	(RESET		),	
    .i_btn_L    (BTN_L		),	 
	.i_btn_R	(BTN_R		),	 
	.i_btn_U	(BTN_U		),	 
    .o_fnd_com	(FND_COM	),	
    .o_fnd_data	(FND_DATA	)	

);

parameter change = 1; 
parameter INPUT_FREQ = 500_000*10;   // ns단위  100MHz -> /10000 -> 1kHz -> 1ms    5ms -> 200Hz


always #5 CLK	= ~CLK;
/*

<시나리오>

i= 1 ;  BTN 정상 출력

parmeter change = 1 -> 10Mhz debouncer로 변환

0 -> 100Mhz debouncer -> 입력이 최소 80ns 이상 유지되어야 함. 입력으로 인정되는 최소 시간이라 생각하면 됨
                      -> 입력의 주기?

                         BCD는 1kHz 순환 주기를 가지고 있고 1ms 마다 업데이트 됨
                         o_counter의 tic -> 10Hz (1초에 10번 진동, 0.1s 마다 업데이트)
                        
                         초면 run_stop == 1 일 경우, 0 -> 5로 카운트가 업데이트 됨
                        최소 5ms 초로 계산하기 위해선 입력의 주기를 INPUT_FREQ = 500_000;

                        입력의 유지 범위를 60 ~ 90ns, ( change =1에서는) 600~900으로 잡는다.

 
i = 2; 

입력값의 진동 -> 010101 안정 010101 togle 구간을 준다. 안정 구간을 50~70 , 500,700일 경우를 계산한다



i = 3; 


BTN이 동시에 들어올 경우 && 셋다 동시에 들어올 경우 



 */




task driver(input integer i);

integer j;

begin   

        case(i)
        
          1 : begin

              for(j=0; j<3; j=j+1)begin

                    if(j==0) begin 
                        
                        BTN_R = 1;
                        #($urandom_range(60,90));
                        BTN_R = 0;
                        #(INPUT_FREQ); 

                        end

                    else if (j==1) begin 

                        BTN_L = 1;
                        #($urandom_range(60,90));
                        BTN_L = 0;
                        #(INPUT_FREQ); 

                        end 

                    else begin 

                        BTN_U = 1; 
                        #($urandom_range(60,90));
                        BTN_U = 0; 
                        #(INPUT_FREQ); 
                        end 

              end

              end


          2 : begin

                     
              for(j=0; j<3; j=j+1)begin

                    BTN_R =0;
                    BTN_L =0;
                    BTN_U =0;

                    if(j==0) begin 
                        repeat($urandom_range(6,8)) #2 BTN_R = ~BTN_R;
                        BTN_R = 1;
                        #($urandom_range(50,80));
                        repeat($urandom_range(6,8)) #2 BTN_R = ~BTN_R;
                        BTN_R = 0;
                        #(INPUT_FREQ); 
                    end

                    else if(j==1) begin 
                        repeat($urandom_range(6,8)) #2 BTN_L = ~BTN_L;
                        BTN_L = 1;
                        #($urandom_range(50,80));
                        repeat($urandom_range(6,8)) #2 BTN_L = ~BTN_L;
                        BTN_L = 0;
                        #(INPUT_FREQ); 
                    end
                    else begin 
                        repeat($urandom_range(6,8)) #2 BTN_U = ~BTN_U;
                        BTN_U = 1;
                        #($urandom_range(50,80));
                        repeat($urandom_range(6,8)) #2 BTN_U = ~BTN_U;
                        BTN_U = 0;
                        #(INPUT_FREQ); 
                    end



              end


              end




          //3 :

        endcase 





end


endtask




initial begin


CLK = 0; RESET =1; 

BTN_L = 0; 
BTN_R = 0; 
BTN_U = 0;  

#10;
RESET = 0;

#0;

#100;


driver(1);



$finish;

end


endmodule
