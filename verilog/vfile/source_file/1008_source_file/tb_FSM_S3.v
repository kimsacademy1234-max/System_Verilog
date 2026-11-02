`timescale 1ns / 1ps


module tb_FSM_S3();


reg [1:0] i_sw;
reg i_clk,i_reset;
wire [2:0] o_led; 




FSM_S3 DUT(


   . i_clk      (i_clk),
   . i_reset    (i_reset),
   . i_sw       (i_sw), 
   . o_led      (o_led) 

      );

always #5 i_clk = ~i_clk;




// golden model 

localparam S0= 0, S1= 1, S2 =2, S3 = 3, S4 = 4;
integer state;
integer cov[0:4][0:3];
integer err_c1;
integer cycle;

// n_state를 결정하는 로직 input state는 계속 업데이트 되는 입력변수

function integer n_state(input integer st, input [1:0] sw);

    begin
    case(st)
        S0 : n_state = (sw == 2'b01)? S1 : S0; 
        S1 : n_state = (sw == 2'b10)? S2 : S1;
        S2 : n_state = (sw == 2'b11)? S3 : S2; 
        S3 : if(sw==2'b00) n_state = S0; 
             else if(sw == 2'b01) n_state = S1; 
             else if(sw == 2'b10) n_state = S4; 
             else n_state = S3;
        S4 : n_state = (sw == 2'b00)? S0 : S4;
        default : n_state = S0; 
    endcase 
    end

endfunction 

// state 출력 변환
function [2:0] g_code(input integer st);
      begin  
        case(st)
            S0 : g_code = 3'b000;  
            S1 : g_code = 3'b001;  
            S2 : g_code = 3'b010;
            S3 : g_code = 3'b100;
            S4 : g_code = 3'b111;
        default :  g_code = 3'bxxx;
        endcase 
      end
endfunction


function [15:0] name(input [2:0] st);

      begin 
        case(st)
            3'b000:name = "S0"; 
            3'b001:name = "S1";  
            3'b010:name = "S2"; 
            3'b100:name = "S3"; 
            3'b111:name = "S4";
            default : name =  "??";
        endcase 
      end
endfunction







always@(posedge i_clk or posedge i_reset)begin

    if(i_reset) state <= S0;
    else begin  
        cov[state][i_sw] <= cov[state][i_sw] + 1;
        state <= n_state(state,i_sw);  
    end 
end 


always@(negedge i_clk)begin

    if(!i_reset)begin
        cycle <= cycle + 1;
        if(o_led !== g_code(state))begin
               err_c1 <= err_c1 +1;
                $display("[C1 FAIL] %0d ns sw=%b exp=%s(%b) got=%s(%b)",
                         $time, i_sw, name(g_code(state)), g_code(state), name(o_led), o_led);
        end 
    end
end

///////////////////////////// Driver //////////////////////////////////////////////

function cov_full(input dummy);
    integer a,b;
    begin
        cov_full  = 1;         
        for(a=0; a<5; a = a+1)begin
            for(b=0; b<5; b = b+1)begin
                    if(cov[a][b] < 1) cov_full = 0;
            end
        end

    end

endfunction






task driver(input [1:0] sw);
    begin 
    @(negedge i_clk);
    #1; i_sw  = sw;
    end
endtask 

task async_reset;
    begin
    
    @(posedge i_clk); #2;
        i_reset = 1; 
    @(negedge i_clk); #1;
        i_reset = 0;
    end
endtask 


integer s,w;




initial begin

i_clk = 0; i_reset =1; state = 0; err_c1 =0;
cycle = 0; i_sw = 0;

for(s=0; s<5; s = s+1)begin
    for(w=0; w<5; w = w+1)begin
            cov[s][w] = 0;
    end
end 

async_reset;


while(cycle <10000) begin
      
     
      driver($random);
end

$display("------------------------------------------------");
$display(" Arc coverage (state x sw)   00   01   10   11");
for (s = 0; s < 5; s = s + 1) begin
$display("   %s                        %4d  %4d  %4d  %4d", name(g_code(s)),
                 cov[s][0], cov[s][1], cov[s][2], cov[s][3]);

end

if(err_c1 == 0) $display("[PASS] 'o_led == Golden Value' for all cases");
else $display("[Fail] Please Check code ");




    $finish; 


end

endmodule
