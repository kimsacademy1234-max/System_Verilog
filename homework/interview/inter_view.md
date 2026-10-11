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
3. [문제 해결 경험](#3-문제-해결-경험)
4. [진행 중 토론](#진행-중-토론)
5. [토론 대기 질문](#토론-대기-질문)

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

## 3. 문제 해결 경험

<!-- STAR 템플릿
### P3-1. (프로젝트명) — (한 줄 요약)

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

- 없음

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
