# UART Loopback 검증 계획서 (Verification Plan)

| 항목 | 내용 |
|---|---|
| DUT | `uart_loopback` (`source_file/uart.v`) — `uart_rx.sv`, `uart_tx.sv`, `baud_tick_gen` |
| 현재 TB | `sim_file/tb_uart.v` |
| 근거 자료 | `lecture_1020_uart_rx.md` (10/20 수업), RTL 코드 |
| 작성일 / 상태 | 2026-10-22 / 초안 |

> 표기 : **[요구]** = 반드시 지켜야 하는 스펙 / **[제안]** = 수업 자료에 명시 없음 → 팀 결정 필요 / ⚠️ = 조건·툴에 따라 달라짐

---

## 1. 목표 · 완료 기준 (Sign-off)

**목표** : 스펙에 정의된 동작 범위 안의 모든 입력에 대해 `TB가 보낸 바이트 = DUT tx에서 복원한 바이트`, 범위 밖 입력은 스펙대로 거부·에러 처리됨을 **자동 판정**으로 증명

| # | 완료 기준 |
|---|---|
| S1 | 4장 테스트 항목 전부 PASS — scoreboard mismatch 0, 누락(missing) 0, 초과(extra) 프레임 0 |
| S2 | 5장 functional coverage bin 100% (미달 bin은 사유와 함께 waiver 기록) |
| S3 | 7장 known issue 전부 "수정 후 재검증" 또는 "스펙 제한으로 문서화" 중 하나로 종결 |
| S4 | 시뮬레이션으로 못 잡는 항목(6장)은 대체 방법(코드 리뷰·보드 테스트) 결과 기록 |

---

## 2. 스펙 (Specification)

### 2-0. 블록 다이어그램 (`uart.v`)

```
                          uart_loopback (uart.v)
           +---------------------------------------------------------+
           |                   +-------------------+                 |
           |                   |   baud_tick_gen   |                 |
           |                   |  1 tick / 651 clk |                 |
           |                   +---------+---------+                 |
           |                             | w_b_tick                  |
           |               +-------------+-------------+             |
           |               |                           |             |
           |       +-------v-------+           +-------v-------+     |
   rx ---->|------>| rx            | w_rx_data | tx_data       |     |
           |       |               |==========>|               |     |
           |       |    uart_rx    |   [7:0]   |    uart_tx    |     |
           |       |               | w_rx_done |               |     |
           |       |               |---------->| tx_start   tx |---->|----> tx
           |       |               |           |               |     |
           |       |               |           | tx_busy  (NC) |     |
           |       +---+-------+---+           +---------------+     |
           |           |       |                                     |
           |           |       +------------------------------------>|----> o_rx_done
           |           +============================================>|====> o_rx_data[7:0]
           +---------------------------------------------------------+
```

- `---->` : 1bit 신호 / `====>` : 8bit 버스 / `NC` : 연결 안 됨 (no connect)
- `clk`, `rst`는 3개 블록에 모두 공통으로 들어감 (그림에서 생략)

| 신호 | 폭 | 출발 → 도착 | 설명 |
|---|---|---|---|
| `rx` | 1 | PC → `uart_rx` | 직렬 입력, idle = 1, synchronizer 없이 직접 입력 (KI-3) |
| `w_b_tick` | 1 | `baud_tick_gen` → `uart_rx`, `uart_tx` | 651 clk마다 1 clk 폭 펄스 (9600 × 16 oversampling) |
| `w_rx_data` | 8 | `uart_rx` → `uart_tx.tx_data`, `o_rx_data` | 수신 바이트, `rx_done` 시점에 유효 |
| `w_rx_done` | 1 | `uart_rx` → `uart_tx.tx_start`, `o_rx_done` | stop bit 중앙에서 1 clk 펄스 → 그대로 TX 시작 신호로 사용 |
| `tx` | 1 | `uart_tx` → PC | 직렬 출력 (echo), idle = 1 |
| `tx_busy` | 1 | `uart_tx` → 연결 없음 | busy 중 들어온 `tx_start`는 무시됨 → 연속 수신 시 유실 가능 (KI-4) |
| `o_rx_data`, `o_rx_done` | 8, 1 | top 출력 | RX 결과 관측용 (ASCII · FND 쪽에서 사용) |

### 2-1. 공통

