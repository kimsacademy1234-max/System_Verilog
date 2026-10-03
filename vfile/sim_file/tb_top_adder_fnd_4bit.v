`timescale 1ns / 1ps
//==============================================================================
// Testbench   : tb_top_adder_fnd_4bit
// Description : i_a, i_b 전 조합(16x16)을 넣고 FND 폰트를 역변환해 하위 4bit 합과 비교
// DUT         : top_adder_fnd_4bit
//==============================================================================

module tb_top_adder_fnd_4bit ();

reg  [3:0] r_a;
reg  [3:0] r_b;

wire       w_cout;
wire [3:0] w_fnd_com;
wire [7:0] w_fnd_data;

reg  [3:0] r_fnd_num;   // FND 폰트 -> 숫자 역변환 값

top_adder_fnd_4bit DUT (
    .i_a        (r_a),
    .i_b        (r_b),
    .o_cout     (w_cout),
    .o_fnd_com  (w_fnd_com),
    .o_fnd_data (w_fnd_data)
);

always @(*) begin
    case (w_fnd_data)
        8'hC0: r_fnd_num = 4'h0;
        8'hF9: r_fnd_num = 4'h1;
        8'hA4: r_fnd_num = 4'h2;
        8'hB0: r_fnd_num = 4'h3;
        8'h99: r_fnd_num = 4'h4;
        8'h92: r_fnd_num = 4'h5;
        8'h82: r_fnd_num = 4'h6;
        8'hF8: r_fnd_num = 4'h7;
        8'h80: r_fnd_num = 4'h8;
        8'h90: r_fnd_num = 4'h9;
        8'h88: r_fnd_num = 4'hA;
        8'h83: r_fnd_num = 4'hB;
        8'hC6: r_fnd_num = 4'hC;
        8'hA1: r_fnd_num = 4'hD;
        8'h86: r_fnd_num = 4'hE;
        8'h8E: r_fnd_num = 4'hF;
        default: r_fnd_num = 4'h0;
    endcase
end

initial begin
    $monitor("%3d ns : a = %d / b = %d  cout = %b  SEG_NUM = %d",
             $time, r_a, r_b, w_cout, r_fnd_num);
end

integer err_cnt;
integer i, j;

initial begin
    err_cnt = 0;
    for (i = 0; i < 16; i = i + 1) begin
        for (j = 0; j < 16; j = j + 1) begin
            r_a = i;
            r_b = j;
            #10;
            if ((r_a + r_b) !== r_fnd_num) begin
                err_cnt = err_cnt + 1;
                $display("[ERROR] a:%d + b:%d is not SEG DISPLAY {%d}!!", r_a, r_b, r_fnd_num);
            end
        end
    end

    if (err_cnt == 0) $display("[PASS] : ALL BCD CORRECT!");
    else              $display("[FAIL] : Please Check %d [ERROR] Diagram", err_cnt);

    $finish;
end

endmodule
