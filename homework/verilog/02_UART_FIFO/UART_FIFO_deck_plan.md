# UART + FIFO Loopback 발표자료 계획

> 대상: `Teamproject/04_UART_FIFO` (uart_fifo_loopback = uart_rx → FIFO_RX → FIFO_TX → uart_tx)
> 형식: 이전 `UART_Loopback_정안성.pptx`와 같은 구성. diagram-deck 스타일 + 한글 제목 + 빨간 "결론" 2줄 (개조식) + 그 아래 파형 · 표
> 전제: PC = 9600 bps 고정 · 보드 시연 없음
> 표기: **[측정 후]** = 시뮬레이션 결과로 채울 값 · **[캡처]** = Vivado 캡처 필요 · **[재사용]** = 이전 덱 슬라이드 재사용

---

## 0. 목차 (안)

| 섹션 | 제목 | 내용 | 예상 쪽 |
|---|---|---|---|
| — | 표지 · 목차 | | 1 – 2 |
| 00 | Summary | 핵심 수치 · 시나리오 결과 | 3 |
| 01 | 목적 | FIFO 추가 목적 · 목표 | 4 |
| 02 | UART Reference | UART 통신 개념 · 16x oversampling · FIFO 개념 · PC / FPGA 속도 관계 | 5 – 8 |
| 03 | 블록 다이어그램 | uart_fifo_loopback · fifo 내부 | 9 – 10 |
| 04 | 동작 설계 | control_unit 동작표 · FIFO 사이 handshake 타이밍 | 11 – 12 |
| 05 | 시뮬레이션 | TB 구조 · 시나리오 표 · S1 ~ S5 | 13 – 19 |
| 06 | 트러블 슈팅 | 시뮬레이션 결과에 따라 구성 | 20 – 21 |
| 07 | 결론 · 고찰 | 결론 표 · 고찰 · 개선 방향 | 22 |
| — | Q&A | | 23 |
| A | 부록 | Margin · 16x 선택 이유 · ASM · FIFO 동작 정의 · TB 로그 | 24 – 27 |

---

## 1. 슬라이드별 계획

### p.1 표지
- 제목: **UART FIFO Loopback**
- 부제: 설계 · 시뮬레이션 검증
- 오른쪽 spec: clk 100 MHz · 9600 bps 8N1 · FIFO DEPTH 4 × 2 · 16x oversampling

### p.2 목차
- 0번 표 그대로, 페이지 범위 자동 계산

---

### p.3 00 Summary
- 제목: **FIFO 2단 Loopback 구현 · 검증 결과**
- 결론
  - uart_rx와 uart_tx 사이에 FIFO_RX · FIFO_TX 추가 → TX가 바쁜 동안 수신 byte를 FIFO에 보관 후 순서대로 echo
  - 시나리오 5개 결과 **[측정 후]**
- 화면: 수치 카드 6개 (3 × 2)

| 카드 | 값 | 출처 |
|---|---|---|
| FIFO | DEPTH 4 × 2 | 코드 |
| 속도 | PC 9600 / FPGA 9600.6 bps | 계산 (F_COUNT 651) |
| S1 FIFO 단독 | **[측정 후]** steps · mismatch | TB S1 |
| S3 9600 연속 | **[측정 후]** / 256 | TB S3 |
| S4 최악 조건 | **[측정 후]** / 256 | TB S4 |
| FIFO 최대 점유 | **[측정 후]** | TB S3 · S4 "FIFO max" |

---

### p.4 01 목적
- 제목: **TX가 바쁜 동안 들어온 byte도 놓치지 않는 Loopback**
- 결론
  - 수신(uart_rx)과 송신(uart_tx) 사이에 FIFO_RX · FIFO_TX를 두어 두 쪽을 분리
  - 연속 입력도 손실 · 중복 없이 같은 순서로 echo
- 화면: 위 = 02 구조 (rx_done → tx_start 직결) vs 04 구조 (FIFO 2단) 흐름도 2줄 비교, 아래 = 목표 표

| 대상 | 목표 동작 | 검증 |
|---|---|---|
| fifo | push / pop / 동시 push·pop, full · empty, pointer 순환 | S1 |
| uart_fifo_loopback | 단일 byte echo 유지 | S2 |
| uart_fifo_loopback | 9600 bps 연속 입력 손실 0 | S3 |
| uart_fifo_loopback | 여유 0 tick 상황에서도 손실 0 | S4 |
| uart_rx | START glitch 개선 유지 | S5 |