| ID | 항목 | 스펙 | 근거 |
|---|---|---|---|
| SP-01 | 시스템 클럭 | 100 MHz | `uart.v` 주석, `F_COUNT` |
| SP-02 | 프레임 형식 | 8N1 : start 1bit(0) + data 8bit + parity 없음 + stop 1bit(1) | 수업 |
| SP-03 | 비트 순서 | LSB first | 수업 6-2 (SIPO, LSB부터) |
| SP-04 | Baud rate | 9600 bps (공칭) | 수업 |
| SP-05 | Oversampling | b_tick = 9600 × 16 = 153,600 Hz 목표, `F_COUNT = 651` → 실제 ≈ 153,609.8 Hz (≈ 9600.6 bps, +0.006%) *(계산)* | `baud_tick_gen` |
| SP-06 | b_tick 형태 | 651 clk마다 1 clk 폭 펄스 | `baud_tick_gen` |
| SP-07 | Reset | `rst` active-high, 비동기 assert | RTL |
| SP-08 | Idle 레벨 | rx·tx 모두 idle = 1 | 수업 |

### 2-2. RX (`uart_rx`)

| ID | 항목 | 스펙 | 현재 RTL |
|---|---|---|---|
| SP-10 | Start 감지 | IDLE에서 b_tick 시점에 rx = 0이면 START 진입 | ✅ |
| SP-11 | Start 재확인 **[요구]** | START에서 8 tick(1/2 bit) 후 rx 재확인 : 0 → DATA, 1 → IDLE 복귀 (false start 거부) | ❌ 재확인 없음 (KI-1) |
| SP-12 | Data 샘플링 | 이후 16 tick마다 비트 중앙에서 샘플, SIPO로 LSB부터 수집 | ✅ |
| SP-13 | Stop 검사 **[요구]** | stop bit 중앙에서 rx = 1 확인, 0이면 frame error | ❌ 검사 없음 (KI-2) |
| SP-14 | IDLE 복귀 시점 | stop bit 중앙에서 판정 후 바로 IDLE (다음 프레임 준비) | ✅ |
| SP-15 | rx_done | 정상 수신 시 1 clk 폭 펄스, 이때 `rx_data` 유효 | ✅ (1 clk) |
| SP-16 | Frame error 처리 **[제안]** | error 펄스 출력, `rx_done` 미발생 → TX echo 안 함 | ❌ error 포트 없음 (KI-2) |
| SP-17 | False start 처리 **[제안]** | 출력 없음 (rx_done·error 모두 미발생), IDLE 복귀 | ❌ (KI-1) |
| SP-18 | 허용 baud 오차 **[제안]** | 상대 오차 ±2% 이내 정상 수신 **보장** — 수업 자료의 일반적 허용치 2~3% 중 보수적 값 | 검증 대상 |
| SP-19 | 입력 동기화 **[제안]** ⚠️ | rx는 비동기 입력 → 2-FF synchronizer 권장 (수업 : 없어도 에러 드묾, 100%는 아님) | ❌ 없음 (KI-3) |

### 2-3. TX (`uart_tx`)

| ID | 항목 | 스펙 | 현재 RTL |
|---|---|---|---|
| SP-20 | 시작 | IDLE에서 `tx_start` = 1 이면 `tx_data` 래치 후 START | ✅ |
| SP-21 | 비트 길이 | start · data · stop 각 16 tick | ✅ (첫 start bit만 최대 1 tick 짧을 수 있음, 비누적 — 수업 7) |
| SP-22 | tx_busy | START 진입 시 1, IDLE 복귀 시 0 | ✅ |
| SP-23 | busy 중 tx_start | 무시됨 | ✅ (RTL 동작) |

### 2-4. Loopback top

| ID | 항목 | 스펙 | 현재 RTL |
|---|---|---|---|
| SP-30 | Echo | 정상 수신한 바이트를 그대로 tx로 재송신 (`rx_done` → `tx_start`) | ✅ |
| SP-31 | 연속 수신 **[제안]** | back-to-back(프레임 간 idle 0) 연속 프레임을 유실 없이 echo — PC baud가 DUT 이하일 때 | 검증 대상 (KI-4) |
| SP-32 | 처리량 초과 **[제안]** | PC baud > DUT baud로 연속 스트림 시 FIFO가 없어 유실은 불가피 → 스펙 제한으로 명시 (또는 FIFO·flow control 추가) | 팀 결정 |
| SP-33 | 관측 포트 | `o_rx_data`, `o_rx_done` = RX 출력 그대로 | ✅ |

---

## 3. 검증 환경 (TB 구조)

