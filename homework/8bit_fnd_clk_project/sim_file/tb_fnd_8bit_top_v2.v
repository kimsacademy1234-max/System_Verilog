`timescale 1ns / 1ps
// tb_fnd_8bit_top_v2 : 원본 TB 대비 보강점
//  (1) 독립 기준 모델  : w_golden = {1'b0,i_a} + {1'b0,i_b}  (DUT o_cout 미사용)
//  (2) 복원 폭 확장     : w_bcd_sum[13:0] (0~9999, aliasing 방지)
//  (3) 자릿수 커버리지  : 벡터마다 4개 Anode가 모두 1회 이상 켜졌는지 확인
//  (4) 프로토콜 체크    : o_fnd_com one-cold, o_fnd_data 유효 폰트
//  (5) o_cout 단독 체크 : o_cout == w_golden[8]
module tb_fnd_8bit_top_v2();

integer    err_cnt;
reg  [7:0] i_a, i_b;
reg  [1:0] i_sel;
wire       o_cout;
wire [3:0] o_fnd_com;
wire [7:0] o_fnd_data;

top_adder_fnd_8bit DUT (
    .i_sel(i_sel), .i_a(i_a), .i_b(i_b),
    .o_cout(o_cout), .o_fnd_com(o_fnd_com), .o_fnd_data(o_fnd_data)
);

wire [8:0] w_golden = {1'b0, i_a} + {1'b0, i_b};

function [4:0] f_seg2dec;   // {valid, digit}
    input [7:0] seg;
    case (seg)
        8'hC0: f_seg2dec = 5'h10; 8'hF9: f_seg2dec = 5'h11;
        8'hA4: f_seg2dec = 5'h12; 8'hB0: f_seg2dec = 5'h13;
        8'h99: f_seg2dec = 5'h14; 8'h92: f_seg2dec = 5'h15;
        8'h82: f_seg2dec = 5'h16; 8'hF8: f_seg2dec = 5'h17;
        8'h80: f_seg2dec = 5'h18; 8'h90: f_seg2dec = 5'h19;
        default: f_seg2dec = 5'h00;
    endcase
endfunction

reg  [3:0] r_dig [0:3];
reg  [3:0] r_seen;
integer    k;
wire [13:0] w_bcd_sum = r_dig[3]*1000 + r_dig[2]*100 + r_dig[1]*10 + r_dig[0];

// 자리별 스캔 1회 = 1 sample (조합 출력이 안정된 시점에 샘플)
task t_scan_digit;
    input [1:0] sel;
    reg   [4:0] dec;
    begin
        i_sel = sel; #5;
        dec = f_seg2dec(o_fnd_data);
        case (o_fnd_com)
            4'b1110: k = 0; 4'b1101: k = 1; 4'b1011: k = 2; 4'b0111: k = 3;
            default: k = -1;
        endcase
        if (k < 0) begin
            err_cnt = err_cnt + 1;
            $display("[ERROR] a=%0d b=%0d : o_fnd_com=%b not one-cold", i_a, i_b, o_fnd_com);
        end else if (!dec[4]) begin
            err_cnt = err_cnt + 1;
            $display("[ERROR] a=%0d b=%0d : invalid font %h", i_a, i_b, o_fnd_data);
        end else begin
            r_dig[k] = dec[3:0];
            r_seen[k] = 1'b1;
        end
        #5;
    end
endtask

integer i, j;
initial begin
    err_cnt = 0;
    for (i = 0; i < 256; i = i + 1)
        for (j = 0; j < 256; j = j + 1) begin
            i_a = i; i_b = j;
            r_seen = 4'b0000;
            r_dig[0] = 4'hx; r_dig[1] = 4'hx; r_dig[2] = 4'hx; r_dig[3] = 4'hx;
            t_scan_digit(2'd0); t_scan_digit(2'd1);
            t_scan_digit(2'd2); t_scan_digit(2'd3);

            if (r_seen !== 4'b1111) begin
                err_cnt = err_cnt + 1;
                $display("[ERROR] a=%0d b=%0d : digit not refreshed, seen=%b", i_a, i_b, r_seen);
            end else if (w_bcd_sum !== {5'd0, w_golden}) begin
                err_cnt = err_cnt + 1;
                $display("[ERROR] a=%0d b=%0d : FND=%0d expected=%0d", i_a, i_b, w_bcd_sum, w_golden);
            end
            if (o_cout !== w_golden[8]) begin
                err_cnt = err_cnt + 1;
                $display("[ERROR] a=%0d b=%0d : o_cout=%b expected=%b", i_a, i_b, o_cout, w_golden[8]);
            end
        end

    $display("err_cnt=%0d", err_cnt);
    if (err_cnt == 0) $display("[PASS] : 65536 vectors, ALL BCD CORRECT!");
    else              $display("[FAIL] : %0d errors", err_cnt);
    $finish;
end

endmodule