---

### p.5 02 UART Reference ① UART 통신 개념
- 제목: **UART: Clock 없이 Start Bit로 시점을 맞추는 비동기 직렬 통신**
- 결론
  - TX · RX 선이 따로 → 송신 · 수신 동시 가능 (full-duplex), 공유 clock 없음 → 양쪽이 baud만 약속
  - 8N1 frame = START(0) → D0 ~ D7 (LSB first) → STOP(1), bit 중앙 1회 sampling (ONE BIT mode)
- 화면: **[재사용]** UART_Loopback 덱 p.5
  - 왼쪽: PC ↔ FPGA 연결도 (TX → rx, tx → RX, 선 2개)
  - 오른쪽: '0' (0x30) 8N1 frame 파형 + bit 중앙 sampling 표시
  - 아래: Start bit · Stop bit · LSB first · ONE BIT mode 카드 4개

### p.6 02 UART Reference ② 16x Oversampling · 동작 주파수
- 제목: **100 MHz ÷ 651 = b_tick, 16 tick = 1 bit (104.16 µs)**
- 결론
  - F_COUNT = 100 MHz ÷ (9600 × 16) = 651 → b_tick 6.51 µs, 1 bit = 16 tick = 104.16 µs
  - START 8 tick 대기로 bit 중앙 정렬 → 이후 16 tick마다 sampling, rx_done은 STOP 중앙
- 화면: **[재사용]** UART_Loopback 덱 p.6 (계산 단계 박스 + frame 타이밍 + xsim 측정값)

### p.7 02 UART Reference ③ FIFO 개념
- 제목: **FIFO: wptr · rptr 두 포인터로 순서를 지키는 원형 버퍼**
- 결론
  - push = wptr 자리에 쓰고 +1, pop = rptr +1, 두 포인터 비교로 full · empty 판단
  - pop_data = mem[rptr] → pop 전에도 맨 앞 byte가 출력에 보임 (FWFT)
- 화면: 4칸 원형 버퍼 그림 (wptr · rptr 화살표), push 4번 → full, pop 4번 → empty 단계 그림

### p.8 02 UART Reference ④ 속도 관계
- 제목: **PC 9600 ≤ FPGA 9600.6 bps → FIFO는 몇 clk 보관용**
- 결론
  - PC frame 1,041,666.7 ns ≥ TX frame 160 tick (1,041,600 ns) → 계속 쌓이지 않음
  - rx_done이 b_tick에 맞춰 160 tick 간격 → TX STOP→IDLE과 겹치는 순간만 FIFO가 byte 보관
- 화면: frame 길이 비교 막대 (PC · FPGA), 시간축 위 rx_done · TX frame 배치 그림

---

### p.9 03 블록 다이어그램 ① uart_fifo_loopback
- 제목: **수신 → FIFO_RX → FIFO_TX → 송신, 신호 레벨로 연결**
- 결론
  - FIFO_RX push = rx_done, pop = ~tx_full / FIFO_TX push = ~rx_empty, pop = ~tx_busy
  - uart_tx tx_start = ~FIFO_TX empty → FIFO에 byte가 있는 동안 계속 송신
- 화면: 블록도 (PC sender / receiver 포함, 0x30 값 흐름 표시), 연결 신호 라벨 + 번호 카드 4개

### p.10 03 블록 다이어그램 ② fifo 내부
- 제목: **fifo = control_unit (포인터 · flag) + register_file (4 × 8 bit)**
- 결론
  - control_unit: {push, pop} 조합과 full · empty로 wptr · rptr · flag 갱신
  - register_file: we = push & ~full일 때만 쓰기, 읽기는 조합 출력
- 화면: fifo 내부 블록도 (control_unit · register_file, wptr / rptr / we 연결)

---

### p.11 04 동작 설계 ① control_unit 동작표
- 제목: **{push, pop} × empty · 중간 · full 9가지 동작**
- 결론
  - full일 때 push 무시, empty일 때 pop 무시
  - push + pop 동시: empty → push만, 중간 → 둘 다, full → pop만