| 구성 요소 | 역할 | 독립성 조건 |
|---|---|---|
| Driver (sender) | 바이트 → rx 직렬 신호 생성. **baud 오차**, **start 엣지 위상**, **프레임 간격**, **에러 주입**(glitch, stop=0, start 단축)을 파라미터로 조절 | rx 변경은 clk posedge를 피해서 (race 방지) |
| Phase 동기 | start 엣지를 b_tick 기준 원하는 위치에 놓기 위해 b_tick 타이밍 참조 | 자극(stimulus) 타이밍에만 사용, 기대값 생성에는 사용 금지 |
| Monitor (tx) | DUT tx → 바이트 복원. start 엣지 동기 후 bit 중앙 샘플, start·stop 값도 검사 | DUT의 `uart_rx` 재사용 금지 (같은 버그가 상쇄됨). DUT **공칭 baud** 사용 (driver의 오차 baud와 분리) |
| Monitor (rx 출력) | `o_rx_done` 시점의 `o_rx_data` 수집 | — |
| Scoreboard | 기대값 queue : driver가 **정상 프레임** 보낼 때만 push → monitor 출력과 순서대로 비교 | 기대값 = TB가 보낸 값 (DUT 출력에서 유도 금지) |
| 누락 · 초과 검출 | 프레임당 timeout(예 : 2 프레임 시간)동안 출력 없으면 missing, queue 비었는데 출력 오면 extra, 종료 시 queue empty 확인 | — |
| Assertion (SVA) | 아래 표 | — |
| 결과 리포트 | PASS / FAIL 개수, 실패 시 데이터·위상·baud 오차 조건 출력 | 사람이 파형을 보는 건 실패 디버깅 때만 |

**Assertion 목록**

| ID | 성질 |
|---|---|
| A1 | `rx_done`은 항상 1 clk 폭 |
| A2 | b_tick 간격 = 651 clk |
| A3 | tx_busy = 0 이면 tx = 1 |
| A4 | RX · TX FSM은 정의된 4개 state 외 값 없음 |
| A5 | reset 중 tx = 1, rx_done = 0 |

**현재 TB 대비 보완점** : 1회 랜덤 송신뿐 → 반복·파라미터화 필요 / score_board가 출력만 하고 FAIL 집계 없음 / missing·extra 검출 없음 / driver·monitor baud가 같은 파라미터 하나

---

## 4. 테스트 항목

| ID | 분류 | 시나리오 | 자극 | 기대 결과 | 우선순위 | 현재 RTL 예상 |
|---|---|---|---|---|---|---|
| T01 | 기본 | Reset 후 상태 | rst assert → release | tx = 1, rx_done = 0, FSM IDLE | 높음 | PASS |
| T02 | 기본 | 단일 프레임 (smoke) | 0x55 1회, 오차 0 | echo 일치 | 높음 | PASS |
| T03 | 정상 | 데이터 전수 | 0x00~0xFF, 오차 0, 프레임 간 충분한 간격 | 256개 전부 일치 | 높음 | PASS |
| T04 | 타이밍 | Start 엣지 위상 sweep | 5-2 위상 bin × 패턴 데이터 | 전부 일치 | 높음 | PASS |
| T05 | 타이밍 | Baud 오차 sweep (보장 범위) | ±2% 이내 bin × 위상 bin × 패턴 | 전부 일치 | 높음 | PASS |
| T06 | 타이밍 | Baud 오차 마진 측정 | ±2% ~ 이론 한계(부록 A) 구간 | 첫 실패 지점 기록 → 부록 A 계산과 비교 | 중간 | 측정 |
| T07 | 타이밍 | 이론 한계 밖 | 한계 + 0.5% 이상 | 실패가 **검출되는지** 확인 (scoreboard가 잡아야 함) | 중간 | 검출 |
| T08 | 연속 | Back-to-back | 연속 N프레임, idle 0, 오차 0 | 유실 없이 순서대로 일치 | 높음 | ⚠️ KI-4 |
| T09 | 연속 | Back-to-back + PC 느림 | 연속 N프레임, PC −1%, −2% | 유실 없음 | 높음 | 확인 필요 |
| T10 | 연속 | Back-to-back + PC 빠름 | 연속 N프레임, PC +1%, +2% | SP-32 결정에 따름 (유실 허용 시 : 유실 개수만 기록, 데이터 오염은 0) | 중간 | 유실 예상 |
| T11 | 연속 | 프레임 간격 랜덤 | idle 0 ~ 수 프레임 랜덤 | 전부 일치 | 중간 | — |
| T12 | 비정상 | Glitch (false start) | IDLE 중 rx = 0 펄스, 폭 : 1 clk / 1 tick 미만 / 1 tick / 1/2 bit 미만 | 출력 없음 (SP-17) | 높음 | ❌ KI-1 |
| T13 | 비정상 | Frame error | stop bit = 0 | error 펄스, echo 없음 (SP-16) | 높음 | ❌ KI-2 |
| T14 | 비정상 | Break | rx를 수 프레임 시간 동안 0 유지 후 복귀 | frame error, 복귀 후 다음 정상 프레임 정상 수신 | 중간 | ❌ 0x00 반복 수신 예상 |
| T15 | 비정상 | Stop 단축 | stop bit 1/2 bit 미만 후 다음 start | 스펙 결정 필요 (거부 또는 frame error) | 낮음 | — |
| T16 | Reset | 수신 중 reset | START · DATA · STOP 각 state에서 rst | 즉시 IDLE, 출력 없음, 이후 정상 프레임 정상 동작 | 중간 | PASS 예상 |
| T17 | Reset | rx = 0 상태로 reset release | rx low 중 rst 해제 | 스펙 결정 필요 (false start 처리와 동일 권장) | 낮음 | — |
| T18 | 관측 | RX 출력 포트 | T03과 동시 | `o_rx_done` 시 `o_rx_data` = 기대값, A1 | 높음 | PASS |
| T19 | 회귀 | Constrained random | 데이터 · 위상 · baud(보장 범위) · 간격 랜덤, 수천 프레임 | 전부 일치, coverage 기여 | 중간 | — |

