# Digital Design Interview Portfolio

> 디지털 설계 엔지니어 면접 대비 기록
> 출처: 숙제(PDF) · 수업 내용 · 수업 중 의문 → Claude와 토론 → 면접용으로 재구성

---

## 작성 규칙

- **대제목** = 주제 분류 (순차 회로 & 타이밍, 조합 논리, RTL 설계, 검증 …)
- **Q 항목** = 면접 질문 + 올바른 답 위주 (토론 과정·내 오답은 기록하지 않음)
  - `한 줄 답` : 질문에 대한 결론 한 문장
  - `면접 답변` : 30초~1분 구두 답변
  - `설명` : 답을 뒷받침하는 원리 (그림·식·표)
  - `꼬리 질문` : 이어서 나올 질문 + 모범 답
  - `헷갈리기 쉬운 점` : 틀리기 쉬운 포인트 (짧게)
  - `근거` : 교재 / 표준 / 데이터시트
- 정확성 표시 : 표시 없음 = 표준 교재 수준의 확립된 내용 / ⚠️ = 공정·셀·툴마다 다름 (면접에서 단정 금지)
- **문제 해결 경험**은 STAR 형식 (Situation · Task · Action · Result)

---

## 목차

1. [순차 회로 & 타이밍](#1-순차-회로--타이밍)
2. [CDC · 동기화](#2-cdc--동기화)
3. [검증 (Verification)](#3-검증-verification)
4. [통신 인터페이스 (UART · SPI · I2C)](#4-통신-인터페이스-uart--spi--i2c)
5. [SystemVerilog OOP (class · handle · 메모리)](#5-systemverilog-oop-class--handle--메모리)
6. [문제 해결 경험](#6-문제-해결-경험)
7. [진행 중 토론](#진행-중-토론)
8. [토론 대기 질문](#토론-대기-질문)

---

## 1. 순차 회로 & 타이밍

<!-- Q 항목 템플릿
### Q1-0. (면접 질문)

> **한 줄 답** : 

**면접 답변**
- 

**설명**
- 

**꼬리 질문**
- **Q.** 
  - **A.** 

**헷갈리기 쉬운 점**
- 

<sub>근거 : … · 출처 : …</sub>
-->

### Q1-1. Positive-edge D-FF 내부의 반전 클럭(~CLK) 지연이 setup / hold time에 주는 영향

> **한 줄 답** : ~CLK 지연은 setup에 더해지는 요소가 아닌 **hold 요구를 늘리는 요소**, 그리고 이 지연은 셀의 t_su · t_h 값에 **이미 포함**

**면접 답변**
- Positive-edge D-FF = negative latch(Master) + positive latch(Slave), Master용 반전 클럭은 셀 내부 인버터로 생성
- 인버터 지연 때문에 rising edge 직후 잠깐 두 latch가 동시에 열리는 **clock overlap** 발생
- 이 구간에 다음 cycle의 새 D가 들어오면 Master를 거쳐 Q까지 그대로 통과하는 **race-through** → **hold time violation**
- 이 지연은 셀 특성화(characterization) 때 t_su · t_h에 이미 반영 → 설계자는 데이터시트 값만 만족하면 됨
- Hold 위반은 data 경로에 delay buffer를 넣어 새 데이터 도착을 늦추는 방식으로 해결

**설명**

```
CLK 핀      ____|‾‾‾‾‾‾‾‾‾
~CLK(내부)  ‾‾‾‾‾‾‾|_______     인버터 지연 Δ
                |←Δ→|
             CLK 핀  Master가 실제로 닫히는 시점
```

- 구조
  - Master : CLK=0일 때 transparent, Slave : CLK=1일 때 transparent
  - Rising edge → Master 닫힘(값 고정), Slave 열림(Master 값을 Q로 전달)
- 용어 구분
  - t_su : edge **전에** D가 Master 내부 저장 노드(feedback loop)까지 들어가 안정돼야 하는 시간
  - t_c-q : edge **후** Master 값이 Slave를 거쳐 Q로 나오기까지 걸리는 시간
- 왜 hold 문제인지
  - Edge 전에 와 있던 이전 D → 이미 Master에 저장, setup 만족
  - Overlap(Δ) 동안 새는 것 = edge **이후** 바뀐 새 D → "새 데이터가 너무 빨리 바뀜" = hold 위반
- 왜 따로 더하지 않는지
  - t_su · t_h = 셀 바깥 **D 핀 · CLK 핀 기준** 측정값 → 내부 인버터 지연 포함
  - 예 : Vivado timing report의 `FDRE (Setup_fdre_C_D)` → 셀 하나에 값 하나
- Sampling 시점 이동 (CLK 핀 기준)

  | | 이전 D (setup) | 새 D (hold) |
  |---|---|---|
  | Master 실제 닫힘 = CLK 핀 + Δ | 마감이 늦어져 여유 생김 | 문이 늦게 닫혀 더 오래 기다려야 함 |
  | 결과 | **t_su 감소** | **t_h 증가** |

  - 일반 원칙 : FF 내부 clock 경로 지연 ↑ → t_su ↓ · t_h ↑ / 내부 data 경로 지연 ↑ → t_su ↑ · t_h ↓

**꼬리 질문**
- **Q.** Hold violation은 클럭 주파수를 낮추면 해결되는지
  - **A.** 해결 불가
    - Hold 검사 = 같은 edge에서 출발한 새 데이터가 capture FF의 hold window를 침범하는지 비교 → 식에 주기 T 없음
    - 그래서 칩 제작 후 hold 위반 = 어떤 주파수에서도 동작 불가 → 설계 단계에서 반드시 해결
    - 해결 : data 경로에 delay buffer 삽입 (Vivado 등 구현 툴이 route 단계에서 자동 hold fixing)
    - 주파수 낮추기는 setup 위반 대책
- **Q.** Capture FF의 클럭이 launch FF보다 늦게 도착하는 clock skew가 있으면 setup · hold 여유는
  - **A.** Setup slack 증가, hold slack 감소
    - Setup : capture edge가 늦게 와서 데이터 경로에 쓸 시간이 skew만큼 늘어남
    - Hold : 데이터 도착 시점은 그대로인데 capture edge와 hold window가 skew만큼 뒤로 밀림 → 데이터가 상대적으로 너무 일찍 도착
    - 식 (t_skew = t_clk,capture − t_clk,launch)

      ```
      Setup : t_c-q,max + t_comb,max + t_su ≤ T + t_skew     (주기 T 있음)
      Hold  : t_c-q,min + t_comb,min        ≥ t_h + t_skew   (주기 T 없음)
      ```

    - 위 "FF 내부 clock 지연 → t_su ↓ · t_h ↑"와 같은 원리 (capture 쪽 clock이 늦으면 setup 유리, hold 불리)

**헷갈리기 쉬운 점**
- "Master → Slave로 값이 넘어가는 시간"은 t_su가 아닌 **t_c-q**
- Overlap으로 새는 데이터는 이전 D가 아닌 **새 D** → setup이 아닌 hold 문제
- 내부 clock이 늦어지면 t_su는 **줄고** t_h는 **늘어남** (반대로 외우기 쉬움)
- Skew로 hold가 불리해지는 이유는 launch가 빨라져서가 아닌 **capture edge가 늦어져서**
- ⚠️ Overlap은 hold time의 여러 원인 중 하나 → 셀 구조에 따라 t_h가 0 근처나 음수인 셀도 존재, 수치는 공정 · 셀마다 다름

<sub>근거 : Rabaey et al., *Digital Integrated Circuits* 2nd ed. Ch.7 (master-slave register, clock overlap · race) · Weste & Harris, *CMOS VLSI Design* Ch.10 (setup · hold, min-delay) · Xilinx UG906 (timing report) · 출처 : 수업 중 의문 (`../homework.md`), 2026-10-09</sub>

---

### Q1-2. 설계에서 말하는 margin이 무엇이고 왜 필요한지

> **한 줄 답** : Margin = **요구 조건(스펙)과 실제 동작 한계 사이의 여유** → 타이밍에서는 slack, 시뮬레이션 · STA가 다 잡지 못하는 실제 변동(PVT, jitter, aging 등)을 흡수하기 위한 여유

**면접 답변**
- 디지털 설계에서 margin은 보통 timing margin = slack 의미
- Setup slack = 데이터가 와야 하는 시간(required) − 실제 도착 시간(arrival) → 양수면 그만큼 여유, 음수면 위반
- 필요한 이유 : 실제 칩은 공정 · 전압 · 온도(PVT), clock jitter, 노화(aging)에 따라 지연이 달라짐 → slack 0에 딱 맞추면 조건이 조금만 나빠져도 오동작
- 확보 방법 : worst corner 분석, clock uncertainty 반영, 목표보다 빠른 클럭으로 제약(over-constraint)
- 너무 크게 잡으면 면적 · 전력 증가, 성능 손해 → 적정 수준이 trade-off

**설명**

- **Timing margin = slack**

  ```
  Setup slack = Required time − Arrival time      (≥ 0 이면 OK)
  Hold  slack = Arrival time  − Required time     (≥ 0 이면 OK)
  ```

  - Q1-1의 setup / hold 식에서 부등호 양변의 차이 = slack
  - Vivado Timing Summary : WNS(Worst Negative Slack) · TNS(Total) = setup, WHS · THS = hold → 모두 0 이상이어야 timing met

- **Margin이 필요한 이유 (실제 칩이 STA 모델과 다른 원인)**

  | 원인 | 내용 |
  |---|---|
  | Process | 같은 웨이퍼 · 같은 칩 안에서도 트랜지스터 특성 편차 |
  | Voltage | 공급 전압 변동, IR drop (전류가 흐르며 전원 배선에서 전압 강하) |
  | Temperature | 온도에 따라 트랜지스터 · 배선 지연 변화 |
  | Clock jitter | 클럭 edge가 매 cycle 미세하게 흔들림 |
  | Aging | 장시간 사용 시 트랜지스터 특성 열화 → 지연 증가 |

- **Margin 확보 방법**
  - Corner 분석 : 가장 느린 조건(slow corner)에서 setup, 가장 빠른 조건(fast corner)에서 hold 검사
    - ⚠️ 미세 공정에서는 temperature inversion(저온이 더 느려지는 현상)으로 worst corner가 달라질 수 있음
  - Clock uncertainty : jitter 등을 STA에 여유로 반영 (Vivado `set_clock_uncertainty`)
  - Derating / OCV : 칩 내 위치별 편차를 지연에 비율로 반영
  - Over-constraint : 목표 주파수보다 조금 빠른 클럭으로 합성 · 배치 배선 → 남는 여유를 margin으로 사용
  - ⚠️ 얼마나 잡는지(%, ps)는 회사 · 공정 · 제품마다 다름 → 면접에서 특정 수치 단정 금지

- **다른 의미의 margin (질문 맥락으로 구분)**

  | 용어 | 의미 |
  |---|---|
  | Timing margin | 위의 slack, 디지털 설계 면접에서 가장 흔한 의미 |
  | Noise margin | 논리 레벨이 잡음을 견디는 여유 : NM_H = V_OH − V_IH, NM_L = V_IL − V_OL |
  | Voltage margin | 정격 전압에서 얼마나 벗어나도 동작하는지 (⚠️ 허용 범위는 제품 스펙마다 다름) |

**꼬리 질문**
- **Q.** Slack이 음수로 나오면 어떻게 해결하는지
  - **A.** Setup → 데이터 경로 단축 (pipelining 등), hold → data 경로에 delay 삽입 → 자세한 내용은 Q1-3
- **Q.** Margin을 크게 잡을수록 좋은지
  - **A.** 아님 → trade-off
    - 큰 margin = 같은 스펙에서 더 큰 셀 · 더 많은 버퍼 · 더 깊은 파이프라인 → 면적 · 전력 · latency 증가, 달성 가능한 주파수 하락
    - 작은 margin = 수율 저하, 특정 조건에서 오동작 위험

**헷갈리기 쉬운 점**
- Margin ≈ slack (타이밍 맥락) → "0 이상이면 통과, 클수록 여유"
- Setup은 slow corner, hold는 fast corner가 worst (⚠️ temperature inversion 예외)
- 면접관이 "margin"이라고만 하면 timing인지 noise인지 맥락 확인 후 답변

<sub>근거 : Weste & Harris, *CMOS VLSI Design* Ch.7 (PVT variation) · Ch.10 (setup · hold, clock skew · jitter) · Rabaey et al., *Digital Integrated Circuits* (noise margin 정의) · Xilinx UG906 (WNS/TNS/WHS/THS) · UG903 (set_clock_uncertainty) · 출처 : 과거 면접 경험, 2026-10-09</sub>

---

### Q1-3. Timing margin(slack)이 부족할 때 해결 방법

> **한 줄 답** : 먼저 **제약이 맞는지 · 지연이 로직 쪽인지 배선 쪽인지** 분석 → setup은 데이터 경로 단축(pipelining, 로직 재구성, fanout 감소, 배치 개선), hold는 data 경로에 delay 삽입 · skew 감소

**면접 답변**
- 1단계 분석 : 위반 경로의 제약이 올바른지 확인, 지연이 logic delay와 route delay 중 어디에 몰렸는지 확인
- Setup 위반
  - Logic delay가 크면 : 조합 논리 단수 줄이기, pipelining, retiming
  - Route delay가 크면 : fanout 줄이기(register duplication), 배치 개선(floorplan), 혼잡도 완화
  - 최후 수단 : 클럭 주파수 낮추기
- Hold 위반 : data 경로에 delay 삽입 (툴 자동 처리가 일반적), clock skew 줄이기 → 주파수와 무관

**설명**

- **1단계 : 위반 원인 분석 (고치기 전에)**
  - 제약 확인 : 실제로는 비동기인 클럭 간 경로를 동기로 분석하고 있지 않은지 (Q2-1), 클럭 주기 · I/O delay 값이 맞는지 → 제약 오류면 가짜 위반
  - 지연 구성 확인 : Vivado timing report의 `Data Path Delay` = logic 지연 + route 지연 (각 비율 표시) → 어느 쪽이 큰지에 따라 대책이 다름
  - Logic levels(경로 위 LUT · 셀 개수) 확인 → 많으면 RTL 구조 문제

- **Setup 위반 대책**

  | 단계 | 방법 | 내용 · 대가 |
  |---|---|---|
  | RTL | Pipelining | 긴 조합 논리 중간에 FF 추가 → 경로 단축, 대신 latency 증가 |
  | RTL | 로직 재구성 | 직렬 구조 → 병렬 구조 (예 : `a+b+c+d` → `(a+b)+(c+d)`, 긴 priority if-else → 병렬 case), 넓은 연산을 여러 cycle로 분할 |
  | RTL | 모듈 경계 레지스터 | 모듈 입력 · 출력을 FF로 끊어서 모듈 간 긴 조합 경로 방지 |
  | RTL | Fanout 감소 | 한 신호가 너무 많은 곳을 구동하면 배선 지연 증가 → register duplication (Vivado `MAX_FANOUT` 속성) |
  | RTL | 전용 자원 활용 | FPGA DSP · Block RAM의 내부 파이프라인 레지스터 사용 |
  | 합성 · 구현 | Retiming | 툴이 FF 위치를 조합 논리 사이로 옮겨 경로 길이 균형 |
  | 합성 · 구현 | 구현 전략 · 물리 최적화 | ⚠️ Vivado : implementation strategy 변경, `phys_opt_design`, Pblock floorplan |
  | 합성 · 구현 | 셀 교체 (ASIC) | Gate sizing(큰 셀), Vt swap(LVT = 빠르지만 누설 전류 증가) |
  | 제약 | Multicycle path | 결과가 실제로 N cycle마다만 필요한 경로(enable 사용)에만 `set_multicycle_path` → 기능적으로 사실일 때만 사용 |
  | 최후 | 주파수 낮추기 | 스펙 변경이므로 마지막 수단 |

- **Hold 위반 대책**
  - Data 경로에 delay(buffer · delay cell) 삽입 → Vivado는 route 단계에서 자동 hold fixing
  - Clock skew 줄이기 → 전용 global clock 배선(BUFG) 사용, 로직 분주 클럭 대신 tick(clock enable)
  - ⚠️ ASIC : hold 경로에 HVT(느린 셀) 사용
  - 주파수를 낮춰도 해결 안 됨 (Q1-1 꼬리 질문)

- **Setup · hold 동시 고려**
  - Hold 고치려고 delay 넣으면 같은 경로의 setup slack 감소 → 두 slack을 같이 확인
  - 두 조건 사이에 여유가 전혀 없으면(경로 지연 편차가 너무 큼) 구조 자체를 바꿔야 함

**꼬리 질문**
- **Q.** Pipelining의 단점은
  - **A.** Latency 증가(결과가 몇 cycle 늦게 나옴), FF 증가로 면적 · 전력 증가, 피드백 루프가 있는 경로(누산기, FSM 다음 상태)는 단순히 단을 나눌 수 없음
- **Q.** Route delay가 logic delay보다 훨씬 크게 나오면 무엇을 의심하는지
  - **A.** High fanout 신호, 멀리 떨어진 배치, 혼잡(congestion), 높은 자원 사용률 → fanout 감소, floorplan, 로직 정리
- **Q.** Multicycle path를 걸면 안 되는 경우는
  - **A.** 그 경로의 결과가 실제로 매 cycle 사용되는 경우 → 제약만 완화되고 실제 칩은 오동작 (STA는 제약을 믿기 때문에 잡아내지 못함)

**헷갈리기 쉬운 점**
- 바로 고치기 전에 **제약 오류 여부**부터 확인 (가짜 위반 가능)
- Logic delay 문제 → RTL 구조, route delay 문제 → fanout · 배치 (대책이 다름)
- Multicycle · false path는 **설계를 고치는 게 아닌 STA에게 알려 주는 것** → 사실이 아니면 숨겨진 버그가 됨
- Hold fix delay는 setup slack을 깎음

<sub>근거 : Weste & Harris, *CMOS VLSI Design* Ch.10 (sequencing, pipelining, retiming 개념) · Xilinx UG906 (timing report, 경로 분석 · closure 기법) · UG903 (multicycle · false path 제약) · UG949 UltraFast Design Methodology (timing closure) · 출처 : 개인 질문, 2026-10-09</sub>

---

## 2. CDC · 동기화

### Q2-1. CDC(Clock Domain Crossing) 문제는 언제 발생하는지 (같은 클럭 / 다른 클럭 구분)

> **한 줄 답** : 송신 FF와 수신 FF 클럭 사이 **위상 관계가 고정되지 않았거나 STA로 검증 불가**할 때 발생 → 기준은 "같은 클럭인지"가 아닌 "위상 관계가 고정 · 검증 가능한지"

**면접 답변**
- CDC = 위상 관계가 고정되지 않은 클럭 사이로 신호가 넘어가는 경우
- 주파수가 같아도 소스(오실레이터)가 다르면 비동기 → CDC
- 같은 클럭이라도 로직으로 만든 분주 클럭, 버튼 같은 비동기 입력은 같은 문제 발생 → tick(clock enable)과 synchronizer로 처리
- 대표 문제 : metastability, multi-bit 불일치, pulse 유실 → 2-FF synchronizer, Gray code · async FIFO · handshake로 대응

**설명**

- **같은 클럭 (동기) — 원칙적으로 CDC 아님**

  | 경우 | CDC 여부 | 이유 |
  |---|---|---|
  | 같은 소스, 같은 clock tree | 아님 | 일반 동기 경로 → STA가 setup/hold 검증 |
  | 같은 클럭 반전 사용 (negedge FF) | 아님 | Half-cycle 경로 → STA 검증 가능, 가용 시간 절반 |
  | 같은 PLL/MMCM의 분주 · 체배 클럭 | ⚠️ 엄밀히 아님 | 위상 관계 고정 → STA 검증 가능, 단 비정수배(예 : 100 MHz ↔ 150 MHz)면 요구 시간이 매우 짧아질 수 있음 |

- **같은 클럭인데 문제가 되는 함정**
  - 로직 분주 클럭 (카운터 출력을 clock으로 사용)
    - 전용 clock 배선이 아닌 일반 배선 경유 → 원 클럭과 skew가 크고 예측 어려움 → 도메인 간 경로 hold 위반 위험
    - 실무 : 클럭은 하나만, 동작 주기는 **tick(clock enable)**으로 분할
  - 비동기 입력 (버튼, 외부 신호, 비동기 reset 해제)
    - 소속 클럭 도메인 없음 → 수신 쪽에서는 CDC와 동일한 문제
    - 대책 : 2-FF synchronizer, reset synchronizer

- **다른 클럭 (비동기) — CDC 발생**
  - 비동기 판단 기준
    - 서로 다른 오실레이터 → **주파수가 같아도** 비동기 (100 MHz 크리스털 2개 → 위상이 계속 어긋남)
    - 클럭 간 위상 관계를 모르거나 계속 변하는 경우
  - 문제와 대책 (자세한 해결 방법은 Q2-2)

    | 문제 | 상황 | 대책 |
    |---|---|---|
    | **Metastability** | 데이터가 수신 FF의 setup/hold window 안에서 변화, STA로 보장 불가 | 2-FF(또는 3-FF) synchronizer, 실패 확률은 MTBF로 관리 |
    | **Multi-bit 불일치** | 비트별로 따로 동기화 → 비트마다 다른 cycle에 잡혀 존재하지 않는 값 발생 | Gray code(1비트씩만 변화), handshake, async FIFO |
    | **Pulse 유실** | 빠른 클럭의 1-cycle 펄스를 느린 클럭이 놓침 | Toggle synchronizer, 펄스 확장, handshake |
    | **Reconvergence** | 따로 동기화한 신호를 다시 조합 → cycle 정렬 어긋남 | 한 비트만 동기화, 나머지는 그 신호로 제어 |
    | **Glitch** | 송신 쪽 조합 논리 출력을 그대로 전달 → glitch까지 캡처 | 송신 도메인에서 **FF로 래치 후** 전달 |

- **툴 관점** ⚠️ Vivado 기준, 툴마다 다름
  - 기본적으로 클럭 간 경로를 **관련 클럭으로 간주하고 타이밍 분석**
  - 실제 비동기 클럭이면 `set_clock_groups -asynchronous` 또는 `set_max_delay -datapath_only` 등 제약을 설계자가 직접 지정
  - `report_cdc`로 CDC 구조 안전성 확인

**꼬리 질문**
- **Q.** 주파수가 같은 두 클럭이면 CDC 처리가 필요 없는지
  - **A.** 소스가 다르면 필요
    - 오실레이터마다 미세한 주파수 오차 · 위상 차 존재 → 위상 관계가 계속 변함 → 비동기와 동일하게 처리
- **Q.** Multi-bit 카운터 값을 다른 클럭 도메인으로 넘길 때 각 비트에 2-FF synchronizer를 달면 되는지
  - **A.** 안 됨
    - 비트마다 metastability 해소 시점이 달라 서로 다른 cycle 값이 섞임 → 존재하지 않는 값 수신
    - 카운터는 Gray code로 변환 후 동기화 (async FIFO 포인터 방식), 일반 데이터는 handshake 또는 async FIFO
- **Q.** 같은 클럭이라도 배선이 길면 도착 지연으로 phase 차이가 생기는데, 왜 CDC가 아닌지
  - **A.** Phase 차이는 생기지만 **고정된 값** → clock skew로 STA가 계산 가능
    - 배선 지연 = 매 cycle 같은 값 (공정 · 전압 · 온도 범위 안에서 상한 · 하한이 정해짐) → setup / hold 식의 t_skew 항으로 반영 (Q1-1 꼬리 질문의 식)
    - 매 cycle 미세하게 흔들리는 jitter도 범위가 정해진 값 → STA에서 clock uncertainty로 반영
    - CDC = 두 클럭의 위상 차가 **cycle마다 변해서** 어떤 값이 될지 모름 → 식에 넣을 t_skew 자체가 없음 → STA로 보장 불가
    - Skew 최소화 : ASIC = CTS(Clock Tree Synthesis), FPGA = 전용 global clock 배선(BUFG) → 로직 분주 클럭이 위험한 이유 = 이 전용 배선을 못 타서 skew가 커짐

**헷갈리기 쉬운 점**
- Skew(**고정된** 위상 차, STA로 계산) ≠ CDC(**변하는** 위상 차, STA로 보장 불가)
- 같은 주파수 ≠ 같은 클럭 → 소스가 다르면 비동기
- 로직 분주 클럭은 "같은 클럭에서 나왔다"고 안전한 것이 아님 → tick 사용 이유
- 2-FF synchronizer는 **1비트** 신호용 → multi-bit에 그대로 쓰면 안 됨
- ⚠️ Vivado는 비동기 클럭을 자동으로 구분하지 않음 → 제약 누락 시 의미 없는 타이밍 위반이 보고되거나 실제 CDC 문제가 묻힘

<sub>근거 : Weste & Harris, *CMOS VLSI Design* Ch.10 (synchronizer, metastability, MTBF) · Xilinx UG903 (clock groups 제약) · UG906 (report_cdc) · 출처 : 개인 질문, 2026-10-09</sub>

---

### Q2-2. CDC 문제 해결 방법

> **한 줄 답** : 넘기는 **신호 종류에 맞는 동기화 구조** 선택 → 1비트 레벨 = 2-FF synchronizer, 1비트 펄스 = toggle(pulse) synchronizer, multi-bit = handshake · Gray code · async FIFO, 그리고 **CDC 제약과 검증**까지 함께

**면접 답변**
- 1비트 레벨 신호 : 수신 도메인에 FF 2개를 직렬로 둔 2-FF synchronizer → 첫 FF의 metastability가 한 cycle 동안 해소될 시간 확보
- 1비트 펄스 : 송신 쪽에서 펄스를 toggle 신호로 바꾸고 2-FF로 동기화한 뒤 edge 검출로 펄스 복원
- Multi-bit
  - 데이터를 송신 쪽에서 고정해 두고 제어 신호만 동기화하는 handshake
  - 카운터처럼 1씩 변하는 값은 Gray code 변환 후 동기화
  - 연속 데이터 스트림은 async FIFO
- 송신 신호는 반드시 FF 출력으로 넘기기, 비동기 클럭 그룹 제약 설정, CDC 리포트 · lint로 검증

**설명**

- **신호 종류별 선택**

  | 넘기는 신호 | 방법 | 핵심 조건 |
  |---|---|---|
  | 1비트 레벨 (enable, 상태 플래그) | 2-FF synchronizer | 수신 클럭이 잡을 만큼 오래 유지 |
  | 1비트 펄스 (이벤트, start) | Toggle(pulse) synchronizer | 펄스 간 간격이 충분히 떨어져 있어야 함 |
  | Multi-bit, 가끔 전달 (설정값, 명령) | Handshake (req / ack), MUX recirculation | 전달 중 데이터 고정 |
  | Multi-bit 카운터 (1씩 증가 · 감소) | Gray code + 비트별 2-FF | 수신 샘플 사이에 한 단계 이하로만 변화 |
  | Multi-bit 연속 데이터 스트림 | Async FIFO | 포인터를 Gray code로 동기화 |
  | Reset | Reset synchronizer (비동기 assert, 동기 release) | Release 시점만 동기화 |

- **2-FF synchronizer**

  ```
  송신 도메인           |  수신 도메인 (clk_b)
  [FF] ── d ──────────→ [FF1] → [FF2] → 사용
  (FF 출력으로 전달)      ↑ metastable 가능   ↑ 한 cycle 동안 해소 후 안정
  ```

  - 첫 FF는 metastable이 될 수 있음 → 두 번째 FF까지 한 cycle 해소 시간 → 실패 확률이 지수적으로 감소
  - MTBF = e^(t_r / τ) / (T_0 · f_clk · f_data) → t_r(해소 시간)이 늘면 지수적으로 증가 → 고속 클럭에서는 3-FF
  - Metastability를 **없애는** 것이 아닌 **실패 확률을 충분히 낮추는** 것
  - 송신 쪽 조합 논리 출력을 그대로 넘기면 glitch까지 캡처 → 송신 도메인 FF 출력만 전달
  - ⚠️ Vivado : 동기화 FF에 `ASYNC_REG` 속성 → 두 FF를 가깝게 배치해 해소 시간 확보, 또는 XPM 매크로 `xpm_cdc_single`
  - ⚠️ 신호 유지 시간 : 경험칙으로 수신 클럭 주기의 약 1.5배 이상 (Cummings) → 빠른 → 느린 도메인이면 펄스 확장 또는 handshake 필요

- **Toggle(pulse) synchronizer**
  - 송신 : 펄스마다 toggle FF 반전 → 레벨 신호로 변환 (펄스가 짧아도 값이 유지됨)
  - 수신 : 2-FF 동기화 → 마지막 두 단 XOR → 한 cycle 펄스 복원
  - 제약 : 다음 펄스가 너무 빨리 오면 toggle이 두 번 바뀌어 펄스 유실 → 간격 보장 필요, 안 되면 handshake

- **Handshake (req / ack)**
  1. 송신 : 데이터를 레지스터에 고정, req 올림
  2. 수신 : req를 2-FF로 동기화 → 데이터 캡처 (데이터 버스 자체는 동기화하지 않음, 이미 고정돼 있어서 안전)
  3. 수신 : ack 올림 → 송신 쪽에서 2-FF로 동기화 → 다음 전송 가능
  - 장점 : 어떤 폭의 데이터든 안전 / 단점 : 전송마다 여러 cycle 지연 → 고속 연속 전송에는 부적합
  - MUX recirculation : 같은 원리 → 동기화된 enable일 때만 수신 레지스터가 데이터 로드

- **Gray code**
  - 인접 값 사이에 1비트만 변화 → 동기화 중 그 비트가 늦게 잡혀도 결과는 이전 값 또는 새 값 중 하나 → 존재하지 않는 값 없음
  - Binary 카운터는 여러 비트가 동시에 변함 (예 : 0111 → 1000) → 비트별 동기화 시 엉뚱한 값 가능
  - 조건 : 수신 샘플 사이에 값이 한 단계 이하로만 변해야 함

- **Async FIFO**
  - 구성 : dual-port 메모리 + 쓰기 도메인의 write pointer + 읽기 도메인의 read pointer
  - 포인터를 Gray code로 변환 → 상대 도메인으로 2-FF 동기화 → full(쓰기 쪽) · empty(읽기 쪽) 판단
  - 포인터에 MSB 1비트 추가 → 주소가 같을 때 full과 empty 구분
  - 동기화된 포인터는 몇 cycle 늦은 값 → full · empty가 보수적으로(조금 늦게 해제) 나옴 → overflow · underflow 없음
  - ⚠️ Vivado : `xpm_fifo_async` 또는 FIFO Generator IP 사용 권장

- **제약 · 검증** ⚠️ Vivado 기준
  - 비동기 클럭 : `set_clock_groups -asynchronous` 또는 경로별 `set_false_path`
  - Gray code 버스 · async FIFO 포인터 : false path 대신 `set_max_delay -datapath_only` → 비트 간 지연 차이를 수신 한 주기 이내로 묶어 Gray code 조건 유지
  - `report_cdc`로 동기화 구조 누락 확인, 상용 CDC lint 툴로 구조 검사

**꼬리 질문**
- **Q.** 왜 FF 1개가 아닌 2개인지
  - **A.** 첫 FF가 metastable이 되면 그 출력을 바로 쓰는 로직이 서로 다른 값으로 해석 가능 → 두 번째 FF까지 한 cycle의 해소 시간을 줘서 MTBF를 지수적으로 늘림
- **Q.** 2-FF synchronizer를 쓰면 metastability가 완전히 사라지는지
  - **A.** 아님 → 실패 확률을 MTBF 기준으로 충분히 낮출 뿐 → 고속이거나 요구 신뢰도가 높으면 단 수를 늘림
- **Q.** Async FIFO 포인터를 binary로 동기화하면 어떤 문제가 생기는지
  - **A.** 여러 비트가 동시에 바뀌는 순간 비트별로 다른 시점에 잡혀 존재하지 않는 포인터 값 수신 → 잘못된 full · empty 판단 → overflow · underflow
- **Q.** Gray code 버스에 false path 대신 max delay를 거는 이유
  - **A.** False path면 툴이 비트별 지연을 전혀 제한하지 않음 → 비트 간 도착 차이가 커지면 한 번에 1비트만 바뀐다는 Gray code 전제가 깨짐 → max delay로 지연 차이를 묶음

**헷갈리기 쉬운 점**
- 2-FF synchronizer = **1비트 레벨** 신호 전용 → 펄스 · multi-bit에 그대로 쓰면 유실 · 값 깨짐
- Handshake에서 동기화하는 것은 **req · ack 제어 신호**, 데이터 버스는 고정만 해 둠
- Gray code는 **1씩 변하는 값**에만 유효 → 임의 데이터에는 handshake · FIFO
- 송신 쪽은 반드시 **FF 출력**으로 넘김 (조합 논리 출력 금지)

<sub>근거 : Weste & Harris, *CMOS VLSI Design* Ch.10 (synchronizer, metastability, MTBF) · C. Cummings, "Clock Domain Crossing (CDC) Design & Verification Techniques Using SystemVerilog", SNUG 2008 · C. Cummings, "Simulation and Synthesis Techniques for Asynchronous FIFO Design", SNUG 2002 · Xilinx UG903 (CDC 제약) · UG906 (report_cdc) · UG974 (XPM CDC · FIFO 매크로) · 출처 : 개인 질문, 2026-10-09</sub>

---

## 3. 검증 (Verification)

### Q3-1. 프로젝트 품질 평가 지표 5가지의 의미와 하드웨어 설계 · 검증에서의 대응 개념

> **한 줄 답** : 소프트웨어 품질 지표(테스트 커버리지 · 성능 · 정적 분석 · 예외 처리 · 부하 안정성)는 하드웨어에서 각각 **coverage · PPA(타이밍) · lint/CDC/STA · corner case 검증 · stress 검증**에 대응 → 내 프로젝트를 이 5개 축으로 설명 가능해야 함

**면접 답변**
- 커버리지 : 모듈 단위 TB와 top 통합 TB로 나눠 검증, code coverage와 functional coverage로 "얼마나 검증했는지" 수치화
- 성능 · 병목 : 목표(동작 주파수, throughput, latency)를 먼저 정하고, critical path나 가장 느린 단계를 병목으로 찾아 개선 전후 수치 비교
- 정적 분석 : 시뮬레이션 없이 코드 · 넷리스트를 검사하는 lint, CDC 검사, STA로 latch 추론 · 비트 폭 불일치 · 비동기 경로 누락 같은 구조적 결함 조기 발견
- 예외 · 엣지 케이스 : 경계값(카운터 최댓값 → 0), 동작 중 reset, 잘못된 입력(glitch, 프로토콜 위반)을 시나리오로 정의해 검증
- 부하 안정성 : 최대 속도 연속 입력, 장시간 random 테스트로 FIFO full · 데이터 유실 · 상태 고착이 없는지 확인

**설명**

| # | 지표 | 소프트웨어 의미 | 하드웨어 대응 |
|---|---|---|---|
| 1 | 단위 · 통합 테스트 커버리지 | 함수 단위(unit) · 모듈 결합(integration) 테스트가 코드를 얼마나 실행했는지 | Block-level TB · top-level TB, code coverage · functional coverage |
| 2 | 목표 성능 · 병목 개선도 | 응답 시간 · 처리량 목표 달성 여부, 가장 느린 구간(bottleneck)을 찾아 개선한 정도 | Fmax · WNS(critical path), throughput · latency, PPA(Power · Performance · Area) |
| 3 | 정적 분석 보안 취약점 검사 | 실행하지 않고 소스 코드를 분석해 취약점 탐지 (버퍼 오버플로, 입력 검증 누락 등) | Lint, CDC 검사, STA, DRC (`report_methodology`, `report_cdc`) |
| 4 | 예외 처리 · 엣지 케이스 시나리오 | 잘못된 입력 · 오류 상황 처리, 경계값(0, 최댓값, 빈 입력) 대응 | Corner case 검증, illegal state 복구(FSM default), 오류 검출(framing error 등) |
| 5 | 대규모 트래픽 부하 테스트 안정성 | 최대 부하(load) · 한계 초과(stress) · 장시간(soak)에서도 장애 · 성능 저하 없음 | 최대 rate 연속 입력(back-to-back), 장시간 random regression, 보드 장시간 동작 |

- **1. 커버리지**
  - Unit(단위) = 모듈 하나를 떼어 검증, integration(통합) = 모듈을 연결했을 때 인터페이스 · 상호작용 검증
  - Code coverage 종류 : line(statement), branch, condition, toggle, FSM state · transition
  - Functional coverage : 스펙의 기능 · 조건 조합을 bin으로 정의해 실제로 발생했는지 측정 (SystemVerilog `covergroup`, IEEE 1800)
  - Code coverage 100% ≠ 버그 없음 → 실행만 했고 결과를 확인하지 않았을 수 있음, 스펙 기능 누락은 code coverage로 안 보임 → self-checking(scoreboard) + functional coverage 병행

- **2. 성능 · 병목**
  - 병목(bottleneck) = 전체 성능을 제한하는 가장 느린 단계 → 다른 곳을 개선해도 전체 성능 변화 없음
  - 소프트웨어 : profiling으로 시간 소모 구간 측정 / 하드웨어 : timing report로 critical path, 파이프라인에서 가장 느린 단계
  - 개선도 = 개선 전후 같은 조건에서 측정한 수치 비교 (예 : WNS, 동작 주파수, cycle 수)
  - 타이밍 개선 방법 → Q1-3

- **3. 정적 분석 (static analysis)**
  - 정의 : 코드를 **실행하지 않고** 구조 · 패턴을 검사 ↔ 동적 분석(dynamic) = 실행(시뮬레이션)하며 검사
  - 소프트웨어 : 보안 취약점, 코딩 규칙 위반 탐지
  - 하드웨어
    - Lint : latch 추론, 비트 폭 불일치, multiple driver, 불완전한 sensitivity list
    - CDC 검사 : 동기화기 없는 클럭 도메인 간 경로 (Q2-2)
    - STA : 모든 경로의 타이밍을 입력 벡터 없이 검사 → 정적 분석의 대표 예
  - 장점 : 테스트 벡터 없이 전체 코드를 빠르게 검사 / 한계 : 기능(동작 결과)이 맞는지는 판단 못 함 → 시뮬레이션과 병행

- **4. 예외 처리 · 엣지 케이스**
  - 엣지 케이스(edge case) = 경계값 · 극단 조건, 예외 = 정상 범위를 벗어난 입력 · 상황
  - 하드웨어 예
    - 경계값 : 카운터 9999 → 0, 0에서 DOWN, 데이터 0x00 · 0xFF
    - 동작 중 reset, 스위치 동시 입력(우선순위)
    - 비정상 입력 : glitch로 인한 false start, stop bit 오류(framing error)
    - Illegal state : 정의되지 않은 FSM 상태 → default로 안전한 상태 복귀
  - 시나리오화 = 각 경우의 입력 · 기대 동작을 검증 계획서(verification plan)에 먼저 정의

- **5. 부하 · 안정성**
  - Load test = 예상 최대 부하 / stress test = 한계 초과 / soak test = 장시간 지속
  - 안정성 판단 : 오류 · 데이터 유실 없음, 응답 시간이 한계 안에 유지, 자원 누수 없음
  - 하드웨어 예
    - 최대 rate 연속 프레임(back-to-back) → FIFO full, 데이터 유실 여부
    - 송신 쪽이 수신 처리 속도보다 빠를 때 → flow control · backpressure 필요성
    - 장시간 random 입력 regression, 보드 장시간 동작

**꼬리 질문**
- **Q.** Code coverage가 100%면 검증이 끝난 것인지
  - **A.** 아님 → 코드가 실행됐다는 뜻일 뿐, 결과 비교(self-checking)가 없으면 오동작을 놓침, 스펙에 있는데 구현이 빠진 기능은 code coverage로 보이지 않음 → functional coverage와 함께 sign-off
- **Q.** 정적 분석과 시뮬레이션의 차이
  - **A.** 정적 분석 = 실행 없이 구조 검사, 입력 벡터 불필요, 전체 경로 검사 / 시뮬레이션 = 입력을 넣어 동작 결과 확인, 넣은 시나리오만 검증 → 서로 못 잡는 영역이 달라 병행
- **Q.** 엣지 케이스를 어떻게 빠짐없이 찾는지
  - **A.** 스펙에서 입력 공간의 축(값 범위, 타이밍 위상, 연속성, 비정상 입력)을 먼저 나누고 각 축의 경계값을 bin으로 정의 → functional coverage로 누락 확인

**헷갈리기 쉬운 점**
- 하드웨어에서 "정적 분석"의 대표 예 = **STA**(Static Timing Analysis) → 이름 그대로 정적
- Code coverage(코드가 실행됐는지) ≠ functional coverage(스펙 기능이 발생했는지)
- 성능 개선도는 **같은 조건에서 전후 수치**로 말해야 설득력 있음

<sub>근거 : IEEE 1800 (SystemVerilog covergroup · functional coverage) · Xilinx UG906 (report_methodology · report_cdc · timing report) · 출처 : 개인 질문(이미지 속 품질 지표 목록), 2026-10-25</sub>

---

## 4. 통신 인터페이스 (UART · SPI · I2C)

### Q4-1. UART는 데이터를 어떤 순서로 보내는지 (LSB first 여부와 프레임 구조)

> **한 줄 답** : UART는 **LSB first** → idle(1) → start bit(0) → data bit 0(LSB) … 7(MSB) → (parity) → stop bit(1)

**면접 답변**
- UART 비동기 직렬 통신은 데이터를 LSB부터 전송
- 프레임 : idle 상태 High → start bit 0으로 프레임 시작 알림 → 데이터 5~9비트 LSB부터 → 선택적 parity → stop bit 1 이상 High
- 클럭선이 없어서 송수신이 baud rate를 미리 맞추고, 수신기는 start bit의 falling edge를 기준으로 각 비트 중앙에서 샘플링
- RTL에서는 송신 = shift register를 오른쪽으로 밀며 bit 0 출력, 수신 = 받은 비트를 MSB 쪽에 넣고 오른쪽으로 밀기 → 8비트 뒤 첫 비트가 bit 0에 위치

**설명**

- **프레임 구조 (8N1 예 : 데이터 8비트, parity 없음, stop 1비트)**

  ```
  idle | start | D0  D1  D2  D3  D4  D5  D6  D7 | stop | idle
   1   |   0   | LSB ─────────────────────→ MSB |  1   |  1
  ```

  - 예 : 0x41('A') = 0100_0001 → 선로에는 1,0,0,0,0,0,1,0 순서로 전송
  - 설정 표기 : 8N1 = 데이터 8비트 · parity 없음(None) · stop 1비트

- **RTL 구현과의 연결**
  - 송신 : `tx <= shreg[0]; shreg <= shreg >> 1;` → bit 0부터 출력
  - 수신 : `rx_data <= {rx, rx_data[7:1]};` → 먼저 온 LSB가 8번 밀린 뒤 bit 0에 도착
  - 순서를 반대로 구현하면 송수신 결과가 비트 반전(bit-reversed)된 값 → loopback에서는 송수신 둘 다 같은 실수면 통과해 버리므로 PC 터미널 등 외부 장치와의 통신으로 확인 필요

- **다른 프로토콜과 비교**

  | 프로토콜 | 비트 순서 | 비고 |
  |---|---|---|
  | UART | LSB first | 비동기, 클럭선 없음 |
  | I2C | MSB first | 동기, SCL 클럭 |
  | SPI | 보통 MSB first | ⚠️ 장치마다 설정 가능 (LSB first 모드 있는 컨트롤러도 존재) → 데이터시트 확인 |

- **RS-232와의 구분**
  - RS-232(TIA-232) = 전압 레벨 · 커넥터 등 **전기적 규격** (논리 1 = 음전압)
  - Start · data · stop 프레임과 LSB first = **UART 비동기 직렬 프레임 관례**
  - FPGA 보드의 USB-UART 칩은 전압만 다를 뿐 같은 프레임 사용

**꼬리 질문**
- **Q.** UART가 클럭선 없이 동기를 맞추는 방법
  - **A.** 송수신이 같은 baud rate를 미리 약속 → 수신기가 start bit의 falling edge를 감지해 매 프레임 타이밍 재정렬 → 보통 baud의 16배 oversampling으로 각 비트 중앙에서 샘플링 → 프레임마다 재동기화하므로 오차가 한 프레임 안에서만 누적
- **Q.** Stop bit가 필요한 이유
  - **A.** 프레임 끝에 선로를 반드시 High로 되돌려야 다음 start bit의 falling edge(1 → 0)를 감지 가능, 수신기가 데이터를 처리할 최소 시간 확보, stop 위치에서 0이 읽히면 framing error로 검출
- **Q.** 왜 LSB first인지
  - **A.** ⚠️ 표준이 이유를 명시하진 않음 → 흔히 드는 설명 : 초기 텔레타이프 · 직렬 장치의 shift register 구현 관례, 데이터 길이(5~8비트)가 달라도 LSB 위치가 start bit 바로 뒤로 고정 → 면접에서는 "관례"로 답하고 단정 금지

**헷갈리기 쉬운 점**
- UART = LSB first, I2C = MSB first, SPI = 보통 MSB first(설정 가능)
- 파형에서 왼쪽(먼저 온 비트)이 LSB → 16진수로 읽을 때 순서를 뒤집어야 함
- Loopback 테스트만으로는 비트 순서 오류를 못 잡을 수 있음 (송수신이 같은 방향으로 틀리면 통과)

<sub>근거 : TI PC16550D UART datasheet (serial frame, LSB first) · NXP UM10204 I2C-bus specification (MSB first) · 출처 : 개인 질문 (UART loopback 프로젝트), 2026-10-29</sub>

---

## 5. SystemVerilog OOP (class · handle · 메모리)

### Q5-1. Class handle이란 무엇이고, 선언과 `new()`는 각각 무엇을 하는지

> **한 줄 답** : Handle = 객체를 **참조(reference)하는 값** → 선언 시 handle 칸만 생기고 값은 null, `new()` 시 heap에 객체가 생기고 그 위치가 handle에 저장

**면접 답변**
- `transaction tr;` = handle 변수만 생성, 초기값 null, 객체는 아직 없음
- `tr = new();` = heap에 객체 공간 할당 → 멤버를 기본값으로 초기화 → constructor 실행 → 객체 참조를 tr에 대입
- Handle은 개념상 포인터지만 C 포인터와 달리 type-safe → 주소값 확인 · 정수 변환 · 포인터 산술 불가
- 어떤 handle도 객체를 참조하지 않으면 시뮬레이터가 자동으로 메모리 해제(garbage collection), `delete` 없음

**설명**

- **선언 · 생성 · 값 저장 단계**

  | 시점 | handle(tr) | 객체 |
  |---|---|---|
  | `transaction tr;` | null | 없음 |
  | `tr = new();` | 객체 시작 위치를 참조 | heap에 생성, 멤버 기본값 (`bit` = 0, `logic` = X) |
  | `tr.randomize();` / `tr.a = 5;` | 그대로 | 멤버 위치에 실제 값 저장 |

- **어디에 무엇이 저장되는지**

  ```
          가상 주소(예시)     저장된 내용
   tr  →  0x1000           0x5000              ← handle 칸 : 객체 위치(참조)
          ...
          0x5000           (헤더 : 타입 정보 등) ┐
          0x5008           5      ← a 값          ├ 객체 (heap) : 멤버의 실제 값
          0x5009           3      ← b 값          ┘
  ```

  - Handle 칸 = 참조(위치), 객체 = 멤버 변수의 실제 값 + 숨은 헤더
  - 객체 안 멤버가 값 타입(bit, int …)이면 값, handle 타입이면 참조가 저장
  - `tr.a` 접근 = tr의 참조값 읽기 → 객체 시작 + a의 offset 위치로 이동 → 값 읽기
  - ⚠️ Handle 내부 표현(실제 주소인지, 내부 테이블 인덱스인지)은 IEEE 1800이 정의하지 않음 → 시뮬레이터 구현, 비공개
  - `$display("%p", h)`, UVM `get_inst_id()` 출력 = 툴이 붙인 번호 · 객체 내용 (주소 아님, ⚠️ 형식은 툴마다 다름)

- **주소를 숨기는 이유**
  - 안전성 : 잘못된 주소 계산, 해제된 메모리 접근 같은 포인터 버그 원천 차단
  - 자동 메모리 관리 : 사용자가 주소를 쥐고 있으면 GC가 안전하게 해제 · 관리 불가
  - Java reference와 같은 설계

- **비유** : 객체 = 집(안에 데이터), handle = 집 주소가 적힌 쪽지, 쪽지가 한 장도 안 남으면 철거(GC) 대상

**꼬리 질문**
- **Q.** `new()` 없이 `tr.a = 3;`을 실행하면
  - **A.** tr이 null → 실행 중 null object access 오류
- **Q.** `p2 = p1;` 후 `p2.data = 10;`이면 `p1.data`는
  - **A.** 10 → handle 값만 복사돼 p1 · p2가 같은 객체를 가리킴
- **Q.** SV에서 객체 메모리는 누가 해제하는지
  - **A.** 시뮬레이터의 garbage collection → 그 객체를 참조하는 handle이 하나도 없을 때 해제 대상

**헷갈리기 쉬운 점**
- 용어 = **handle** (handler는 event handler 등 다른 개념)
- 선언 순간에는 주소 할당 없음 → **`new()` 순간** 객체 생성 · 참조 저장
- Handle에 저장되는 것 = 객체 위치(참조), 객체에 저장되는 것 = 데이터 값

<sub>근거 : IEEE 1800-2017 Ch.8 Classes (object handle, constructor, null, 자동 메모리 관리) · 출처 : 수업 중 의문, 2026-11-03</sub>

---

### Q5-2. 객체 · class 선언 · 변수는 메모리의 어디에 저장되는지

> **한 줄 답** : class 선언(method 코드 · 구조 정보 · static 멤버)은 프로그램 영역에 **한 벌**, 객체는 `new()` 때마다 **heap**에, 함수 지역 변수는 **stack**에 저장

**면접 답변**
- 시뮬레이터도 하나의 프로그램 → OS가 준 가상 주소 공간을 code · data · heap · stack으로 나눠 사용
- Class 선언 = 설계도 → method 코드는 code 영역, 객체 크기 · 멤버 offset 같은 구조 정보와 static 멤버는 data 영역에 class당 한 벌
- 객체 = `new()` 할 때마다 heap에 생성, 실행 중 개수 · 수명을 미리 알 수 없어서 heap 사용
- 객체 크기는 class 선언으로 정해짐 → non-static 멤버 합 + 헤더 · 정렬 · 할당기 오버헤드

**설명**

- **프로세스 메모리 구역**

  ```
  ┌──────────────┐
  │ Code         │ 실행할 명령어 (method 코드)
  ├──────────────┤
  │ Data         │ 전역 · static 변수, class 구조 정보
  ├──────────────┤
  │ Heap  ↓      │ 실행 중 요청해서 받는 공간 (객체)
  │              │
  │ Stack ↑      │ 함수 호출 시 지역 변수, 반환하면 사라짐
  └──────────────┘
  ```

  | 구역 | 생성 | 소멸 | SV 대응 |
  |---|---|---|---|
  | Data (static) | 프로그램 시작 | 프로그램 종료 | module 변수, static 변수, static class 멤버 |
  | Stack | 함수 · task 호출 | 반환 | `automatic` 지역 변수, class method 인자 (class method는 기본 automatic) |
  | Heap | `new()` | 참조 handle이 없어질 때 (GC) | class 객체, dynamic array · queue 원소 |

- **Heap이 필요한 이유**
  - 객체 개수 · 생성 시점을 컴파일 때 알 수 없음 (루프에서 1000개 생성 등)
  - 함수가 끝난 뒤에도 객체가 살아 있어야 함 (mailbox로 넘긴 transaction 등) → stack 부적합

- **Class 선언이 저장되는 곳**

  | 부분 | 위치 | 개수 |
  |---|---|---|
  | Method 코드 (`new`, `run` …) | Code 영역 | class당 1벌 |
  | 구조 정보 (크기, 멤버 offset, 타입 정보, virtual method 테이블) | 읽기 전용 data 영역 ⚠️ 구현 비공개 | class당 1벌 |
  | `static` 멤버 | Static data 영역 | class당 1개, `new` 없이 존재 (`cls::cnt`) |
  | Non-static 멤버 | `new()` 때 heap | 객체 수만큼 |

  - 실행 전 : `.sv` 소스 → 컴파일 · elaboration 결과가 디스크에 저장 (⚠️ xsim = `xsim.dir`, VCS = `simv`, Questa = `work`)
  - `new()`를 한 번도 안 하면 heap 사용량 0

- **객체 크기 · 멤버 위치**
  - 각 멤버의 offset(객체 시작에서의 거리)은 **컴파일 때** class 선언으로 결정 → `new()`가 정하는 것은 시작 주소 하나
  - 상속 class = 부모 멤버 + 자기 멤버
  - Dynamic array · queue · string 멤버 → 객체 안에는 관리 정보만, 원소는 `new[N]` · `push_back()` 때 heap에 별도 할당
  - Handle 멤버 → 참조값 크기만, 가리키는 객체는 별도
  - Heap 전체 크기는 미리 정하지 않음 → 할당기가 필요할 때 OS에 추가 요청, 상한 = RAM · 가상 메모리

- **8비트 멤버 하나 = heap 1바이트가 아닌 이유** ⚠️ 정확한 크기는 구현마다 다름, 원리만

  | 추가되는 것 | 이유 |
  |---|---|
  | 객체 헤더 | 실행 중 타입 확인 필요 (virtual method, `$cast`), GC 관리 정보 |
  | 데이터 표현 | 4-state(`logic`)는 0 · 1 · X · Z 표현에 더 많은 비트 필요 (참고 : DPI 표준 C 표현 `svLogicVecVal` = aval · bval 32비트 word 2개) |
  | 정렬 padding | CPU가 정렬된 주소에서 빠르게 읽음 |
  | 할당기 최소 단위 | Heap 할당기는 1바이트 단위로 나눠 주지 않음 (⚠️ 예 : 64-bit Linux glibc malloc = 16바이트 정렬, 최소 블록 수십 바이트) |

  → 8비트 멤버 하나짜리 객체도 실제로는 수십 바이트 수준

- **실무 관점** : 메모리는 바이트 계산보다 **동시에 살아 있는 객체 수**가 중요 → handle을 계속 붙잡는 queue · mailbox가 메모리 누수 원인

**꼬리 질문**
- **Q.** 객체를 100개 만들면 method 코드도 100벌인지
  - **A.** 아님 → code 영역에 1벌, 객체마다 다른 것은 non-static 멤버 값뿐
- **Q.** static 멤버와 일반 멤버 차이
  - **A.** static = class 전체가 공유하는 1개, 객체 없이도 존재 / 일반 멤버 = 객체마다 heap에 따로 존재
- **Q.** 왜 객체는 stack이 아닌 heap에 두는지
  - **A.** 개수 · 수명을 컴파일 때 알 수 없고, 생성한 함수가 끝난 뒤에도 살아 있어야 하기 때문

**헷갈리기 쉬운 점**
- Class 선언만 해서는 heap 사용 없음 → 객체는 `new()` 때 생성
- 8비트 멤버 ≠ 1바이트 객체 (헤더 · 표현 · 정렬 · 할당기 오버헤드)
- 멤버 offset은 컴파일 때 결정, `new()`는 시작 주소만 결정

<sub>근거 : IEEE 1800-2017 Ch.8 (static 멤버, 메서드 lifetime) · Annex H DPI (`svLogicVecVal`) · 일반 OS 프로세스 메모리 구조 · 출처 : 수업 중 의문, 2026-11-03</sub>

---

### Q5-3. 가상 주소(virtual address)와 MMU — handle이 가진 주소는 실제 RAM 주소인지

> **한 줄 답** : 아님 → 프로그램(시뮬레이터)이 쓰는 주소는 모두 **가상 주소**, 메모리에 접근할 때마다 **CPU의 MMU가 page table로 물리 주소로 변환**

**면접 답변**
- OS는 프로세스마다 가상 주소 공간을 주고, 가상 page ↔ 물리 page 대응표(page table)를 관리
- CPU 안의 MMU가 메모리 접근마다 page table을 참조해 가상 → 물리 변환, 최근 결과는 TLB에 캐시
- 대응이 없으면 page fault → OS가 물리 page 할당 또는 디스크에서 읽어 온 뒤 재실행
- SV handle이 가진 값도 (⚠️ 구현상) 가상 주소 수준 → 물리 주소는 시뮬레이터도 SV 코드도 모름, C 포인터도 동일

**설명**

- **역할 분담**

  | 주체 | 역할 |
  |---|---|
  | OS | 프로세스별 page table 생성 · 관리 |
  | MMU (CPU 하드웨어) | 메모리 접근마다 가상 → 물리 주소 변환 |
  | TLB (MMU 안 캐시) | 최근 변환 결과 저장 → 매번 page table 조회 방지 |

- **Page 단위 변환** (x86-64 기본 page = 4 KB)

  ```
  가상 주소   0x0000_5008
              └ page 번호 0x5 ┘└ offset 0x008 ┘
                      │ MMU : page table 조회 (0x5 → 0x9A)
                      ▼
  물리 주소   0x0009_A008     ← offset은 그대로
  ```

- **Page fault**
  1. MMU가 대응을 못 찾음 → page fault로 OS에 넘김
  2. OS 처리 : 처음 쓰는 page면 빈 물리 page 할당(on-demand paging), swap된 page면 디스크에서 읽어 옴
  3. Page table 갱신 → 해당 명령 재실행

- **가상 메모리를 쓰는 이유**
  - 같은 가상 주소라도 swap 후 물리 위치가 바뀔 수 있음 → 프로그램은 몰라도 됨
  - 프로세스마다 독립 주소 공간 → 서로의 메모리 침범 방지
  - 할당(가상 주소 확보)과 실제 RAM 사용 시점 분리 → 필요한 page만 RAM에 올림

- **SV handle과의 연결** : `tr` = 가상 위치 참조 → `tr.a` 접근 순간 MMU가 물리 주소로 변환해 RAM에서 읽음

**꼬리 질문**
- **Q.** C에서 `printf("%p")`로 찍히는 주소는 물리 주소인지
  - **A.** 아님 → 가상 주소, 모든 사용자 프로그램 주소는 가상 주소
- **Q.** TLB가 없으면
  - **A.** 메모리 접근마다 page table(메모리에 있음)을 먼저 읽어야 함 → 접근 횟수 증가로 성능 저하

**헷갈리기 쉬운 점**
- Handle에 물리 주소가 저장되는 것이 아님 → 변환은 **접근할 때마다** MMU가 수행
- 가상 → 물리 변환은 SV 전용 장치가 아닌, 모든 프로그램에 공통인 OS + MMU 기능
- 주소 전체가 아닌 **page 번호만** 변환, page 내 offset은 그대로

<sub>근거 : Patterson & Hennessy, *Computer Organization and Design* Ch.5 (virtual memory, page table, TLB, page fault) · 출처 : 수업 중 의문, 2026-11-03</sub>

---

### Q5-4. Handle 복사와 객체 공유 — generator · driver가 같은 mailbox를 쓰는 원리

> **한 줄 답** : 상위(env)에서 객체를 **한 번만 `new`** 하고 handle을 하위에 넘기면 **같은 참조 값이 복사**됨 → 여러 객체가 같은 객체 하나를 공유

**면접 답변**
- Handle 대입 · 인자 전달 = 객체 복사가 아닌 **참조 값 복사**
- env에서 mailbox를 생성하고 generator · driver constructor에 넘기면 세 handle이 같은 mailbox를 가리킴 → gen의 `put()`을 drv가 `get()`으로 꺼낼 수 있음
- 하위에서 받은 handle에 다시 `new`하면 다른 객체를 가리키게 돼 연결이 끊김
- 별개 객체가 필요하면 `new h`(shallow copy) 또는 직접 만든 `copy()`(deep copy)

**설명**

- **공유 구조**

  ```systemverilog
  class environment;
    mailbox #(transaction) mbx;
    generator gen;
    driver    drv;
    function new();
      mbx = new();        // 객체 생성은 여기서 1번
      gen = new(mbx);     // 참조 값 복사
      drv = new(mbx);     // 참조 값 복사
    endfunction
  endclass
  ```

  ```
   env :  mbx            ─┐
   gen :  gen2drv_mbox   ─┼──→  mailbox 객체 (heap, 1개)
   drv :  gen2drv_mbox   ─┘
  ```

  - "같은 주소를 할당받음"이 아닌 "같은 참조 값을 복사받음" → 객체는 1개
  - 한쪽에서 객체 내용을 바꾸면 다른 쪽에서도 바뀐 내용이 보임

- **Handle 변수 위치 vs 값**

  | | env의 `mbx` | driver의 `gen2drv_mbox` |
  |---|---|---|
  | 변수 칸 위치 | env 객체 안 | driver 객체 안 → **서로 다름** |
  | 칸에 든 값 | mailbox 객체 참조값 | **같은 참조값** (복사본) |

  - Handle → 객체 1단계 참조만 존재, handle이 다른 handle 변수를 가리키는 구조(C의 `**ptr`) 없음
  - 칸이 독립 → 이후 한쪽 handle에 다른 값을 대입해도 다른 쪽 handle 값은 그대로
  - ⚠️ task · function의 `ref` 인자 = 호출 중에만 변수 자체의 별칭, class 멤버에 대입하는 순간은 역시 참조 값 복사

- **흔한 실수 : 받은 쪽에서 다시 `new`**

  ```systemverilog
  function new(mailbox #(transaction) m);
    gen2drv_mbox = m;
    gen2drv_mbox = new();   // ✗ 다른 mailbox로 덮어씀 → generator와 연결 끊김
  endfunction
  ```

  - 결과 : driver가 빈 mailbox에서 `get()` 대기 → 시뮬레이션 hang
  - 원칙 : 공유 객체는 상위에서 1번 `new`, 하위는 받기만

- **반복 생성 시 handle 값 변화** (generator `repeat(100) begin tr = new; … put(tr); end`)

  | 반복 | `tr` 칸 위치 | `tr` 값 | 일어난 일 |
  |---|---|---|---|
  | 시작 | generator 객체 안 (고정) | null | 객체 없음 |
  | 1회 | 같은 칸 | 객체 #1 위치 | #1 생성 |
  | 2회 | 같은 칸 | 객체 #2 위치 | #2 생성, 값 덮어씀 |

  - Handle 변수는 1개 → `new` 때마다 새 객체 주소로 값만 덮어씀 (이전 객체 · 해제 시점은 Q5-6)
  - 이전 객체는 mailbox가 참조 중이면 그대로 살아 있음
  - ⚠️ 새 주소는 할당기 구현에 따름 → 동시에 살아 있는 객체끼리는 겹치지 않음, 연속 증가 보장 없음, 해제된 자리는 재사용 가능 → 주소를 객체 ID로 쓰면 안 됨 (ID가 필요하면 `static int cnt;` + constructor에서 `id = cnt++;`)

- **복사 방식**

  | 방식 | 코드 | 결과 |
  |---|---|---|
  | Handle 복사 | `t2 = t1;` | 같은 객체 공유 |
  | Shallow copy | `t2 = new t1;` | 새 객체에 멤버 값 복사, 멤버 중 handle은 참조 값만 복사 (하위 객체 공유) |
  | Deep copy | 직접 만든 `copy()` | 하위 객체까지 새로 생성해 완전히 분리 |

**꼬리 질문**
- **Q.** Driver constructor 안에서 mailbox를 `new`하면
  - **A.** Generator와 다른 mailbox를 쓰게 돼 transaction이 전달되지 않음 → driver `get()`에서 hang
- **Q.** `new t1`로 복사했는데 내부 객체 값이 같이 바뀌는 이유
  - **A.** Shallow copy라 handle 멤버는 참조 값만 복사 → 하위 객체 공유 → deep copy 필요
- **Q.** env가 driver에 mailbox를 넘긴 뒤 자기 `mbx`에 다시 `new`하면 driver는 어느 mailbox를 쓰는지
  - **A.** 옛 mailbox → driver handle은 env의 변수가 아닌 객체 참조값을 복사해 갖고 있으므로 env 칸 값이 바뀌어도 영향 없음 / 이후 generator에 새 mailbox를 넘기면 gen · drv가 서로 다른 mailbox → driver `get()` hang

**헷갈리기 쉬운 점**
- 다른 객체에 넘기는 것 = 주소 "할당"이 아닌 참조 값 "복사"
- 클래스 안에 생기는 것 = mailbox 객체가 아닌 **handle 칸** / 칸 위치는 각자 다르고 같은 것은 칸에 든 값(참조값)
- Handle은 다른 handle 변수를 가리키지 않음 → 객체를 직접 가리킴
- 공유 객체는 상위에서 1번만 `new`
- Handle 주소 ≠ 객체의 영구 ID (해제 후 재사용 가능)

<sub>근거 : IEEE 1800-2017 Ch.8 (object handle 대입, shallow copy `new`) · 13.5.2 (`ref` 인자) · 출처 : 수업 코드 (generator · mailbox), 2026-11-03 · 수업 중 의문, 2026-11-04</sub>

---

### Q5-5. Mailbox에 transaction을 계속 넣을 때의 문제와 객체 수명

> **한 줄 답** : Mailbox는 handle을 붙잡고 있어 `get()` 전까지 객체가 해제되지 않음 → **메모리 증가 · 생산자/소비자 동기 상실 · 같은 handle 반복 버그 · 검사 누락** 위험

**면접 답변**
- Unbounded mailbox(`new()`)는 `put()`이 대기하지 않음 → generator가 driver보다 빠르면 객체가 쌓여 메모리 증가, 지연 없는 루프면 시간 0에 전부 생성
- Bounded mailbox(`new(N)`)는 가득 차면 `put()`이 block → 생산자가 소비자 속도에 맞춰지는 backpressure
- Mailbox에는 객체가 아닌 handle이 들어감 → 객체 하나를 만들어 반복해서 넣으면 모든 항목이 같은 객체 → transaction마다 `new`
- 테스트 종료 시 `num() == 0` 확인 → 남은 항목 = 검사되지 않은 transaction

**설명**

- **Generator 루프의 메모리 흐름**

  | 코드 | 메모리 동작 |
  |---|---|
  | `tr = new;` | heap에 새 transaction 생성, generator 안 `tr` 칸 값 덮어씀 |
  | `tr.randomize();` | 그 객체의 `rand` 멤버 값만 채움 |
  | `tr.debug_print("GEN");` | code 영역 함수를 그 객체에 대해 실행 |
  | `gen2drv_mbox.put(tr);` | mailbox 내부 저장 공간에 handle 추가 (객체 복사 아님) |

  ```
  100회 후, driver가 아직 안 꺼낸 경우 (unbounded)
   generator : tr ─────────────────────────→ tr#100
   mailbox   : [h1][h2][h3] … [h100]
                 ▼   ▼   ▼         ▼
               tr#1 tr#2 tr#3 … tr#100     ← heap에 객체 100개
  ```

- **객체가 해제되는 시점**
  1. Driver `get(tr_d)` → mailbox에서 handle 하나 빠지고 `tr_d`로 복사
  2. Driver가 다음 `get()`으로 `tr_d`를 덮어씀 → 이전 객체를 참조하는 handle 없음
  3. GC 해제 대상

- **Bound 설정**

  ```systemverilog
  mailbox #(transaction) mbx = new();    // unbounded (기본)
  mailbox #(transaction) mbx = new(4);   // 최대 4개, 가득 차면 put() block
  ```

  - `new(1)` → 하나 넣고 꺼낼 때까지 대기 → generator · driver가 거의 lock-step
  - Non-blocking : `try_put()` · `try_get()` → 성공 1, 실패 0 반환

- **같은 handle 반복 버그**

  ```systemverilog
  Packet p = new();          // 객체 1개
  repeat (3) begin
    p.data = $urandom;
    mbx.put(p);              // ✗ 3칸 모두 같은 객체 → driver는 마지막 값만 3번 봄
  end
  ```

  - 해결 : 루프 안에서 매번 `p = new();`

**꼬리 질문**
- **Q.** Generator 루프에 지연이 없고 mailbox가 unbounded면
  - **A.** 시뮬레이션 시간 0에 transaction 전부 생성 → heap에 한꺼번에 쌓임, driver 진행과 무관하게 generator만 끝남
- **Q.** 테스트가 PASS인데 데이터가 빠졌을 수 있는 경우
  - **A.** Mailbox · scoreboard queue에 미처리 항목이 남은 채 종료 → 종료 시 `num() == 0` · 기대 queue 비었는지 검사

**헷갈리기 쉬운 점**
- Mailbox에 들어가는 것 = 객체 복사본이 아닌 **handle**
- Unbounded = 무한 대기 없음이 아닌 **`put()`이 절대 대기하지 않음** → 속도 관계 소실
- 객체 해제 조건 = mailbox에서 빠지고 **모든 handle이 놓을 때**

<sub>근거 : IEEE 1800-2017 15.4 Mailboxes (bounded · unbounded, put · get · try_put · try_get · num) · Ch.8 (object handle) · 출처 : 수업 코드 (generator · mailbox), 2026-11-03</sub>

---

### Q5-6. 같은 handle에 `new`를 반복하면 이전 객체 · 주소는 어떻게 되는지, 객체는 언제 해제되는지

> **한 줄 답** : 덮어써지는 것은 **handle 칸의 값**뿐 → 새 객체는 항상 **다른 주소**에 생성, 이전 객체는 **다른 handle이 없을 때만** 해제 대상, 실제 회수 시점은 시뮬레이터 구현에 따름

**면접 답변**
- `tr = new;` = ① 새 객체 할당 → ② tr에 새 주소 대입 순서 → ① 시점에 이전 객체가 아직 살아 있어 새 객체는 반드시 다른 주소
- 이전 객체 메모리는 덮어쓰지 않음, 바뀌는 것은 tr 칸의 값
- 이전 객체를 mailbox 등 다른 handle이 참조하면 계속 살아 있음, tr이 유일한 참조였으면 대입 순간 해제 대상
- 해제 대상이 되는 순간은 정확히 정해지지만 실제 메모리 회수 시점은 IEEE 1800이 정하지 않음 → 소멸자가 없어 동작에는 영향 없음

**설명**

- **실행 순서**

  ```
  tr = new;
  ① new 실행  → 새 객체 할당      (tr은 아직 이전 객체 참조 → 이전 객체 살아 있음)
  ② 대입      → tr 칸에 새 주소   (이 순간 이전 객체가 해제 대상 후보)
  ```

- **경우 1 : 루프 안에서 `put(tr)` (mailbox 사용)**

  ```systemverilog
  repeat(100) begin
    tr = new;
    gen2drv_mbox.put(tr);
  end
  ```

  | 반복 | tr 칸 값 | 이전 객체 |
  |---|---|---|
  | 1회 | #1 주소 | - |
  | 2회 | #2 주소 (덮어씀) | #1 = mailbox가 참조 → 살아 있음 |
  | 100회 | #100 주소 | #1 ~ #99 모두 살아 있음 |

  - Mailbox에 남아 있는 객체는 모두 살아 있음 → 동시에 살아 있는 객체끼리 주소가 겹치지 않으므로 **전부 다른 주소**
  - Driver가 `get()` 후 그 handle을 덮어쓰면 해제 대상 → ⚠️ 이후 생성되는 객체가 그 자리를 재사용할 수 있음

- **경우 2 : `put` 없이 `new`만 반복**

  ```systemverilog
  repeat(100) begin
    tr = new;
    tr.randomize();
  end
  ```

  | 반복 | tr 칸 값 | 이전 객체 |
  |---|---|---|
  | 1회 | #1 주소 | - |
  | 2회 | #2 주소 (덮어씀) | #1을 가리키는 handle 없음 → 해제 대상 |
  | 3회 | #3 주소 (덮어씀) | #2 해제 대상 |

  - 루프 종료 후 남는 객체 = #100 하나
  - ⚠️ 해제된 자리는 할당기가 재사용 가능 → #3이 #1의 주소를 받을 수도 있음 (덮어쓰기가 아닌 "비워진 자리에 새로 배치")

- **해제 2단계**

  | 단계 | 시점 | 정해짐 여부 |
  |---|---|---|
  | 1. 해제 대상(unreachable) | 그 객체를 가리키는 **마지막 handle이 없어지는 순간** | 코드로 정확히 결정 |
  | 2. 실제 메모리 회수 | 시뮬레이터가 결정 (즉시 회수 또는 나중에 일괄 회수) | ⚠️ IEEE 1800 미규정, 벤더 비공개 |

  - 마지막 handle이 없어지는 경우
    - 다른 값으로 덮어씀 (`tr = new;`)
    - `tr = null;`
    - Handle 변수 수명 종료 (`automatic` task · function의 지역 handle → 반환 시)
    - Mailbox · queue에서 빠지고 받아 간 쪽도 놓음
  - 살아 있는 경우 : mailbox · queue · 다른 객체 멤버 등 **어디든 handle이 하나라도 남음**, 실행 중인 thread(`fork`)가 사용 중
  - 회수된 메모리는 보통 OS에 바로 반환하지 않고 할당기가 보관 → 다음 `new`에 재사용

- **실무적으로 중요한 것**
  - SV에는 소멸자(destructor)가 없음 → 실제 회수 시점이 동작에 영향 없음, 해제 대상 객체는 다시 접근할 방법도 없음
  - 관리할 것 = **handle을 어디에 남겨 두는지**
  - 메모리 증가의 원인 = 회수 지연이 아닌 handle이 남아 해제 대상이 안 된 것 (예 : queue에 넣기만 하고 안 뺌)
  - 주소 재사용 가능 → 주소로 객체 구분 금지, ID는 `static` 카운터로 직접 부여

**꼬리 질문**
- **Q.** `tr = new;`에서 새 객체가 이전 객체 자리에 생길 수 있는지
  - **A.** 없음 → `new`가 먼저 실행될 때 tr이 이전 객체를 아직 참조 중이라 이전 객체가 살아 있음, 이후의 다른 `new`는 회수된 자리를 재사용할 수 있음
- **Q.** Mailbox에 넣은 transaction은 언제 해제되는지
  - **A.** Mailbox에서 `get()`으로 빠지고, 받아 간 handle까지 덮어써지거나 수명이 끝나 참조가 하나도 없을 때 해제 대상

**헷갈리기 쉬운 점**
- 덮어써지는 것 = **handle 칸의 값**, 이전 객체 메모리는 그대로
- `new` 반복 = 이전 객체 즉시 해제가 아님 → **다른 handle이 있으면 살아 있음**
- "해제 대상이 되는 순간"(정확히 정해짐) ≠ "실제 회수 순간"(구현에 따름)
- 같은 주소 재등장 = 덮어쓰기가 아닌 회수 후 재사용

<sub>근거 : IEEE 1800-2017 Ch.8 (object handle, 자동 메모리 관리) · 15.4 Mailboxes · 출처 : 수업 중 의문, 2026-11-03</sub>

---

### Q5-7. 변수 이름 `tr` 자체는 메모리에 어떻게 저장되는지

> **한 줄 답** : 실행 코드에는 이름이 저장되지 않음 → 컴파일 · elaboration 때 **symbol table**로 이름이 **위치(offset)로 변환**, 이름 문자열은 디버그 정보로만 따로 보관

**면접 답변**
- 컴파일러가 symbol table(이름 ↔ 종류 · 타입 · 위치)을 만들어 이름을 위치로 바꿈
- `tr = new;` → 실행 코드에서는 "현재 generator 객체 시작 + tr의 offset 위치에 새 객체 주소 저장"이라는 명령으로 변환
- CPU는 주소만 사용, 이름은 모름 (C 실행 파일도 동일, `-g` 디버그 정보에만 이름이 남음)
- 시뮬레이터 파형 · 디버거 · `%m`에서 이름이 보이는 것은 디버그용 "이름 ↔ 위치" 표를 따로 보관하기 때문

**설명**

- **Symbol table 예** (위치는 예시)

  | 이름 | 종류 | 타입 | 위치 |
  |---|---|---|---|
  | `tr` | generator 멤버 | transaction handle | generator 객체 시작 + 8 |
  | `gen2drv_mbox` | generator 멤버 | mailbox handle | generator 객체 시작 + 16 |

- **선언 위치별 위치 기준**
  - Class 멤버 → 객체 시작 기준 offset
  - `automatic` 지역 변수 → stack frame 기준 offset
  - Static 변수 → 고정된 data 영역 위치

- **디버그 정보**
  - 실행 코드와 별개인 부가 정보 → 파형 창 · 디버거 · 계층 이름(`top.env.gen.tr`) 표시에 사용
  - ⚠️ 얼마나 남길지는 툴 · 옵션마다 다름 (예 : xsim `-debug` 수준), 줄이면 일부 신호가 파형에 안 보일 수 있음

- **비유** : 소스의 `tr` = 설계도의 방 이름표("거실"), 실행 코드 = "현관에서 8걸음" 같은 위치 지시, 디버그 정보 = "8걸음 = 거실" 안내 책자

**헷갈리기 쉬운 점**
- 변수 이름은 실행 중 메모리에 문자열로 저장되지 않음 → 위치로 변환
- 파형에 이름이 보이는 것 = 디버그 정보 덕분 (실행에는 불필요)

<sub>근거 : 일반 컴파일러 구조 (symbol table, 디버그 정보) · 출처 : 수업 중 의문, 2026-11-03</sub>

---

### Q5-8. Class 안의 함수(method)도 객체마다 할당되는지

> **한 줄 답** : 아님 → method 코드는 **code 영역에 class당 한 벌**, heap에는 없음 → 호출할 때 **`this`**(어느 객체인지)를 함께 넘겨 같은 코드로 각 객체의 데이터를 처리

**면접 답변**
- 함수 = 컴파일된 기계어 명령어 묶음 → code 영역에 1개만 저장, 모든 객체가 공유
- 객체마다 다른 것은 데이터뿐 → 같은 명령어를 객체마다 복사하면 메모리 낭비
- `tr1.debug_print()` · `tr2.debug_print()` 모두 같은 주소의 코드 실행, 차이는 넘겨주는 `this`
- 호출할 때마다 `this` · 인자 · 지역 변수용 stack frame 생성, 반환 시 소멸 (class method는 기본 automatic)

**설명**

- **"한 벌"의 의미**

  ```
            가상 주소(예시)
  Code 영역  0x0040_0100 : [debug_print 명령어 ①②③④]   ← 1개

  Heap       0x5000 : tr1 객체 [a=5, b=3]
             0x5040 : tr2 객체 [a=7, b=1]
             0x5080 : tr3 객체 [a=2, b=9]
  ```

  ```systemverilog
  tr1.debug_print();   // 0x0040_0100 실행, this = 0x5000 → 5, 3 출력
  tr2.debug_print();   // 같은 0x0040_0100 실행, this = 0x5040 → 7, 1 출력
  tr3.debug_print();   // 같은 0x0040_0100 실행, this = 0x5080 → 2, 9 출력
  ```

  - 함수 안의 `a` = 실제로는 `this.a` → 호출한 객체의 a를 읽음
  - `this` = IEEE 1800 키워드 (⚠️ 내부적으로 숨은 인자로 넘기는 방식은 구현 사항, C++ `this` 포인터와 같은 개념)
  - 비유 : 함수 코드 = 요리책 레시피 1권, 객체 = 재료 바구니 → 바구니만 바꿔 가며 같은 레시피를 따라 함

- **무엇이 언제 어디에 생기는지**

  | 대상 | 위치 · 시점 | 개수 |
  |---|---|---|
  | 함수 코드 | Code 영역, 프로그램 로드 시 | class당 1벌 |
  | `this` + 인자 + 지역 변수 | Stack frame, **호출할 때마다** | 호출마다, 끝나면 소멸 |
  | Virtual 함수 표(vtable) | 프로그램에 1개 | class당 1개 (⚠️ 일반적 구현) |
  | 객체 안의 vtable 참조 | `new()` 때 객체 헤더 | 객체마다 1개 (⚠️ 구현) |

  - `#` · `@`로 기다리는 task → task가 끝날 때까지 호출 공간 유지
  - ⚠️ 동시 thread가 많은 시뮬레이터 특성상 task 호출 공간을 내부적으로 heap에 둘 수도 있음 → 그래도 데이터 공간 이야기, **함수 코드는 heap에 없음**

- **Virtual method**
  - Handle 타입이 base여도 실제 객체가 child면 child 함수 실행 → 실행 중 실제 class 확인 필요
  - 일반적 구현 : class마다 virtual 함수 주소 표 1개, 객체 헤더에는 그 표를 가리키는 참조만 → 함수 코드는 여전히 1벌

- **Static method**
  - `this` 없음 → 객체 없이 `transaction::func()` 호출 가능
  - Static 멤버만 접근 가능, 일반 멤버(a, b) 접근 불가 (어느 객체인지 알 수 없음)

**꼬리 질문**
- **Q.** 객체가 1000개면 method 코드 메모리도 1000배인지
  - **A.** 아님 → 코드는 1벌, 늘어나는 것은 객체 데이터(+ 헤더)뿐
- **Q.** 같은 함수 코드로 어떻게 객체마다 다른 값을 처리하는지
  - **A.** 호출 시 `this`로 대상 객체를 넘기고, 함수 안 멤버 접근은 `this` 기준 offset으로 수행
- **Q.** Static method에서 일반 멤버를 못 쓰는 이유
  - **A.** `this`가 없어 어느 객체의 멤버인지 정할 수 없음

**헷갈리기 쉬운 점**
- Method는 heap에 없음 → code 영역, class당 1벌
- 호출마다 생기는 것 = 코드가 아닌 `this` · 인자 · 지역 변수 공간
- Virtual이어도 함수 코드는 1벌, 객체에는 표 참조만

<sub>근거 : IEEE 1800-2017 8.6 (method lifetime), 8.10 (static methods), 8.11 (this), 8.20 (virtual methods) · 출처 : 수업 중 의문, 2026-11-03</sub>

---

### Q5-9. `mailbox #(transaction)`은 transaction 크기만큼 공간을 잡는지, mailbox에는 무엇이 저장되는지

> **한 줄 답** : `#(transaction)`은 크기가 아닌 **타입 지정** → mailbox에는 객체가 아닌 **handle 값(객체의 참조, tr 변수의 주소가 아님)**이 저장, transaction 객체는 generator의 `new`가 따로 생성

**면접 답변**
- `mailbox #(transaction)` = parameterized mailbox → transaction handle만 넣고 빼도록 컴파일 시 타입 검사
- `mbx = new();` 때 생기는 것은 mailbox 객체(관리 정보 + 저장 공간)뿐, transaction 객체는 0개
- `put(tr)` = tr에 들어 있는 값(객체 참조)을 복사해 handle 한 칸 추가 → 칸 크기는 참조값 크기
- Mailbox는 put 순간의 값을 복사 → 이후 tr을 새 객체로 바꿔도 이미 들어간 칸은 그대로

**설명**

- **타입 지정**
  - `mailbox #(transaction)` → 다른 타입 `put()` 시 컴파일 에러, `get()` 결과를 transaction으로 바로 받음
  - `mailbox mbx;` (typeless) → 아무 타입 가능, 타입 검사가 실행 중으로 미뤄져 실수를 늦게 발견

- **시점별 할당**

  | 시점 | 생기는 것 | 크기 |
  |---|---|---|
  | `mailbox #(transaction) mbx;` | handle 칸 (null) | 참조값 1개 |
  | `mbx = new();` | mailbox 객체 | mailbox 관리 정보, transaction과 무관 |
  | `tr = new;` (generator) | transaction 객체 | transaction 크기 |
  | `mbx.put(tr);` | mailbox 안 handle 1칸 | 참조값 1개 |

  - ⚠️ Mailbox 내부 저장 구조는 툴마다 다름 → unbounded는 보통 put할 때마다 증가
  - `new(4)` bound여도 미리 잡을 수 있는 것은 handle 4칸, transaction 객체 4개가 아님

- **저장되는 것 = tr의 값 (tr 변수의 위치가 아님)**

  ```
  tr 칸 (0x1000)   : 0x5000        ← tr 변수 자체의 위치 = 0x1000
  mailbox          : [0x5000]      ← tr의 "값"을 복사 (0x1000이 아님)
  heap   0x5000    : transaction 객체
  ```

  ```systemverilog
  tr = new;  mbx.put(tr);   // mailbox ← 0x5000
  tr = new;  mbx.put(tr);   // tr 값 0x5040 → mailbox ← 0x5040
  // 결과 : mailbox = [0x5000][0x5040]
  ```

  - ⚠️ 참조값이 실제 가상 주소인지는 구현 사항, 개념상 객체를 가리키는 값
  - 만약 tr 변수의 위치(0x1000)가 저장된다면 모든 칸이 "tr이 지금 가리키는 객체" = 마지막 객체만 보게 됨 → 실제로는 값 복사라 각 칸이 서로 다른 객체 유지

**꼬리 질문**
- **Q.** `mailbox #(transaction) mbx = new(10);`이면 transaction 객체 10개가 생기는지
  - **A.** 아님 → 최대 handle 10칸이라는 제한일 뿐, 객체는 `put` 전에 각자 `new`로 생성
- **Q.** `put(tr)` 후 `tr.data`를 바꾸면 mailbox 안 항목도 바뀌는지
  - **A.** 바뀜 → mailbox 칸과 tr이 같은 객체를 참조 (handle 값 복사이지 객체 복사가 아님) → put 후에는 그 객체를 수정하지 말고 새로 `new`
- **Q.** 10개 put 후 3개 get 하면, 빠진 3자리에 새 참조값이 들어가는지
  - **A.** 아님 → mailbox = 고정 칸 배열이 아닌 **FIFO** → get은 앞에서 꺼내고 put은 항상 맨 뒤에 추가, 꺼내는 순서는 h4부터 / bounded면 개수 상한이라 3개 get 후 3개 put은 block 없음 / ⚠️ 내부 메모리 재사용 여부는 구현 사항
  - 별개 : 꺼낸 객체가 GC되면 그 **heap 주소**는 새 `new`가 재사용 가능 (Q5-4) → mailbox 순서와 무관

**헷갈리기 쉬운 점**
- `#(transaction)` = 타입 이름표, 크기 예약 아님
- Mailbox에 저장 = **tr의 값(객체 참조)**, tr 변수 자체의 위치가 아님
- 객체를 만드는 것은 언제나 `new` (mailbox 생성 · bound와 무관)

<sub>근거 : IEEE 1800-2017 15.4 Mailboxes (15.4.9 parameterized mailboxes, FIFO 순서) · Ch.8 (object handle) · 출처 : 수업 중 의문, 2026-11-03 · 2026-11-04</sub>

---

### Q5-10. Virtual interface는 무엇이고 메모리에 어떻게 저장되는지

> **한 줄 답** : Virtual interface 변수 = **실제 interface instance를 가리키는 참조** → 선언만 하면 **null**, instance를 대입해야 가리킴, 대상 instance는 elaboration 때 생긴 **static** 구조라 `new` · 해제 없음

**면접 답변**
- Interface instance(`adder_if intf(clk);`)는 elaboration 때 static 설계 영역에 생성, 실제 신호를 가지고 시뮬레이션 끝까지 존재
- Class는 실행 중 생성되는 dynamic 객체라 static 하드웨어인 interface를 직접 포함할 수 없음 → instance를 가리키는 참조만 보유 = virtual interface
- `virtual adder_if vif;` 선언만 하면 null, top에서 만든 instance를 constructor 등으로 넘겨 대입해야 연결
- `vif.a <= …`는 참조를 따라 실제 신호에 쓰기 → DUT 입력이 실제로 변함, 신호 쓰기라 이벤트 스케줄링을 거침

**설명**

- **두 가지 구분**

  | 대상 | 무엇인지 | 생성 | 위치 |
  |---|---|---|---|
  | Interface instance (`adder_if intf(clk);`) | 실제 신호(a, b, clk …)를 가진 하드웨어 구조 | Elaboration 때, `new` 없음 | Static 설계 영역, 시뮬레이션 끝까지 |
  | Virtual interface 변수 (`virtual adder_if vif;`) | 그 instance를 가리키는 참조 | 변수 칸은 선언 위치에, 초기값 null | Class 멤버면 그 객체 안(heap) |

- **연결 코드와 메모리**

  ```systemverilog
  module tb_top;
    adder_if intf(clk);            // 실제 interface instance
    initial env = new(intf);       // instance 전달
  endmodule

  class driver;
    virtual adder_if vif;          // 참조 칸 (null)
    function new(virtual adder_if vif);
      this.vif = vif;              // 참조 값 복사 → 이제 실제 instance를 가리킴
    endfunction
  endclass
  ```

  ```
  [static 설계 영역]  tb_top.intf : [ a | b | clk | ... ]   ← 실제 신호 (1개)
                           ▲            ▲
  [heap]  driver 객체  : vif ─┘            │
          monitor 객체 : vif ──────────────┘   ← 같은 instance 공유
  ```

  - Driver · monitor의 vif가 같은 instance를 참조 → mailbox handle 공유(Q5-4)와 같은 원리
  - ⚠️ 신호 값의 내부 저장 구조(값, driver 목록, 이벤트 대기 목록 등)는 시뮬레이터 구현 사항

- **선언 시 할당되는 것 = 참조 칸 1개 (객체 아님), 위치는 선언 위치 규칙(Q5-2)을 따름**

  | 선언 위치 | vif 칸 위치 | 생성 | 소멸 |
  |---|---|---|---|
  | Class 멤버 | Heap (그 객체 안) | 객체 `new()` 때 | 객체 GC 때 |
  | Module · interface · program 안, `static` 변수 | Static data 영역 | Elaboration | 시뮬레이션 끝 |
  | `automatic` task · function 지역 변수 · 인자 (class method 인자 포함) | Stack | 호출 때 | 반환 때 |

  - 어느 경우든 칸의 값 = instance 참조값 (초기 null), ⚠️ 칸 크기는 구현마다 다름
  - Vif를 여러 개 선언해도 늘어나는 것은 참조 칸뿐 → 실제 신호(interface instance)는 1벌

- **선언 vs 대입**

  | 시점 | vif 상태 |
  |---|---|
  | `virtual adder_if vif;` | null |
  | `vif = intf;` (직접 대입 또는 constructor 인자) | 실제 instance 참조 |
  | 연결 없이 `vif.a = 1;` | 실행 중 null 접근 오류 |

  - `virtual` = "interface instance를 가리키는 참조 타입"이라는 뜻일 뿐 → instance가 하나뿐이어도 **자동 연결 없음**
  - 연결 흐름 : top module에서 instance 생성 → `env = new(intf)` → env가 driver · monitor constructor로 전달 (UVM은 `uvm_config_db`로 전달)

- **왜 virtual이 필요한지**
  - Module · interface = static → 시뮬레이션 시작 전 구조 고정, 실행 중 생성 · 삭제 불가
  - Class 객체 = dynamic → 실행 중 `new`로 생성, GC로 해제
  - Dynamic한 TB(class)와 static한 하드웨어(module · interface)를 잇는 다리 = virtual interface

- **Class handle과 비교**

  | | Class handle | Virtual interface |
  |---|---|---|
  | 가리키는 대상 | Heap의 class 객체 | Static 설계 영역의 interface instance |
  | 대상 생성 | `new()` (실행 중) | Elaboration (시작 전), `new` 불가 |
  | 대상 해제 | 참조가 없으면 GC | 없음, 시뮬레이션 끝까지 존재 |
  | 초기값 | null | null |
  | 대입 · 전달 | 참조 값 복사 | 참조 값 복사 |

**꼬리 질문**
- **Q.** Class 안에 interface를 그냥 instance로 넣으면 안 되는 이유
  - **A.** Interface는 elaboration 때 고정되는 static 하드웨어 구조, class 객체는 실행 중 생성되는 dynamic 구조 → 실행 중 하드웨어를 새로 만들 수 없으므로 이미 존재하는 instance를 참조만 함
- **Q.** Driver에서 `vif.a` 접근 시 null 오류가 나면 원인은
  - **A.** Top에서 interface instance를 env · driver로 넘기는 연결 누락 (constructor 인자 전달 또는 config_db set/get 누락)
- **Q.** Driver와 monitor가 각자 vif를 가지면 신호가 두 벌인지
  - **A.** 아님 → 둘 다 같은 instance 참조, 신호는 하나

**헷갈리기 쉬운 점**
- `virtual` 선언 = 자동 연결이 아님 → **null**, 대입해야 실제 instance를 가리킴
- Virtual interface가 가리키는 것 = heap 객체가 아닌 **static interface instance**
- Interface instance는 `new`로 만들지 않음 (elaboration 때 생성)
- Vif 선언 = 객체 생성 아님 → 참조 칸만, 칸 위치는 선언 위치(class 멤버면 heap)에 따름
- 가상 메모리 ≠ heap → 가상 메모리 = 프로세스 주소 공간 전체 (static · heap · stack 모두 포함), interface instance도 가상 메모리 안의 static 영역

<sub>근거 : IEEE 1800-2017 25.9 Virtual interfaces · Ch.8 (object handle) · 출처 : 수업 중 의문, 2026-11-03 · 2026-11-04</sub>

---

## 6. 문제 해결 경험

<!-- STAR 템플릿
### P6-1. (프로젝트명) — (한 줄 요약)

- **Situation** : 
- **Task** : 
- **Action** : 
- **Result** : 
- **배운 점** : 
- **예상 꼬리 질문** : 
-->

---

## 진행 중 토론

> 결론 전에 끊긴 토론의 현재 상태 (다른 PC·새 세션에서 여기서부터 이어감)

**검증 계획서(verification plan)의 목표 · 구성** — 대상 : `Teamproject/02_UART` uart_loopback
- 합의 : 육안 확인 한계 → self-checking TB (scoreboard) 필요
- 합의 : 입력 공간 축 = 데이터 값(256) · start 엣지 위상(b_tick 대비) · baud 오차 · back-to-back · 비정상 입력
- 합의 : 비정상 입력 = glitch로 인한 false start (START cnt==7에서 rx 재확인 없음), stop bit=0 (framing error 미검출)
- 합의 : 기대값은 DUT와 독립 (TB가 보낸 값) ↔ 실제값은 TB monitor가 tx에서 복원한 값
- 합의 : exhaustive는 일반적으로 불가 → functional coverage(bin) 기반, 핵심 cross = 위상 × baud 오차
- 합의 : "밀려 들어옴" 3분류 — back-to-back(정상, 병목은 TX) / PC baud 빠름(throughput 문제, FIFO·flow control·스펙 제한) / stop bit 단축(프로토콜 위반, 처리 방식은 스펙으로 정의)
- 합의 : 계획서에 DUT 보장 범위(baud 오차 %, 연속 프레임 수) 먼저 정의 → coverage bin 경계
- 계획서 초안 작성 완료 : `Teamproject/02_UART/verification_plan.md` (스펙 · sign-off · 테스트 · coverage · 허용 baud 오차 계산 포함)
- 남은 것 : 사용자가 허용 baud 오차를 직접 계산해 부록 A와 대조, [제안] 스펙 항목 팀 결정, 토론 결론을 Q 항목(검증 대제목)으로 정리
- 확인 필요 가설 : back-to-back + PC baud가 약간 빠를 때 rx_done(1clk 펄스)이 TX STOP 중 도착 → 프레임 유실 가능성 (tx_busy 미연결)

---

## 토론 대기 질문

> 숙제 PDF · 메모에서 가져온 의문, 토론 후 위 대제목으로 이동

**D-FF · 타이밍** (`../homework.md`)
- [ ] D-FF Master-Slave 구조에서 ideal 상황이면 edge 이후 D 변화 risk가 없어 보이는데 hold time이 필요한 이유
- [ ] Setup / Hold time은 회로 내부에서 어떻게 결정되는지
- [ ] 최소 클럭 주기 식 검증 : 메모의 `T = T_comb,max + T_pd + T_h + T_s`
- [ ] Metastability (메모 항목만 있음)

**클럭 · Tick** (`../counter_10000_project/homework.pdf`)
- [ ] Clock distributor(클럭 분배)는 각 클럭 간 타이밍을 어떻게 맞추는지, clock skew는 어떻게 잡아내는지
- [ ] Vivado Implementation 옵션들의 의미
- [ ] 현업에서 tick(clock enable)을 쓰는 이유 : 클럭 분주로 카운터를 구성할 때의 문제점 vs tick의 장점
- [ ] 조합 회로와 순차 회로의 출력 특성 차이

**Reset · 동기화** (`../8bit_fnd_clk_project/*.pdf`, 10/6 Update)
- [ ] Sync vs Async reset 장단점, "비동기 assert · 동기 release" (reset synchronizer)
- [ ] Active-High vs Active-Low reset, Xilinx 7-Series FF 관점
- [ ] 버튼 같은 비동기 입력 처리 : 2-FF synchronizer + debounce

**문제 해결 경험 후보 (STAR)**
- [ ] 8bit Adder FND : Next-State 로직 버그 (`N_State = State` 고정 → case 천이 미반영) 발견·수정
- [ ] 8bit Adder FND : FND 잔상(ghosting) → 원인 분석 → 100 MHz → 1 kHz 분주로 해결, Duty 비교
- [ ] 8bit Adder FND : 보드 이상 → TB로 RTL 확인 → 물리 타이밍으로 원인 축소한 디버깅 절차
- [ ] Counter 10000 : 스위치 우선순위 (CLEAR > STOP > DOWN) 설계 · 경계값 검증