- 화면: 3 × 3 표 (행 = push / pop / push+pop, 열 = empty / 중간 / full), 셀마다 wptr · rptr · flag 변화

### p.12 04 동작 설계 ② FIFO 사이 handshake 타이밍
- 제목: **rx_done → tx 시작까지 clk 단위 흐름**
- 결론
  - rx_done → FIFO_RX → FIFO_TX → tx_start → tx fall, clk 단위 단계
  - latency **[측정 후]** clk (02는 rx_done + 2 clk)
- 화면: clk 단위 타이밍 다이어그램 (rx_done, FIFO_RX empty, FIFO_TX push / empty, tx_start, c_state, tx)
- **[캡처]** S2 첫 byte 주변, wcfg 그룹 3 ~ 6

---

### p.13 05 시뮬레이션 ① TB 구조
- 제목: **TB: Sender → DUT → TX Monitor → Scoreboard**
- 결론
  - 송신 byte를 queue에 저장 → tx에서 복원한 echo와 순서대로 비교 (손실 · 중복 · 순서 검출)
  - FIFO는 TB 안 별도 instance + 기준 모델로 매 clk 비교
- 화면: TB 블록도 (PC sender, uart_fifo_loopback, TX monitor, scoreboard, inside monitor, U_FIFO_UT + model)

### p.14 05 시뮬레이션 ② 시나리오 표
- 제목: **UART FIFO 검증 시나리오**
- 결론
  - 시나리오 5개: FIFO 단독 · 단일 byte · 9600 연속 · 최악 조건 · glitch 회귀
  - 결과 **[측정 후]**