---

## 5. Coverage 모델

### 5-1. 단일 축

| 축 | Bin | 비고 |
|---|---|---|
| 데이터 값 | 0x00 ~ 0xFF (256) | T03 |
| Start 엣지 위상 (b_tick 대비) | P0 tick과 같은 clk / P1 tick 1 clk 전 / P2 tick 1 clk 후 / P3~P6 tick 주기 1/4 구간 4개 | P2 = 감지 지연 최대 (PC 빠를 때 최악), P1 = 지연 최소 (PC 느릴 때 최악) |
| Baud 오차 | 0 / ±1% / ±2% (보장) / ±3%, ±4%, 한계 근처 (마진 측정) / 한계 밖 (검출 확인) | 부록 A |
| 프레임 간격 | 0 (back-to-back) / 1 tick 미만 / 1/2 bit / 1 bit / 수 프레임 | |
| 에러 종류 | 정상 / glitch(폭 4종) / stop = 0 / break / stop 단축 | |
| Reset 시점 | IDLE / START / DATA / STOP | |

### 5-2. Cross (곱할 조합만)

| Cross | 이유 |
|---|---|
| 위상 × Baud 오차 | 둘 다 샘플링 시점을 움직임, 최악 조합(P2 × PC 빠름, P1 × PC 느림)이 따로 존재 |
| Baud 오차 × 탐지 패턴 | 비트 밀림을 scoreboard가 **볼 수 있는** 데이터여야 함 (아래) |
| 프레임 간격 0 × Baud 오차 | TX 병목 · 유실 (KI-4) |

**탐지 패턴 조건** : 누적 오차는 마지막 data bit(bit7)에서 최대 → bit7이 먼저 틀림

| 상황 | bit7 샘플이 실제로 읽는 비트 | 검출 조건 | 예 |
|---|---|---|---|
| PC 빠름 (샘플이 늦어짐) | stop bit (= 1) | bit7 = 0 | 0x55, 0x00 |
| PC 느림 (샘플이 빨라짐) | bit6 | bit7 ≠ bit6 | 0x55, 0xAA |

→ 양방향 모두 잡는 패턴 = bit7 = 0, bit6 = 1 (예 : **0x55**, 0x40). 0xFF는 PC 빠름, 0x00은 PC 느림 쪽 밀림을 못 잡음

### 5-3. Code coverage ⚠️

- Line · branch · FSM state/transition coverage 수집 권장
- Vivado xsim의 지원 범위는 버전별로 다름 → 툴 문서 확인 후 결정

---

## 6. 시뮬레이션으로 못 잡는 항목

