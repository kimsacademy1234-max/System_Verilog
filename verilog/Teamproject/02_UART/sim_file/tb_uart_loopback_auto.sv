`timescale 1ns / 1ps

// UART loopback 자동 검증 TB
//  - 입력 커버리지 : 데이터 0x00~0xFF 전수, start 엣지 위상 8 bin, baud 오차 bin
//  - 마진 측정    : baud 오차를 넓혀가며 첫 실패 지점 측정 → 이론값(부록 A)과 비교
//  - 자동 판정    : scoreboard (mismatch / missing / extra), RX 출력 포트 비교, 최종 리포트
// 계획서 : ../verification_plan.md (T01, T03, T04, T05, T06, T18)

module tb_uart_loopback_auto ();

    // ---------------- 파라미터 ----------------
    localparam real CLK_PERIOD = 10.0;                        // 100 MHz
    localparam int  F_COUNT    = 100_000_000 / (9600 * 16);   // 651 clk / tick (스펙 값으로 계산, DUT 내부 참조 아님)
    localparam real T_NOM      = CLK_PERIOD * F_COUNT * 16;   // 공칭 bit 주기 104,160 ns → monitor 전용
    localparam real T_FRAME    = T_NOM * 10;                  // start + 8 data + stop
    localparam int  GAP_BITS   = 2;                           // 프레임 간 idle → 이전 echo가 끝날 여유
    localparam real DRAIN_TIMEOUT    = T_FRAME * 3;           // 이 시간 안에 echo가 안 오면 missing
    localparam real WATCHDOG_TIMEOUT = T_FRAME * 2000;        // 전체 약 800 frame × 1.2 + 여유

    // 이론 한계 (부록 A, 현재 RTL : 마지막 의미 있는 샘플 = bit7)
    localparam real LIM_FAST = 9.0 / 8.5625 - 1.0;            // 약 +5.11 %
    localparam real LIM_SLOW = 8.0 / 8.5 - 1.0;               // 약 -5.88 %

    // 마진 sweep 범위
    localparam real SWEEP_START = 0.02;
    localparam real SWEEP_STEP  = 0.0025;
    localparam int  SWEEP_N     = 25;                         // 2.00 % ~ 8.00 %

    localparam int  QD = 1024;                                // scoreboard 버퍼 깊이

    // ---------------- DUT ----------------
    reg        clk = 1'b0;
    reg        rst;
    reg        rx;
    wire       tx;
    wire [7:0] o_rx_data;
    wire       o_rx_done;

    uart_loopback dut (
        .clk      (clk),
        .rst      (rst),
        .rx       (rx),
        .tx       (tx),
        .o_rx_data(o_rx_data),
        .o_rx_done(o_rx_done)
    );

    always #(CLK_PERIOD / 2) clk = ~clk;

    // ---------------- 결과 카운터 ----------------
    // tag < 0 : sign-off 항목 (실패 = 에러) / tag >= 0 : 마진 측정 point 번호 (실패 = 측정값)
    int err_cnt      = 0;
    int pass_cnt     = 0;
    int mismatch_cnt = 0;
    int missing_cnt  = 0;
    int extra_cnt    = 0;
    int rx_port_err  = 0;
    int rx_port_pass = 0;
    int cur_tag      = -1;   // extra frame을 어느 항목 탓으로 볼지

    real m_err   [0:2*SWEEP_N-1];
    int  m_sent  [0:2*SWEEP_N-1];
    int  m_fail  [0:2*SWEEP_N-1];
    int  m_n     = 0;

    // ---------------- 커버리지 ----------------
    bit cov_data  [0:255];
    bit cov_phase [0:7];
    bit cov_cross [0:7][0:4];   // 위상 bin × baud 오차 bin (0, -2, -1, +1, +2 %)

    // ---------------- scoreboard 버퍼 (기대값 = TB가 보낸 값) ----------------
    reg [7:0] exp_tx_q   [0:QD-1];
    int       exp_tx_tag [0:QD-1];
    int       tx_wr = 0, tx_rd = 0;
    reg [7:0] exp_rx_q   [0:QD-1];
    int       exp_rx_tag [0:QD-1];
    int       rx_wr = 0, rx_rd = 0;

    // ---------------- 공통 함수 ----------------
    // 위상 : b_tick 펄스 구간 negedge 기준 k clk 뒤에 start 엣지
    //   k = 0 → 다음 posedge에서 바로 감지 (감지 지연 최소 0.5 clk)
    //   k = 1 → 방금 tick을 놓침 (감지 지연 최대 650.5 clk = 약 1 tick)
    function automatic real detect_delay_clk(input int k);
        return (k == 0) ? 0.5 : (F_COUNT - k + 0.5);
    endfunction

    function automatic int bin_of_k(input int k);
        int b;
        b = $rtoi(detect_delay_clk(k) * 8.0 / F_COUNT);
        return (b > 7) ? 7 : b;
    endfunction

    function automatic int k_of_bin(input int b);
        if (b == 0)      return 0;
        else if (b == 7) return 1;
        else             return F_COUNT - ((2 * b + 1) * F_COUNT / 16);   // bin 중앙
    endfunction

    function automatic real err_of_bin(input int e);
        case (e)
            0:       return  0.00;
            1:       return -0.02;
            2:       return -0.01;
            3:       return  0.01;
            default: return  0.02;
        endcase
    endfunction

    function automatic int ebin_of_err(input real err);
        for (int e = 0; e < 5; e++)
            if ((err - err_of_bin(e) < 1e-9) && (err_of_bin(e) - err < 1e-9)) return e;
        return -1;
    endfunction

    // 판정 결과 기록 (sign-off는 메시지 출력, 마진 측정은 집계만)
    task automatic record(input int tag, input bit ok, input string msg);
        if (tag < 0) begin
            if (ok) pass_cnt++;
            else begin
                err_cnt++;
                $display("[%0t] FAIL %s", $time, msg);
            end
        end else if (!ok) begin
            m_fail[tag]++;
        end
    endtask

    // ---------------- Driver (PC 역할) ----------------
    // err > 0 : PC가 빠름 (bit 짧음) / err < 0 : PC가 느림 (bit 김)
    task automatic send_frame(input [7:0] data, input real err, input int k, input int tag);
        real t_bit;
        int  eb;
        t_bit = T_NOM / (1.0 + err);

        // 위상 맞추기 : b_tick 위치는 자극 타이밍에만 사용 (기대값 생성에는 사용 안 함)
        @(negedge clk);
        while (dut.w_b_tick !== 1'b1) @(negedge clk);
        repeat (k) @(negedge clk);

        // 기대값 등록
        exp_tx_q[tx_wr % QD] = data;  exp_tx_tag[tx_wr % QD] = tag;  tx_wr++;
        exp_rx_q[rx_wr % QD] = data;  exp_rx_tag[rx_wr % QD] = tag;  rx_wr++;

        // 커버리지 (sign-off 항목만)
        if (tag < 0) begin
            cov_data[data]       = 1'b1;
            cov_phase[bin_of_k(k)] = 1'b1;
            eb = ebin_of_err(err);
            if (eb >= 0) cov_cross[bin_of_k(k)][eb] = 1'b1;
        end else begin
            m_sent[tag]++;
        end

        rx = 1'b0;                            // start
        #(t_bit);
        for (int i = 0; i < 8; i++) begin     // data, LSB first
            rx = data[i];
            #(t_bit);
        end
        rx = 1'b1;                            // stop
        #(t_bit);
        #(t_bit * GAP_BITS);                  // idle
    endtask

    // 남은 기대값이 다 처리될 때까지 대기 → 시간 초과 시 남은 것 = missing
    task automatic drain();
        real t0;
        t0 = $realtime;
        while (((tx_rd != tx_wr) || (rx_rd != rx_wr)) && ($realtime - t0 < DRAIN_TIMEOUT))
            #(T_NOM);
        while (tx_rd != tx_wr) begin
            if (exp_tx_tag[tx_rd % QD] < 0) missing_cnt++;
            record(exp_tx_tag[tx_rd % QD], 1'b0,
                   $sformatf("missing tx frame exp=0x%02h", exp_tx_q[tx_rd % QD]));
            tx_rd++;
        end
        while (rx_rd != rx_wr) begin
            if (exp_rx_tag[rx_rd % QD] < 0) rx_port_err++;
            record(exp_rx_tag[rx_rd % QD], 1'b0,
                   $sformatf("missing o_rx_done exp=0x%02h", exp_rx_q[rx_rd % QD]));
            rx_rd++;
        end
    endtask

    // ---------------- Monitor (tx → 바이트 복원, DUT uart_rx 재사용 안 함) ----------------
    reg [7:0] mon_data;
    bit       mon_start_ok, mon_stop_ok;

    initial begin : monitor_tx
        int tag;
        bit ok;
        forever begin
            @(negedge tx);
            #(T_NOM / 2.0);
            mon_start_ok = (tx === 1'b0);
            for (int i = 0; i < 8; i++) begin
                #(T_NOM);
                mon_data[i] = tx;
            end
            #(T_NOM);
            mon_stop_ok = (tx === 1'b1);

            if (tx_rd == tx_wr) begin
                if (cur_tag < 0) extra_cnt++;
                record(cur_tag, 1'b0, $sformatf("extra tx frame act=0x%02h", mon_data));
            end else begin
                tag = exp_tx_tag[tx_rd % QD];
                ok  = mon_start_ok && mon_stop_ok && (mon_data === exp_tx_q[tx_rd % QD]);
                if (!ok && tag < 0) mismatch_cnt++;
                record(tag, ok, $sformatf("tx exp=0x%02h act=0x%02h start_ok=%0b stop_ok=%0b",
                                          exp_tx_q[tx_rd % QD], mon_data, mon_start_ok, mon_stop_ok));
                tx_rd++;
            end
        end
    end

    // ---------------- RX 출력 포트 확인 (T18) ----------------
    always @(negedge clk) begin
        if (o_rx_done === 1'b1) begin
            if (rx_rd == rx_wr) begin
                if (cur_tag < 0) rx_port_err++;
                record(cur_tag, 1'b0, $sformatf("extra o_rx_done act=0x%02h", o_rx_data));
            end else begin
                if (o_rx_data === exp_rx_q[rx_rd % QD]) begin
                    if (exp_rx_tag[rx_rd % QD] < 0) rx_port_pass++;
                end else begin
                    if (exp_rx_tag[rx_rd % QD] < 0) rx_port_err++;
                    record(exp_rx_tag[rx_rd % QD], 1'b0,
                           $sformatf("o_rx_data exp=0x%02h act=0x%02h", exp_rx_q[rx_rd % QD], o_rx_data));
                end
                rx_rd++;
            end
        end
    end

    // ---------------- 범용 값 비교 (T01 등) ----------------
    task automatic check(input string name, input [31:0] exp_v, input [31:0] act_v);
        record(-1, (act_v === exp_v), $sformatf("%s exp=%0h act=%0h", name, exp_v, act_v));
    endtask

    // ---------------- Watchdog ----------------
    initial begin
        #(WATCHDOG_TIMEOUT);
        err_cnt++;
        $display("[%0t] ERROR : watchdog timeout", $time);
        $finish;
    end

    // ---------------- 테스트 시퀀스 ----------------
    initial begin : main
        bit [7:0] pats [0:3];
        real      err;
        pats[0] = 8'h55; pats[1] = 8'hAA; pats[2] = 8'h00; pats[3] = 8'hFF;

        // T01 : reset
        rx  = 1'b1;
        rst = 1'b1;
        #(CLK_PERIOD * 3);
        check("T01 reset tx", 1, tx);
        check("T01 reset o_rx_done", 0, o_rx_done);
        repeat (2) @(negedge clk);
        rst = 1'b0;
        repeat (3) @(negedge clk);
        check("T01 release tx", 1, tx);
        check("T01 release o_rx_done", 0, o_rx_done);

        // T03 + T18 : 데이터 전수 (오차 0, 위상 bin 순환)
        $display("[%0t] T03 data 0x00~0xFF", $time);
        for (int d = 0; d < 256; d++) send_frame(d[7:0], 0.0, k_of_bin(d % 8), -1);
        drain();

        // T04 : 위상 sweep (오차 0) — 8 bin × 패턴 4 + 랜덤 위상 32
        $display("[%0t] T04 phase sweep", $time);
        for (int b = 0; b < 8; b++)
            for (int p = 0; p < 4; p++) send_frame(pats[p], 0.0, k_of_bin(b), -1);
        for (int r = 0; r < 32; r++) send_frame($urandom_range(0, 255), 0.0, $urandom_range(0, F_COUNT - 1), -1);
        drain();

        // T05 : 보장 범위 ±2 % — 위상 8 bin × 오차 4 bin × (0x55 + 랜덤)
        $display("[%0t] T05 baud error +-2%% (guaranteed range)", $time);
        for (int e = 1; e < 5; e++)
            for (int b = 0; b < 8; b++) begin
                send_frame(8'h55, err_of_bin(e), k_of_bin(b), -1);
                send_frame($urandom_range(0, 255), err_of_bin(e), k_of_bin(b), -1);
            end
        drain();

        // T06 : 마진 측정 — 방향별 2 % → 8 %, 최악 위상 + 중간 위상 × 패턴 4
        //   PC 빠름 : 감지 지연 최대(k=1)가 최악 / PC 느림 : 감지 지연 최소(k=0)가 최악
        $display("[%0t] T06 margin sweep", $time);
        for (int dir = 0; dir < 2; dir++)
            for (int s = 0; s < SWEEP_N; s++) begin
                err = (dir == 0 ? 1.0 : -1.0) * (SWEEP_START + SWEEP_STEP * s);
                m_err[m_n]  = err;
                m_sent[m_n] = 0;
                m_fail[m_n] = 0;
                cur_tag     = m_n;
                for (int p = 0; p < 4; p++) begin
                    send_frame(pats[p], err, (dir == 0) ? 1 : 0, m_n);
                    send_frame(pats[p], err, k_of_bin(4), m_n);
                end
                drain();
                #(T_FRAME * 2);   // 깨진 프레임 잔여 출력이 다음 point로 넘어가지 않게
                m_n++;
            end
        cur_tag = -1;

        $finish;
    end

    // ---------------- 최종 리포트 ----------------
    // final은 $finish(정상 종료 · watchdog) 어느 쪽이든 실행
    // final 안에는 task 호출 불가 (function만) / iverilog 12는 final 블록 안 지역 변수 선언 시 미실행 → function으로 분리
    final report();

    function automatic void report();
        int  n_data, n_phase, n_cross;
        real last_pass_fast, last_pass_slow;
        bit  fail_seen_fast, fail_seen_slow;

        n_data = 0; n_phase = 0; n_cross = 0;
        for (int i = 0; i < 256; i++) n_data  += cov_data[i];
        for (int i = 0; i < 8; i++)   n_phase += cov_phase[i];
        for (int i = 0; i < 8; i++)
            for (int j = 0; j < 5; j++) n_cross += cov_cross[i][j];

        $display("");
        $display("==================== UART LOOPBACK RESULT ====================");
        $display(" sign-off checks : pass %0d / fail %0d", pass_cnt, err_cnt);
        $display("   tx mismatch %0d, missing %0d, extra %0d", mismatch_cnt, missing_cnt, extra_cnt);
        $display("   o_rx_data pass %0d, err %0d", rx_port_pass, rx_port_err);
        $display(" coverage : data %0d/256, phase %0d/8, phase x baud %0d/40", n_data, n_phase, n_cross);

        $display(" margin sweep (worst + mid phase, 0x55/0xAA/0x00/0xFF) : failed checks = tx + o_rx_data + extra");
        last_pass_fast = 0.0; last_pass_slow = 0.0;
        fail_seen_fast = 0;   fail_seen_slow = 0;
        for (int i = 0; i < m_n; i++) begin
            $display("   err %6.2f %% : frames %0d, failed checks %0d", m_err[i] * 100.0, m_sent[i], m_fail[i]);
            if (m_err[i] > 0) begin
                if (m_fail[i] != 0) fail_seen_fast = 1;
                else if (!fail_seen_fast) last_pass_fast = m_err[i];
            end else begin
                if (m_fail[i] != 0) fail_seen_slow = 1;
                else if (!fail_seen_slow) last_pass_slow = m_err[i];
            end
        end
        $display(" measured margin : PC fast +%0.2f %% (theory +%0.2f %%), PC slow %0.2f %% (theory %0.2f %%)",
                 last_pass_fast * 100.0, LIM_FAST * 100.0, last_pass_slow * 100.0, LIM_SLOW * 100.0);

        if (err_cnt == 0 && n_data == 256 && n_phase == 8 && n_cross == 40)
            $display(" VERDICT : PASS");
        else
            $display(" VERDICT : FAIL");
        $display("==============================================================");
    endfunction

endmodule