- 화면: 표 (# / 시나리오 / 입력 / 확인 신호 / 예상 결과 / 결과)

| # | 시나리오 | 입력 | 확인 신호 | 예상 결과 |
|---|---|---|---|---|
| S1 | FIFO 단독 | 고정 시퀀스 + 무작위 400 step | ut_full · ut_empty · ut_pop_data vs 모델 | 불일치 0 |
| S2 | 단일 byte echo | 256 byte, byte마다 echo 대기 (bit 104,166.667 ns) | rx_done, FIFO count, tx | 256 / 256 |
| S3 | 9600 bps 연속 | 256 byte gap 없이 (bit 104,166.667 ns) | echo 순서 · 개수, FIFO count | 손실 · 중복 0 |
| S4 | 최악 조건 | 256 byte gap 없이 (bit 104,160 ns = FPGA 속도) | rx_done vs TX STOP→IDLE, FIFO_TX count | 손실 · 중복 0 |
| S5 | START glitch 회귀 | 02 glitch 23 case | rx_done · echo 횟수 | 23 / 23 |

### p.15 S1 FIFO 단독
- 제목: **FIFO 단독: 모든 경계 상태에서 모델과 일치** (결과에 따라 수정)
- 결론
  - steps · mismatch **[측정 후]**
  - 확인한 경우: push@full · pop@empty · push+pop@empty / 중간 / full · pointer 순환 횟수 **[측정 후]**
- 화면: **[캡처]** wcfg 그룹 7 (fill → full → push 무시 → push+pop@full 구간) + 확인한 경우 횟수 표

### p.16 S2 단일 byte echo
- 제목: **단일 Byte Echo: FIFO 추가 후에도 256 / 256** (결과에 따라 수정)
- 결론
  - echo = 입력 **[측정 후]** / 256
  - rx_done → tx fall latency **[측정 후]** clk
- 화면: **[캡처]** byte 1개의 rx → FIFO_RX → FIFO_TX → tx 흐름 (그룹 2 ~ 6)

### p.17 S3 9600 bps 연속
- 제목: **9600 bps 연속 256 Byte: 손실 · 중복 0** (결과에 따라 수정)
- 결론
  - sent / echoed / 불일치 **[측정 후]**
  - FIFO 최대 점유 **[측정 후]**, TX frame 사이 공백 **[측정 후]** clk
- 화면: **[캡처]** 연속 frame 3 ~ 4개 구간 (rx · tx · FIFO count) + TB 결과 로그

### p.18 S4 최악 조건 (핵심 장면)
- 제목: **여유 0 tick 상황: rx_done이 TX 종료와 겹쳐도 FIFO가 보관 후 송신**
- 결론
  - rx_done이 TX STOP 중에 도착 → FIFO_TX count 1 → TX IDLE 즉시 다음 frame 시작
  - 256 byte 손실 · 중복 **[측정 후]**, TX 바쁠 때 rx_done 횟수 **[측정 후]**
- 화면: **[캡처]** 겹치는 순간 clk 단위 확대 (rx_done, FIFO_TX push / empty / count, UART_TX c_state STOP → IDLE → START, tx) + 번호 badge ① ~ ④

### p.19 S5 START glitch 회귀
- 제목: **START Glitch 23 Case: FIFO 구조에서도 유지**
- 결론
  - pass / fail **[측정 후]**
  - uart_rx 동일 → 02 트러블 슈팅 결과 유지
- 화면: TB 결과 로그 + 02 결과와 비교하는 작은 표

---

### p.20 – 21 06 트러블 슈팅
- 시뮬레이션에서 FAIL이 나올 경우: 현상 → 원인 → 해결 → 적용 결과 (02 덱 p.17 – 18 형식)
- 전부 PASS일 경우: **"검증 중 확인한 경계 동작"** 1장으로 대체
  - FIFO_TX pop = ~tx_busy: tx_busy가 START 진입 1 clk 뒤에 1 → TX가 오래 IDLE이던 상태에서 FIFO_TX에 2개가 있을 경우 추가 pop 가능 (PC 9600 고정에서는 재현 불가, 점유 ≤ 1)
  - full + push · pop 동시 → push 무시 (S1에서 확인)

---

### p.22 07 결론 · 고찰
- 제목: **FIFO 2단 구조로 연속 입력 Echo 손실 0**
- 결론
  - **[측정 후]** S1 ~ S5 결과 요약
  - TX 바쁜 동안 들어온 byte를 FIFO가 보관 → 02의 여유 0 tick 한계 해소
- 화면: 왼쪽 결론 표 (시나리오 · 결과 · 판정), 오른쪽 고찰 박스 + 개선 방향 박스
- 고찰 후보
  - PC 9600 고정에서는 FIFO 점유가 최대 1 수준 → DEPTH 4의 대부분은 사용되지 않음
  - full · overflow는 시스템 입력으로 재현 불가 → FIFO 단독 TB로만 검증
  - FIFO_RX full 미연결 → overflow가 생겨도 표시 없음
- 개선 방향 후보
  - FIFO_TX pop을 "tx_start 수락" 시점과 맞추는 handshake
  - overflow · full flag를 top 출력으로
  - DATA 구간 3 sample 다수결 (02 고찰 유지)

### p.23 Q&A

---

### 부록
| 쪽 | 내용 | 출처 |
|---|---|---|
| A1 | Sampling margin · 16x 선택 이유 | **[재사용]** UART_Loopback 덱 p.7 – 8 |
| A2 | uart_rx · uart_tx ASM | **[재사용]** UART_Loopback 덱 p.11 – 12 |
| A3 | FIFO full + push · pop 동시 동작 정의 | p.11 표 상세 |
| A4 | TB SUMMARY 로그 전체 | TB 출력 |

---

## 2. Vivado 캡처 목록

| 슬라이드 | 구간 | wcfg 그룹 |
|---|---|---|
| p.12 · p.16 | S2 첫 byte: rx fall ~ tx frame 시작 | 2 ~ 6 |
| p.15 | S1 fill → full → push 무시 → push+pop@full | 7 |
| p.17 | S3 연속 frame 3 ~ 4개 | 0, 2, 4, 5 |
| p.18 | S4에서 rx_done이 TX STOP과 겹치는 순간 (clk 단위 확대) | 3 ~ 6 |
| p.19 | S5 TB 로그 | Tcl console |

- scenario 신호(그룹 0)로 각 시나리오 구간을 찾을 수 있음
- 에러가 있을 경우 err_flag 펄스 위치 = 로그의 `t=` 시각

---

## 3. 결정이 필요한 것
1. full 상태에서 push · pop 동시 → push 무시를 spec으로 둘지 (S1 기대값의 기준)
2. 06 트러블 슈팅: 시뮬레이션 결과를 보고 구성 (FAIL 유무)
3. 파일명 · 발표 날짜