| 항목 | 이유 | 대체 방법 |
|---|---|---|
| Metastability (rx 비동기 입력) | RTL 시뮬레이션은 metastability를 재현하지 않음 | 코드 리뷰로 2-FF synchronizer 유무 확인 (SP-19) |
| 실제 PC baud 오차 | USB-UART 브리지 칩 클럭에 의존 ⚠️ | 칩 데이터시트 확인, 보드에서 ComMaster로 연속 전송 테스트 |
| Rise/fall · 노이즈 | 시뮬레이션 엣지는 이상적 | 보드 테스트, 실제 마진은 부록 A보다 작음 |

---

## 7. Known Issues (코드 리뷰 결과, 검증으로 확인할 것)

| ID | 내용 | 관련 스펙 / 테스트 |
|---|---|---|
| KI-1 | START에서 `b_tick_cnt == 7` 시 rx 재확인 없이 DATA 진입 → glitch로 쓰레기 프레임 수신·echo | SP-11, SP-17 / T12 |
| KI-2 | STOP에서 rx 값 미검사, error 출력 없음 → stop = 0이어도 `rx_done` 발생 | SP-13, SP-16 / T13, T14 |
| KI-3 | rx가 synchronizer 없이 FSM에 직접 입력 | SP-19 / 6장 |
| KI-4 | **가설** : `tx_busy` 미연결, `tx_start`는 1 clk 펄스. 오차 0 back-to-back에서 TX의 IDLE 복귀와 다음 `rx_done`이 거의 같은 tick에 맞물림 → PC가 조금이라도 빠르면 `rx_done`이 TX STOP 중 도착해 프레임 유실 가능 | SP-31, SP-32 / T08~T10 |

---

## 8. 진행 순서

| 단계 | 테스트 | 진입 조건 |
|---|---|---|
| 1. TB 구축 | driver · monitor · scoreboard · assertion | — |
| 2. Smoke | T01, T02 | 1 완료 |
| 3. 정상 전수 | T03, T18 | 2 PASS |
| 4. 타이밍 | T04 → T05 → T06, T07 | 3 PASS |
| 5. 연속 | T08 → T09 → T10, T11 | 4 PASS |
| 6. 비정상 · Reset | T12 ~ T17 | KI-1, KI-2 RTL 수정 후 |
| 7. 회귀 | T19 + 전체 재실행, coverage 확인 | RTL 수정 시마다 |
| 8. 보드 | ComMaster 단일·연속 전송 | 7 완료 |

---

## 9. TB 구현 단계

> 단계별로 직접 작성 → 완료 확인 후 다음 단계 진행. 상세는 진행하면서 추가

| 단계 | 만들 것 | 완료 확인 | 관련 항목 | 상태 |
|---|---|---|---|---|
| 1 | 뼈대 : clk · rst · DUT 인스턴스 · watchdog | 컴파일 OK, reset 후 tx = 1 자동 판정 | T01 | 진행 중 |
| 2 | Driver (sender) | bit 폭 104,160 ns (파형 1회 확인) | — | |
| 3 | Monitor (tx → 바이트 복원) | 0x55 1회 복원 | T02 | |
| 4 | Scoreboard | 고의 오답에서 FAIL 검출 | S1 | |
| 5 | 데이터 전수 + RX 출력 포트 확인 | 256개 PASS | T03, T18 | |
| 6 | 자극 제어 (위상 · baud 오차 · 간격) | 해당 bin 통과 | T04~T11 | |
| 7 | 에러 주입 · 수신 중 reset | KI-1, KI-2 FAIL 검출 | T12~T17 | |
| 8 | Assertion · coverage · 랜덤 회귀 | coverage 100% | A1~A5, T19 | |

### 9-1. 1단계 : 뼈대

**목표** : 이후 단계가 올라갈 기반 + reset 동작(T01)을 TB가 스스로 판정

| # | 체크리스트 | 어떻게 만들면 되는지 | 이유 |
|---|---|---|---|
| 1 | 100 MHz clk 생성 | `always` : 5 ns마다 반전, 초기값 0은 `initial`에서 | SP-01, DUT `F_COUNT`가 100 MHz 기준 |
| 2 | rst assert → release | 메인 `initial` : 1로 시작, 몇 clk 후 0 — 해제는 clk posedge 피해서 | SP-07 비동기 reset, 엣지와 겹치면 race |
| 3 | rx 초기값 = 1 (idle) | 메인 `initial` : time 0에 rst와 함께 설정 | SP-08, X·0이면 IDLE에서 false start (T17) |
| 4 | DUT 인스턴스 | `uart_loopback` 1개, 이름 기반 포트 연결 (`clk`, `rst`, `rx`, `tx`, `o_rx_data`, `o_rx_done`), 출력은 `wire`/`logic` — rx · tx 모듈 개별 인스턴스 아님 | top-level 검증, 현재 TB는 `o_rx_*` 미연결 → 5단계(T18)에서 필요 |
| 5 | bit 주기 파라미터 분리 | `parameter` 2개 : DUT 공칭 = clk 주기 × 651 × 16 / driver용 = 공칭 × (1 + 오차) | monitor는 DUT 공칭, driver만 오차 → 6단계 baud 오차 주입 |
| 6 | Watchdog (전체 timeout) | 별도 `initial` : 제한 시간 대기 → 에러 메시지 → `$finish` | 메인과 병렬 실행 필요 (task 순차 호출 시 메인 정지), tx 하강 엣지 무한 대기 방지 |
| 7 | Reset 자동 판정 | `task` 1개 : 이름 · 기대값 · 실제값 인자 → 불일치 시 카운터 증가 + `$time` · 기대 · 실제 출력, 비교는 `!==` | T01, A5 육안 확인 대신 / `!=`는 X 섞이면 결과 X → FAIL 누락, `!==`는 X · Z까지 비교 / 범용으로 만들면 4 · 5단계 재사용 |
| 8 | 에러 카운터 + 최종 리포트 | 카운터 = 모듈 레벨 `int`, 리포트 = `final` 블록 (카운터 0 → PASS) | `final`은 `$finish`로 끝나도 실행 → watchdog 종료 시에도 리포트, 4단계 scoreboard 리포트 기반 |

**완료 조건**
- 컴파일 · elaboration 에러 없음
- T01 PASS 출력, watchdog 미동작으로 정상 종료
- 판정의 기대값을 일부러 반대로 바꿨을 때 FAIL이 출력되는지 확인 (판정 로직이 실제로 동작하는지 — 항상 PASS만 내는 checker 방지)

**다음 단계 전 생각할 점** : 현재 TB는 sender 종료 후 receive를 순차 호출. DUT는 stop bit **중앙**에서 이미 tx 송신을 시작함 → receive 시작 시점에 tx는 이미 start bit 진행 중 → 이 상태에서 반 bit 대기 후 샘플하면 비트의 어느 위치를 읽게 되는지 (코드 분석상 추정, 확인 필요) → driver · monitor 동시 실행 구조의 필요성

---

## 부록 A. 허용 baud 오차 이론 계산 *(계산 — 이상적 엣지, clk 단위 지연 무시)*

**모델**
- 송신(PC) bit 주기 T_s, 수신(DUT) bit 주기 T_r, start 엣지 시각 = 0
- start 감지 지연 δ = 0 ~ 1 tick (= 0 ~ T_r/16)
- start 엣지부터 k번째 비트(start = 0번) 중앙 샘플 시각 = δ + (k + 0.5)·T_r
- 송신 측 k번째 비트 구간 = [k·T_s, (k+1)·T_s] 안에 샘플이 있어야 함

| 마지막 의미 있는 샘플 | PC 빠름 한계 (δ = 1/16 bit) | PC 느림 한계 (δ = 0) |
|---|---|---|
| bit7 (k = 8) — **현재 RTL** (stop 미검사) | f_s/f_r < 9 / 8.5625 → **약 +5.1%** | f_s/f_r > 8 / 8.5 → **약 −5.9%** |
| stop (k = 9) — **SP-13 반영 후** | f_s/f_r < 10 / 9.5625 → **약 +4.6%** | f_s/f_r > 9 / 9.5 → **약 −5.3%** |

- 한계가 비대칭인 이유 : 감지 지연 δ는 샘플을 항상 **늦추는** 방향 → PC 빠름(샘플이 늦어지는 쪽) 마진만 깎음
- 수업 자료(TI MSP430 앱노트 정리) : 50% − 1/16(6.25%) − rise/fall 2% = 41.75%, 10bit 누적 → ±4.175% ⚠️ 이 값이 송·수신 **합산** 오차인지 각각인지는 원문 확인 필요
- 시뮬레이션은 rise/fall이 없으므로 T06 측정값은 위 표에 가까워야 하고, 실제 보드 마진은 이보다 작음
- Back-to-back 시 PC가 +4.6% 이상 빠르면 다음 start 엣지가 RX의 IDLE 복귀보다 먼저 옴 → 다음 프레임의 감지 지연 증가, 마진 추가 감소 (T09·T10에서 확인)
