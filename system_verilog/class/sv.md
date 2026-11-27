# SystemVerilog 수업 정리

> `class.md`에서 분리한 파일. 섹션 번호는 원본 번호 그대로 유지 (본문의 "1118 17번" 같은 참조가 그대로 맞도록). UVM 내용은 `uvm.md`.

| 날짜 | 주제 |
|---|---|
| [1104 (수)](#1104-수--class-기반-검증-환경) | Class 기반 검증 환경 · event · mailbox · fork-join · scheduling |
| [1105 (목)](#1105-목--sv-특징--crv--uvm--자료형) | SV 특징 · CRV · Verilog vs SV · queue · IPC · 8-bit register 실습 |
| [1106 (금)](#1106-금--counter-검증--race--assertion) | Race condition · counter256 검증 v1/v2 · 검증 작성 순서 · Assertion |
| [1109 (월)](#1109-월--hold-count--ram-검증--시험--uvm-발표) | Hold count 피드백 · RAM 검증 시나리오 · 타이밍 · scoreboard · 시험 |
| [1110 (화)](#1110-화--drive-방식--scheduling--transaction-공유--fifo) | blocking vs nonblocking drive · 출력 지연 · 스케줄링 다이어그램 (Verilog vs SV) · transaction 공유 · FIFO 설계 |
| [1111 (수)](#1111-수--fifo-검증--queue) | FIFO 검증 · 크기 제한 queue · queue로 FIFO 동작 만들기 · queue 메서드 |
| [1112 (목)](#1112-목--uart-tx-검증-플랜) | UART TX 검증 플랜 · 시나리오 · edge로 시작/종료 검출 · tick counter · mailbox in/out · 교수님 조언 |
| [1113 (금)](#1113-금--uart-tx-추가-검사--검사-스펙--커버리지) | start bit · interval · frame 길이 검사 · 기준점과 허용오차 · 0xAA/0x55 경계 조건 · 커버리지 |
| [1116 (월)](#1116-월--vcs--verdi--서버-시뮬레이션-flow) | VCS vs Verdi · 검증 flow (VCS → FSDB → Verdi) · 서버 실행 환경 |
| [1118 (수)](#1118-수--검증-툴--sv-자료형--package--static--class-심화-은닉화--상속--파라미터화) | 검증 툴 비교 · 동적/연관 배열 · clocking block · DPI · package · static vs automatic · `'1` · 매크로 · 은닉화 · 상속 · static 멤버 · `::` · extern · 파라미터화 class |
| [1119 (목)](#1119-목--2-state-vs-4-state--casting--typedef--enum--다형성--추상-class--uvm-개요) | 4-state vs 2-state · `$isunknown` · casting 4가지 · `signed'()` vs `-` · struct packed 쪼개기 · `$cast` · const · typedef · enum · `super` · 다형성 · up/downcasting · virtual · 추상 class |
| [1120 (금)](#1120-금--struct--union--packed-vs-unpacked-array--uvm-phase--sequence-driver-handshake--factory) | struct vs union · tagged union · packed vs unpacked array · array 합성 가이드 · 조회 함수 |
| [1123 (월)](#1123-월--명세서--취업-이야기--rtl-function--등호-연산자-6가지--block-label--unique--priority) | 명세서(spec) · 취업·포트폴리오 · RTL function 예 · 등호 연산자 6가지 · block label · unique / priority |
| [1124 (화)](#1124-화--interface--modport--interface-안의-functiontask--assertion--clocking-block) | interface 구성 · modport (접근 제한·질문 답변) · `.` vs `::` · interface 안의 function/task · assertion · 선언 위치 · clocking block (skew parameter · driver 타이밍) |

---

# 1104 (수) — Class 기반 검증 환경

> **핵심 한 줄** : 역할을 class로 나눠(OOP) **재사용성**을 높이고, 각 컴포넌트는 **event / mailbox**로 동기화한다(event driven).

| # | 목차 |
|---|------|
| 1 | 검증 환경 구조 |
| 2 | Class 기본 (handle · new · 동적 할당) |
| 3 | randomize & constraint |
| 4 | driver ↔ monitor 동기화 (event) |
| 5 | mailbox |
| 6 | fork-join 3종 (면접 단골) |
| 7 | Scheduling (Event Region) |
| 8 | 시뮬레이션 종료 |
| 9 | 면접 / 복습 포인트 |

---

## 1. 검증 환경 구조

### 1-1. 데이터 흐름

```
 generator ──(mailbox)──> driver ──> [interface] ──> DUT ──> [interface] ──> monitor ──(mailbox)──> scoreboard ──> PASS / FAIL
  (stimulus 생성)          (핀에 인가)                                       (핀 값 수집)                 (기댓값 비교)
                              │                                                 ▲
                              └──────────────── event (drv_done) ───────────────┘
                                                                                 └──> coverage (몇 % 검사했나)
```

### 1-2. 컴포넌트 역할

| 컴포넌트 | 역할 | 주요 도구 |
|---|---|---|
| transaction | 주고받을 데이터 묶음(벡터) 정의 | `rand` 변수, `constraint` |
| generator | stimulus(벡터) 생성 → driver로 전달 | `randomize()`, `mailbox.put()` |
| driver | transaction을 **핀 레벨 신호**로 바꿔 DUT에 인가 | `virtual interface`, `mailbox.get()` |
| interface | TB(SW) ↔ DUT(HW) 사이 신호 묶음 | `interface ... endinterface` |
| monitor | DUT 입출력 관찰 → transaction으로 다시 묶어 전달 | `@(event)`, `mailbox.put()` |
| scoreboard | 기댓값(reference model)과 비교 → PASS/FAIL | `mailbox.get()`, 카운터 |
| coverage | 검증을 **얼마나(%)** 했는지 측정 — SV에서 추가된 기능 | `covergroup`, `coverpoint` |
| environment | 위 컴포넌트 생성·연결·실행 | `new()`, `fork…join` |

### 1-3. 최종 목표

| 항목 | 내용 |
|---|---|
| 목표 | 시간마다 발생하는 값(이벤트)에 반응하는 **통합 검증 플랫폼** 구축 |
| 이유 | DUT·시나리오가 바뀌어도 컴포넌트만 교체/재사용 (환경은 다양해질 수밖에 없음) |
| 발전 방향 | class 기반 TB → UVM |

---

## 2. Class 기본

### 2-1. 핸들 → 생성 → 사용

| 단계 | 의미 | 문법 |
|---|---|---|
| ① 핸들 선언 | 객체를 가리킬 **변수**만 생김 (메모리 X, 값은 `null`) | `transaction tr;` |
| ② 생성 | `new` 호출 시 **동적 할당** + 초기화 | `tr = new();` |
| ③ 사용 | 접근 연산자 `.`으로 멤버/메서드 접근 | `tr.a`, `tr.randomize()` |

- `function new` : 생성자. 재정의(override)해서 **인자 전달·초기화**에 사용 (예: mailbox, virtual interface 연결)
- 사용자 `task` / `function` : 이 객체가 **무슨 일을 하는지** 정의 (예: `run()`)

### 2-2. OOP에서 가장 중요한 것 = 자료형

| 구분 | 정적 할당 (HW) | 동적 할당 (class 객체) |
|---|---|---|
| 시점 | elaboration 시 메모리 확정 | `new` 할 때 메모리 할당 |
| 특징 | 위치 고정, 리소스 계속 점유 | 필요할 때 생성, 참조 없으면 자동 회수(GC) |
| 예 | `module`, `interface` instance | `transaction`, `driver` 객체 |

### 2-3. 실행 순서

```
HW instance (module / interface)  →  initial begin  →  env = new(...) (동적 생성)  →  env.run() (task: 시간 제어 가능)
```

### 2-4. task vs function

| 구분 | function | task |
|---|---|---|
| 시간 소모 (`#`, `@`, `wait`) | 불가 | **가능** |
| 반환값 | 있음 (`void` 가능) | 없음 (output 인자로) |
| 용도 | 계산, `new`, 비교 | `run()`, 신호 구동, 대기 |

### 2-5. virtual interface

| 질문 | 답 |
|---|---|
| 왜 필요? | class(SW)는 HW인 interface를 직접 가질 수 없음 |
| 어떻게? | `virtual` 키워드로 interface의 **핸들**을 받아서 접근 |
| 연결 | top에서 실제 interface instance → env `new()` 인자 → driver/monitor로 전달 |

---

## 3. randomize & constraint

| 항목 | 의미 | 문법 예 |
|---|---|---|
| `rand` | `randomize()` 시 랜덤값 생성 대상 (중복 허용) | `rand bit [7:0] a;` |
| `randc` | 한 바퀴 돌 때까지 **중복 없이** 순환 | `randc bit [3:0] b;` |
| 범위 | 지정 범위 안에서만 | `a inside {[0:100]};` |
| 리스트 | 특정 값들 중에서만 | `a inside {1, 5, 10};` |
| 확률 `:=` | 범위 내 **각 값마다** 가중치 그대로 | `a dist {0 := 40, [1:3] := 60};` → 1,2,3 각각 60 |
| 확률 `:/` | 가중치를 범위 전체에 **나눠서** (% 개념) | `a dist {0 :/ 40, [1:3] :/ 60};` → 1,2,3 각각 20 |
| 결과 확인 | 실패 시 0 반환 → 체크 권장 | `if (!tr.randomize()) $error(...)` |

---

## 4. driver ↔ monitor 동기화 (event)

### 4-1. 문제 → 해결

| 구분 | 순차 방식 (문제) | event 방식 (해결) |
|---|---|---|
| 동작 | driver 끝 → `#10` 후 monitor 실행 | driver가 값 인가 후 **event 발생** → monitor가 즉시 캡처 |
| 시간 | 순차 시간이 **2배** | driver와 monitor가 **동시에** 진행 |
| monitor 시점 | 고정 간격마다 감지 | **driver 값이 바뀌었을 때만** 감지 |

### 4-2. 흐름

| 순서 | 주체 | 동작 |
|---|---|---|
| 1 | driver | `mailbox.get(tr)` → 핀에 값 인가 → `#10` (값 안정 대기) |
| 2 | driver | event 발생 `-> drv_done;` |
| 3 | monitor | `@(drv_done);` 로 catch → 핀 값을 읽어 transaction 생성 |
| 4 | monitor | `mon2scb_mbox.put(tr);` 로 scoreboard에 report |
| 5 | scoreboard | `mon2scb_mbox.get(tr);` → 기댓값 비교 → PASS/FAIL |

### 4-3. event 문법

| 문법 | 의미 | 주의 |
|---|---|---|
| `event e;` | event 선언 (driver·monitor가 **같은 핸들** 공유) | env에서 생성 후 둘에게 전달 |
| `-> e;` | event 발생 (trigger) | |
| `@(e);` | 발생할 때까지 대기 (edge 성격) | 같은 time step에 먼저 trigger되면 **놓침** (race) |
| `wait(e.triggered);` | 해당 time step 동안 발생 상태 유지 | race 회피용 |

---

## 5. mailbox

| 메서드 | 동작 | blocking 여부 |
|---|---|---|
| `new()` | 생성 (크기 지정 안 하면 무제한) | — |
| `put(tr)` | 넣기 | 가득 차면 대기 |
| `get(tr)` | 꺼내기 (빼감) | **비어 있으면 대기** → 자연스러운 동기화 |
| `peek(tr)` | 보기만 (안 빼감) | 비어 있으면 대기 |
| `try_get(tr)` | 꺼내기 시도 | 대기 X, 없으면 0 반환 |
| `num()` | 들어있는 개수 | — |

- 타입 지정 : `mailbox #(transaction)` → 다른 타입이 들어오는 실수 방지
- 연결 : env에서 mailbox 1개 생성 → 보내는 쪽/받는 쪽 `new()`에 **같은 핸들** 전달

---

## 6. fork-join 3종 (면접 단골 ★)

### 6-1. 기본 개념

| 구분 | 의미 |
|---|---|
| `begin … end` | **순차** 실행 (위에서 아래로, blocking) — 단점: 개별 동작이 어려움 |
| `fork … join` | 안의 문장/블록을 **병렬** 실행 |
| `forever` | 무한 루프. `fork` 안에 두면 다른 프로세스와 **병렬로 계속** 동작 (예: driver·monitor의 `run()`) |
| 실제 사용 | `fork` 안에 각 컴포넌트의 `begin…end`(순차)를 넣어 **섞어서** 사용 |

> 참고 : `forever` 자체는 병렬이 아니라 무한 반복일 뿐. 병렬성은 `fork`가 만든다.

### 6-2. 3종 비교

| 종류 | 언제 다음 줄로 넘어가나 | 용도 |
|---|---|---|
| `fork … join` | 안의 프로세스가 **모두** 끝나야 | 전부 완료를 기다릴 때 |
| `fork … join_any` | **하나라도** 끝나면 (나머지는 계속 실행) | timeout / 종료 조건 감시 |
| `fork … join_none` | **기다리지 않고 즉시** (프로세스는 백그라운드 실행) | 프로세스 띄워놓고 다른 일 하기 |

```
시간 →        0 ─────────────── 끝
a :           ■■■■■■■■■■
b :           ■■■■■■■■■■■■■■■■■■
join        :                    ▲ (a, b 모두 끝)
join_any    :          ▲ (a 끝나면 바로)
join_none   : ▲ (0ns에 바로)
```

| 보조 문법 | 의미 |
|---|---|
| `wait fork;` | `join_none` / `join_any`로 띄운 자식 프로세스가 다 끝날 때까지 대기 |
| `disable fork;` | 남아 있는 자식 프로세스 강제 종료 (`join_any` 후 정리용) |

### 6-3. 실행 예 (gen + drv를 fork)

| 컴포넌트 | 동작 |
|---|---|
| gen | `repeat(10)` → mailbox가 무제한이면 **0ns에 10개 모두 put 완료** |
| drv | `forever begin…end` 안에서 get → 구동 → 대기를 **순서대로** 반복 |

### 6-4. Race condition

| 항목 | 내용 |
|---|---|
| 현상 | 같은 시각에 실행되는 gen/drv **코드 간 우선순위는 알 수 없음** (LRM 규약 없음) |
| 이유 | CPU가 실제로 동시에 처리하는 게 아니라, 시뮬레이터가 한 time step 안의 프로세스를 **임의 순서**로 실행 |
| 보장되는 것 | **같은 `begin…end` 안**의 순서만 보장. 다른 class/프로세스 간 순서는 보장 X |
| 해결 | 조합논리성 동기화 → **event**, mailbox / 순차논리성 동기화 → **clk 엣지** (`@(posedge clk)`) |

---

## 7. Scheduling (Event Region)

> 한 time step은 여러 **region**으로 나뉘어 정해진 순서로 처리된다. race condition을 이해하는 기준.

| 순서 | Region | 실행되는 것 |
|---|---|---|
| 1 | Preponed | 값 샘플링 (`assert`, clocking block 입력 샘플) |
| 2 | **Active** | blocking 대입 `=`, 연속 대입 `assign`, `$display`, NBA의 **우변 계산** |
| 3 | Inactive | `#0` 지연된 문장 |
| 4 | **NBA** | non-blocking `<=` **좌변 갱신** |
| 5 | Observed | concurrent assertion 평가 |
| 6 | **Reactive** | `program` 블록 코드 실행 (TB 코드) |
| 7 | Re-Inactive | `program` 안의 `#0` |
| 8 | Re-NBA | `program` 안의 `<=` 갱신 |
| 9 | Postponed | `$monitor`, `$strobe` (값이 **최종 확정된 후** 출력) |

| 포인트 | 내용 |
|---|---|
| Active 안의 순서 | **보장 X** → 같은 region에 있는 프로세스끼리 race 발생 |
| `<=`를 쓰는 이유 | 우변 계산(Active)과 좌변 갱신(NBA)이 분리 → 순차논리 race 방지 |
| `$display` vs `$strobe` | `$display`는 Active(갱신 전 값일 수 있음), `$strobe`는 Postponed(확정 값) |
| TB를 Reactive로 | `program` / clocking block 사용 시 DUT(Active) 실행 후 TB가 동작 → race 회피 |

---

## 8. 시뮬레이션 종료

| 항목 | 내용 |
|---|---|
| `$finish` | **반드시** 써서 시뮬레이션 종료 (Synopsys 등 툴에서 `forever`가 있으면 안 끝남) |
| `$stop` | 일시정지 (GUI 디버깅용) — 종료가 아님 |
| 강제 종료 로직 | 버그로 무한 대기 시 대비 → **watchdog timeout** 권장 |
| 구현 아이디어 | `fork` 안에 [정상 종료 조건] + [`#TIMEOUT` 후 에러 메시지] 를 두고 `join_any` → 먼저 끝나는 쪽으로 탈출 → `disable fork` → `$finish` |
| 정상 종료 조건 예 | scoreboard 비교 횟수 == generator 생성 개수 |

---

## 9. 면접 / 복습 포인트

| 질문 | 한 줄 답 |
|---|---|
| class로 TB를 짜는 이유? | 역할 분담 → 재사용성·확장성 (DUT가 바뀌어도 컴포넌트 재사용) |
| 핸들과 객체의 차이? | 핸들은 가리키는 변수(메모리 X), `new` 해야 객체가 생성됨 |
| virtual interface를 쓰는 이유? | class(동적)가 interface(정적 HW)에 접근하기 위한 핸들 |
| task와 function 차이? | task만 시간 소모 가능 |
| `fork-join` / `join_any` / `join_none`? | 모두 대기 / 하나만 대기 / 대기 안 함 |
| race condition 원인과 해결? | 같은 time step·region 내 실행 순서 미보장 → event, mailbox, clk, `<=`, clocking block |
| `:=` vs `:/`? | 각 값마다 가중치 / 범위에 가중치 분배 |
| mailbox `get` vs `peek`? | 빼감 / 보기만 |
| `@(e)` vs `wait(e.triggered)`? | 같은 시각 trigger를 놓칠 수 있음 / 해당 time step 동안 감지 가능 |

---

# 1105 (목) — SV 특징 · CRV · UVM · 자료형

> **핵심 한 줄** : SV는 OOP로 TB를 **추상화·재사용**하고, CRV로 빠르게 검증하되 corner case는 coverage로 보완한다. 이를 표준화한 것이 **UVM**.

| # | 목차 |
|---|------|
| 1 | SV의 OOP 특징 |
| 2 | Constraint Random Verification (CRV) |
| 4 | Verilog vs SystemVerilog 주요 차이점 · **4-state 진리표** |
| 5 | 배열 자료형 & queue |
| 6 | 왜 fork-join + event인가 (IPC) |
| 7 | 실습 — 8-bit register 검증 |
| 8 | 면접 / 복습 포인트 |

---

## 1. SV의 OOP 특징

| 특징 | 의미 | SV에서 | TB 예시 |
|---|---|---|---|
| 객체화 | 데이터 + 동작을 하나의 **객체**로 묶음 | `class`, `new()` | transaction, driver 객체 |
| 역할 분담 | 컴포넌트마다 한 가지 일만 | class 분리 | gen / drv / mon / scb |
| 추상화 | 내부 구현은 숨기고 **무엇을 하는지**만 노출 | `task run()` | env는 `run()`만 호출 |
| 모듈화(캡슐화) | 독립 단위로 묶고 외부 접근 제한 | `local`, `protected` | 내부 카운터는 외부에서 못 건드림 |
| 상속 | 기존 class를 **확장**해 재사용 | `extends`, `super.` | `transaction` → `err_transaction` |
| 다형성 | 같은 핸들·같은 호출로 **다른 동작** | `virtual` 메서드 | 부모 핸들로 자식 `run()` 실행 |

---

## 2. Constraint Random Verification (CRV)

### 2-1. Directed vs CRV

| 구분 | Directed Test | Constraint Random (CRV) |
|---|---|---|
| 방식 | 사람이 입력값을 **하나하나 지정** | `constraint` 범위 안에서 **랜덤 생성** |
| 초기 비용 | 낮음 (바로 작성) | **env setup 시간이 존재** (gen/drv/mon/scb 구축) |
| 이후 속도 | 케이스마다 새로 작성 → 느림 | 구축 후엔 **많은 케이스를 빠르게** |
| 약점 | 사람이 생각 못 한 버그 놓침 | **corner case에서 100% 도달이 힘듦** |
| 진행 확인 | 작성한 케이스 수 | **functional coverage (%)** |

### 2-2. Coverage Driven Verification 흐름

```
CRV로 대량 검증  →  coverage 측정  →  구멍(미도달 corner case) 확인  →  constraint 조정 or directed test 추가  →  100% 목표
```

---

## 4. Verilog vs SystemVerilog 주요 차이점

| 구분 | Verilog | SystemVerilog |
|---|---|---|
| 목적 | **설계(RTL)** 중심 | 설계 + **검증** 통합 (HDVL) |
| 자료형 | `wire`, `reg` (4-state) | `logic`(wire/reg 통합), `bit`·`int`·`byte` (2-state), `enum`, `struct`, `typedef` |
| 배열 | 고정 크기 배열 | + **동적 배열** `[]`, **queue** `[$]`, **연관 배열** `[key]` |
| OOP | 없음 | `class`, 상속, 다형성, `new` 동적 할당 |
| 랜덤 | `$random` (제약 없음) | `rand` / `randc` + `constraint` + `randomize()` |
| 포트 묶음 | 포트 하나하나 연결 | `interface`, `modport`, clocking block |
| always 블록 | `always` 하나로 다 표현 | `always_comb`, `always_ff`, `always_latch` (의도 명시 → 툴이 검사) |
| 프로세스 동기화 | `fork…join` | + `join_any`, `join_none`, `event` 강화, `mailbox`, `semaphore` |
| 검증 기능 | 없음 | **assertion** (SVA), **functional coverage** (`covergroup`) |
| 연산자/문법 | 기본 | `++`, `+=`, `inside`, `unique`/`priority case`, `foreach` 등 |
| 패키지 | 없음 (`include` 사용) | `package` / `import` |
| 시뮬 스케줄 | Active / Inactive / NBA 중심 | + Observed, **Reactive** (program) 등 region 추가 |

### 4-1. 4-state 값 (★ 진리표 꼭 보기)

| 값 | 의미 | 언제 생기나 |
|---|---|---|
| `0` | 논리 0 | — |
| `1` | 논리 1 | — |
| `X` | unknown (알 수 없음) | 초기화 안 된 `logic`/`reg`, 다중 드라이버 충돌(0 vs 1) |
| `Z` | high-impedance (연결 끊김) | 아무도 구동 안 하는 `wire`, tri-state 출력 |

> 연산 입력으로 들어가면 **Z는 X처럼 취급**된다.

### 4-2. 진리표

**AND (`&`)** — 0이 하나라도 있으면 무조건 0

| & | 0 | 1 | X | Z |
|---|---|---|---|---|
| **0** | 0 | 0 | 0 | 0 |
| **1** | 0 | 1 | X | X |
| **X** | 0 | X | X | X |
| **Z** | 0 | X | X | X |

**OR (`\|`)** — 1이 하나라도 있으면 무조건 1

| \| | 0 | 1 | X | Z |
|---|---|---|---|---|
| **0** | 0 | 1 | X | X |
| **1** | 1 | 1 | 1 | 1 |
| **X** | X | 1 | X | X |
| **Z** | X | 1 | X | X |

**XOR (`^`)** — X/Z가 하나라도 있으면 무조건 X

| ^ | 0 | 1 | X | Z |
|---|---|---|---|---|
| **0** | 0 | 1 | X | X |
| **1** | 1 | 0 | X | X |
| **X** | X | X | X | X |
| **Z** | X | X | X | X |

**NOT (`~`)**

| 입력 | 0 | 1 | X | Z |
|---|---|---|---|---|
| **출력** | 1 | 0 | X | X |

### 4-3. 검증할 때 주의점

| 상황 | 결과 | 포인트 |
|---|---|---|
| `==` / `!=` 에 X·Z 포함 | 결과가 **X** | `if (X)`는 **거짓**으로 처리 → else로 빠짐 (FAIL을 PASS로 착각 가능) |
| `===` / `!==` | X·Z까지 **정확히 비교** → 항상 0 또는 1 | scoreboard에서 X 검출하려면 `===` 사용 |
| 4-state → 2-state 대입 (`logic` → `bit`) | X·Z가 **0으로 바뀜** | X가 숨어버려 버그를 못 찾음 |
| reset 전 레지스터 | 출력이 **X** | register 실습에서 reset을 먼저 거는 이유 |

---

## 5. 배열 자료형 & queue

### 5-1. 배열 4종 비교

| 종류 | 선언 예 | 크기 | 특징 / 용도 |
|---|---|---|---|
| 고정 배열 | `byte arr[8];` | 컴파일 시 고정 | Verilog와 동일 |
| 동적 배열 | `byte arr[];` | `new[n]`으로 실행 중 지정 | 크기 바꾸려면 다시 `new` |
| **queue** | `byte queue[$];` | **자동으로 늘고 줄음** | FIFO/스택, scoreboard 기댓값 저장 |
| 연관 배열 | `byte arr[int];` | 쓴 인덱스만 메모리 사용 | 메모리 모델처럼 듬성듬성한 주소 |

### 5-2. queue 메서드

| 메서드 | 동작 |
|---|---|
| `push_back(x)` | 뒤에 넣기 |
| `push_front(x)` | 앞에 넣기 |
| `pop_front()` | 앞에서 꺼내기 (FIFO) |
| `pop_back()` | 뒤에서 꺼내기 (스택) |
| `size()` | 원소 개수 |
| `insert(i, x)` / `delete(i)` | i번째에 삽입 / 삭제 (`delete()`는 전체 삭제) |
| `q[0]`, `q[$]` | 첫 원소 / 마지막 원소 |

### 5-3. queue vs mailbox

| 구분 | queue | mailbox |
|---|---|---|
| 정체 | 자료형 (배열) | class (통신 객체) |
| 비었을 때 꺼내면 | 대기 X (경고 + 기본값) | `get()`은 **대기** (blocking) |
| 용도 | 한 컴포넌트 **내부** 저장 | 컴포넌트 **간** 통신·동기화 |

---

## 6. 왜 fork-join + event인가 (IPC)

### 6-1. 핵심 아이디어

| 질문 | 답 |
|---|---|
| 왜 `fork-join`? | 객체(gen/drv/mon/scb)별로 **병렬화**해서 각자 독립적으로 동작시키기 위해 |
| 왜 event 제어? | 병렬 프로세스끼리 **제어권(이벤트)** 을 주고받아야 순서·타이밍이 맞음 |
| 이걸 뭐라고 부르나? | **IPC** (Inter-Process Communication, 프로세스 간 통신) |

### 6-2. IPC 방식 비교

| 방식 | 원리 | SV / UVM 예 |
|---|---|---|
| 메시지 전달 | 데이터를 **보내고 받음** | `mailbox` |
| 동기화 신호 | 데이터 없이 **"지금이야"** 만 알림 | `event` (+ `semaphore`) |
| shared memory | **key 값을 공유**해서 같은 저장소에 접근 | UVM `config_db` — 객체 관리를 **DB**로 함 |

| UVM에서 달라지는 점 | 내용 |
|---|---|
| 프레임워크가 해주는 것 | 객체 생성·연결·관리 (DB, factory, phase) |
| **우리가 할 것** | **시나리오**(sequence)와 **타이밍** 설계 |

> `fork … join_none` 동작은 1104 [6-2. 3종 비교](#6-2-3종-비교) 참고

---

## 7. 실습 — 8-bit register 검증

### 7-1. 목표 & 핵심 포인트

| 항목 | 내용 |
|---|---|
| DUT | 8-bit register (`posedge clk`에서 D → Q) |
| 핵심 | **D 읽는 시점**과 **Q 읽는 시점**을 다르게 해서 scoreboard에서 비교 |
| 기댓값 전달 | expected data(D) → **mailbox**로 scoreboard에 전달 |
| 주의 | 시뮬레이션 **race condition** — clk 기반이면 drv/mon의 **시점 결정**이 핵심 |
| reset | **reset task**를 따로 만들어 두면 reset 기능을 분리 → 재사용 가능 |

### 7-2. drv / mon 타이밍

| 주체 | 시점 | 이유 |
|---|---|---|
| driver | **상승 엣지** 이후 D 인가 | 엣지와 **같은 순간**에 D를 바꾸면 DUT가 새 값/이전 값 중 뭘 잡을지 race |
| monitor (D) | driver 인가 직후 | 이 값이 **기댓값** (1 clk 뒤 Q로 나와야 함) |
| monitor (Q) | **다음 상승 엣지** 이후 | register는 1 clk 지연 → 그때 Q가 확정됨 |
| scoreboard | 기댓값(D) vs 실제값(Q) 비교 | 같으면 PASS, 다르면 FAIL |

---

## 8. 면접 / 복습 포인트

| 질문 | 한 줄 답 |
|---|---|
| IPC란? 예시는? | 병렬 프로세스 간 통신 — `mailbox`, `event`, `semaphore`, shared memory(`config_db`) |
| clk 기반 TB에서 race를 피하려면? | drv는 엣지 이후 인가, mon은 확정된 시점에 샘플 (또는 clocking block) |
| register 검증에서 D·Q 읽는 시점이 다른 이유? | Q는 D보다 **1 clk 늦게** 나오기 때문 |
| OOP 4대 특징? | 캡슐화 · 추상화 · 상속 · 다형성 |
| 상속과 다형성 키워드? | `extends` / `virtual` 메서드 |
| CRV의 장단점? | 구축 후 빠르고 많은 케이스 / setup 시간 · corner case 도달 어려움 |
| corner case는 어떻게 잡나? | coverage로 구멍 확인 → constraint 조정 or directed test 추가 |
| UVM을 쓰는 이유? | 검증 환경 **표준화** → 팀·프로젝트 간 재사용 |
| sequencer 역할? | 여러 sequence의 item을 중재해서 driver로 전달 |
| factory란? | class 등록 후 코드 수정 없이 교체 생성하는 등록 관리자 |
| `logic` vs `wire`/`reg`? | `logic`은 둘을 통합 (단, 다중 드라이버는 `wire` 필요) |
| 2-state vs 4-state? | `bit`(0,1) / `logic`(0,1,X,Z) — 2-state는 빠르지만 X 검출 불가 |
| 동적 배열 vs queue? | 크기를 `new`로 지정 / 자동으로 늘고 줄음 |
| `1 & X`, `0 & X`, `1 \| X`? | X / **0** / **1** — 결과를 확정하는 값(AND의 0, OR의 1)이 있으면 X여도 결정됨 |
| `==` vs `===`? | X·Z 있으면 `==`는 X(if에서 거짓) / `===`는 X·Z까지 정확 비교 |

---

# 1106 (금) — Counter 검증 · Race · Assertion

> **핵심 한 줄** : counter256을 v1(단순 증가) → v2(run/stop/clear)로 확장하며, GEN의 **시간 제어와 종료 방식**을 설계한다. 반드시 일어나야 하는 사건은 **assert**로 체크한다.

| # | 목차 |
|---|------|
| 1 | Race condition |
| 2 | counter256 검증 v1 |
| 3 | counter256 검증 v2 (run · stop · clear) |
| 4 | 검증 작성 순서 |
| 5 | Assertion |

---

## 1. Race condition

| 항목 | 내용 |
|---|---|
| 정의 | 시뮬레이션에서 **누가 먼저 처리되느냐**에 따라 결과가 달라지는 문제 |
| 주의 | race를 피하려다 **클럭이 한 사이클씩 밀리는** 문제가 생길 수 있음 |

---

## 2. counter256 검증 v1

| 컴포넌트 | 내용 |
|---|---|
| GEN | 아직 자극 생성은 없음 — 보통 여기서 **gen count**로 횟수를 관리 |
| DRV | `preset` |
| MON | `posedge clk`에서 샘플 |
| SCB | rst `0` → 카운터 증가 / rst `1` → 카운터 초기화 |
| 종료 시점 | `join_any` |

> `++` 연산은 기본적으로 **블로킹** 연산이라 설계(RTL)에서는 사용하지 않는다.

---

## 3. counter256 검증 v2 (run · stop · clear)

**GEN — 어떻게 시간을 쓸 것인지**

| 방식 | 내용 | 고민 / 결론 |
|---|---|---|
| event trigger | event로 다음 동작을 진행 | `fork` - `join_any`를 **어떻게 탈출할지** 정해야 함 |
| enable 제어 (UVM 방식) | sequence start / stop을 `function`으로 제어 | 적용 검토 |
| **`fork` - `join_none`** | 돌려놓고 **외부에서 기다렸다가 제어** | 이 방식으로 설계해 보기로 함 |

---

## 4. 검증 작성 순서

| 단계 | 할 일 | 내 v2 TB 기준 |
|---|---|---|
| 1. seq_item | 신호 list 작성 | `reset` · `run_stop` · `mode` · `clear` · `count` |
| 2. 시나리오 | mode · run_stop · clear 시나리오 작성, **스케줄링을 어떻게 할지** 결정 | mode `0` up / `1` down, run_stop `1`일 때만 동작, clear는 동기 초기화 |
| 3. structure | 검증 환경 구조 잡기 | gen → drv → DUT → mon → scb |
| 4. timing | mon / drv / scb 타이밍 정하기 | drv는 `negedge`에 인가, mon은 `posedge`에 샘플 |

---

## 5. Assertion

| 항목 | 내용 |
|---|---|
| 의미 | **"반드시" 일어나야 하는 사건**을 체크 |
| 위치 | 체크하는 모듈, 인터페이스 모듈 등 — **모듈 설계 안에도** 넣음 |
| 예시 | tick 다음 몇 클럭 안에 나와야 한다 |
| 용도 | 디버깅 |

| 연산자 | 검사 시점 | 비유 |
|---|---|---|
| `\|->` | 조건이 성립한 **같은 클럭** (현재 시간) | 조합논리 |
| `\|=>` | 조건이 성립한 **다음 클럭** | 순차논리 |

---

# 1109 (월) — Hold Count · RAM 검증 · 시험 · UVM 발표

> **핵심 한 줄** : "N cycle 이상 유지"는 **hold count를 transaction에 넣어 랜덤화**하면 되고, RAM은 scoreboard에 **주소별 expected 버퍼(`logic` 배열)**를 두어 검증한다.

| # | 목차 |
|---|------|
| 1 | 숙제 피드백 — 3 cycle 이상 유지 |
| 2 | RAM 스펙 & 출력 방식 |
| 3 | RAM 검증 시나리오 |
| 4 | 타이밍 (drv / mon / scb) |
| 5 | Scoreboard 설계 |
| 6 | 시험 안내 |

---

## 1. 숙제 피드백 — 3 cycle 이상 유지

| 질문 | 결론 | 이유 |
|---|---|---|
| 무엇을 랜덤화하나? | **유지 cycle 수 자체**를 랜덤 변수로 만듦 | run_stop · mode · clear만 랜덤이면 "3 이상 연속"이 보장되지 않음 |
| 범위는? | `inside [3:256]`에서 시작 → 수업에서 **3 ~ 16**으로 조정 | 무한히 갈 수 없어 상한이 필요하고, 256은 한 번이 너무 길어 반복을 많이 못 봄 |
| 기준 신호는? | **run_stop**을 특정 cycle 이상 유지 | counter는 run일 때 동작하므로. mode까지 hold를 두면 복잡해져 하나씩 진행 |
| hold는 어디서? (driver? generator?) | **transaction 아이템에 hold count 추가** → generator에서 랜덤 생성 | 랜덤 변수는 transaction에 있어야 constraint를 걸 수 있음 |

**generator 설정**

| 항목 | 값 |
|---|---|
| `run_stop_hold` | 3 이상, 16 이하 |
| run_stop | 5 : 5 |
| mode | 5 : 5 |
| clear | 9 : 1 |

---

## 2. RAM 스펙 & 출력 방식

| 항목 | 내용 |
|---|---|
| addr | 6 bit (64개 번지) |
| data width | 8 bit |
| write | `we = 1`, `posedge clk`에서 저장 |
| read | `re = ~we` |
| reset | 없음 → 쓰지 않은 번지는 **X** |

| 출력 방식 | rdata가 나오는 시점 |
|---|---|
| **조합 출력** | ~we일 때 **바로** 나옴 (주소가 바뀌면 출력도 바뀜) |
| 순차 출력 | ~we일 때 **clk edge 뒤에** 나옴 |

---

## 3. RAM 검증 시나리오

| # | 시나리오 | 방법 |
|---|---|---|
| 1 | **모든 addr** 검사 | addr · wdata · we를 모두 랜덤으로 write / read test |
| 2 | **we = 1일 때만** RAM에 저장되는지 | we 랜덤 + scoreboard 비교 |
| 3 | **조합 출력** 방식 검증 | 아래 4장 타이밍으로 확인 |

---

## 4. 타이밍 (drv / mon / scb)

| 시점 | 동작 |
|---|---|
| `negedge` | **driver**가 입력 인가 |
| `posedge` | RAM에 write — **이때 써진 값도 monitoring** 해야 함 |
| `posedge` 이후 | monitor가 scoreboard로 전달 → **pass / fail 판정** |
| 다음 `negedge` | 다음 입력 인가 |

| 주의 | 내용 |
|---|---|
| drv 직후 event 전송 | 드라이브하자마자 monitor로 event를 보내면 **catch miss** 위험 → 지연 후 보내거나, race가 나도 잡히도록 설계 |
| 모니터링 시점 | 드라이브 이후인 것은 확실. 정확히 몇 ns 뒤로 할지는 설계자가 결정 |
| we = 1일 때 | monitor를 멈추지 않음. 그래야 scoreboard가 write 발생을 알 수 있음 (we가 랜덤이라 언제 쓸지 예측 불가) |

---

## 5. Scoreboard 설계

**we = 1일 때 저장해 둘 버퍼 데이터가 필요하다.**

| 질문 | 결론 | 이유 |
|---|---|---|
| 자료구조? | **64개 배열** | queue는 주소가 없어 부적절 (FIFO 구조) |
| 언제 저장? | `we = 1`일 때 **그 번지에 같이 write** | RAM과 똑같은 내용을 scoreboard도 가짐 |
| 언제 판정? | `we = 0`(read)일 때 buffer vs rdata 비교 | RAM에 잘 저장됐다면 read 값이 buffer와 같아야 함 |
| `byte` vs `logic`? | **`logic`** 배열 + `===` 비교 | 안 쓴 번지는 RAM이 X. 2-state `byte`는 0이 되어 일치하지 않음 |

**expected를 얻는 방법 (둘 다 가능)**

| 방법 | 구조 | 주의 |
|---|---|---|
| A. gen → scb | scb가 **mailbox 2개**(gen, mon)를 받아 비교 | rising edge 이후에 판정해야 하는 등 타이밍 제약이 생김 |
| B. mon만 사용 | we 0 / 1 모두 monitor가 올리고, scb가 1이면 저장 / 0이면 비교 | 버퍼와 판정 시점만 맞추면 비교적 단순 |

> 방법은 하나가 아니다. **왜 그렇게 했는지 타이밍까지 설명할 수 있으면 된다.**

---

## 6. 시험 안내

| 항목 | 내용 |
|---|---|
| 시간 | **2시간** (시간이 빠듯하다고 하심) |
| 일정 | 11/16 (녹음본 기준) |
| 형식 | ASM → **코드화**, **schematic 보고 코딩** + 개념 문제 |
| 범위 | Comparator · FIFO · UART · MUX · Synchronizer · FSM · 조합 / 순차 회로 |
| 개념 | race condition |

---

# 1110 (화) — Drive 방식 · Scheduling · Transaction 공유 · FIFO

> **핵심 한 줄** : blocking / nonblocking drive 중 무엇이 맞는지는 **시뮬레이터 스케줄링(time slot · region)**으로 판단한다. 인가와 샘플이 같은 edge에서 만나면 race가 생긴다.

| # | 목차 |
|---|------|
| 1 | nonblocking drive → blocking drive, 왜 해도 될까? |
| 2 | driver 코드 비교 |
| 3 | 출력 지연이 있는 경우 |
| 4 | 시뮬레이터 스케줄링 다이어그램 (Verilog vs SV) |
| 5 | Q&A — transaction 객체 공유 |
| 6 | FIFO 설계 (새 프로젝트) |

---

## 1. nonblocking drive → blocking drive, 왜 해도 될까?

**한 time slot 안의 처리 순서 (current → next)**

| 순서 | 영역 | 실행되는 것 |
|---|---|---|
| 1 | **Active** | blocking `=`, `assign`, `$display` |
| 2 | **NBA** | `<=` 갱신 — **FF 효과**를 줄 수 있음 |
| 3 | Postponed | 최종 값 확정 |
| → | next time slot | 다음 시간으로 이동 |

| 상황 | 결과 | 이유 |
|---|---|---|
| drv `negedge`, mon `posedge` | blocking drive여도 **문제 없음** | 인가와 샘플이 **서로 다른 time slot** → 순서 경쟁이 없음 |
| mon이 **같은 edge**에서 blocking으로 샘플 | **race 발생** | 인가와 샘플이 둘 다 **Active**에서 실행되고, Active 안의 순서는 보장되지 않음 |
| nonblocking drive | 같은 edge에서 샘플하는 쪽은 **갱신 전 값**을 읽음 | 값이 NBA에서 바뀜 → FF처럼 동작 |

> 따라서 **시뮬레이션의 스케줄링을 이해해야 한다.**

---

## 2. driver 코드 비교

**① blocking drive**

```systemverilog
class driver
	task run();
		forever begin
			@(negedge ram_vif.clk);
			gen2drv_mbox.get(tr);
			tr.debug_print("  DRV  ");
			ram_vif.we = tr.we;
			ram_vif.addr = tr.addr;
			ram_vif.wdata = tr.wdata;
			->mon_next_evt; // nba tiggered  혼합해서 못사용함
		end
```

**② nonblocking drive**

```systemverilog
	task run();
		forever begin
			@(negedge ram_vif.clk);
			gen2drv_mbox.get(tr);
			tr.debug_print("  DRV  ");
			ram_vif.we <= tr.we;
			ram_vif.addr <= tr.addr;
			ram_vif.wdata <= tr.wdata;
			->mon_next_evt; // nba tiggered  혼합해서 못사용함
		end
```

**event 트리거도 영역이 다르다 (보충)**

| 문법 | 트리거되는 영역 | 주의 |
|---|---|---|
| `->` | **Active** (즉시) | `<=` 인가와 섞으면, 깨어난 쪽이 **값이 갱신되기 전**에 읽을 수 있음 |
| `->>` | **NBA** | `<=` 갱신과 같은 영역에서 트리거됨 |

---

## 3. 출력 지연이 있는 경우

**문제** : DUT 출력에 지연이 있으면 `posedge + 1ns` 샘플이 통하지 않는다. 어떤 방법이 적절한가?

| 방법 | 장점 | 한계 |
|---|---|---|
| 출력 지연만큼 **똑같이 지연**을 줌 | 단순 | DUT 지연값을 알아야 하고, 바뀌면 TB도 수정 |
| nonblocking drv + blocking 샘플 조합 | 인가 쪽 race 해결 | 출력 지연 문제는 그대로 |
| **clocking block** (SV) | input skew로 edge **직전 값** 샘플, output skew로 edge **이후** 인가 | SV 문법을 추가로 익혀야 함 |

> SystemVerilog 시뮬레이터에는 이 문제를 위한 **clocking block**이 존재한다. (수업에서는 질문으로 남김 · 표의 장단점은 보충)

---

## 4. 시뮬레이터 스케줄링 다이어그램 (Verilog vs SV)

**Verilog (IEEE 1364) — stratified event queue**

```
[현재 time slot]

  Active  ◀──────┐   blocking =, assign, $display, <= 우변 계산
    │            │
    ▼            │
  Inactive ──────┤   #0
    │            │
    ▼            │
  NBA update ────┘   <= 좌변 갱신 (새 이벤트가 생기면 Active로 돌아감)
    │
    ▼
  Monitor            $monitor, $strobe (최종 값)
    │
    ▼
  Future             #지연 이벤트 → 다음 time slot
```

**SystemVerilog (IEEE 1800) — event region** (PLI 영역 생략)

```
[현재 time slot]

  Preponed               값 샘플 (assertion, clocking block 입력)
    │
    ▼
  ┌ Active  ◀─────┐      blocking =, assign, $display, <= 우변 계산
  │   │           │
  │   ▼           │
  │ Inactive ─────┤      #0
  │   │           │
  │   ▼           │
  └ NBA ──────────┘      <= 좌변 갱신           ← 설계(module) 영역
    │
    ▼
  Observed               concurrent assertion 평가
    │
    ▼
  ┌ Reactive ◀────┐      program 블록 코드, assertion action
  │   │           │
  │   ▼           │
  │ Re-Inactive ──┤      program 안의 #0
  │   │           │
  │   ▼           │
  └ Re-NBA ───────┘      program 안의 <=        ← 검증(TB) 영역
    │                    (새 Active 이벤트가 생기면 다시 Active로)
    ▼
  Postponed              $monitor, $strobe (최종 값)
    │
    ▼
[다음 time slot]
```

| 비교 | Verilog | SystemVerilog |
|---|---|---|
| 샘플 전용 영역 | 없음 | **Preponed** (edge 직전 값) |
| assertion 영역 | 없음 | **Observed** |
| TB 전용 영역 | 없음 → DUT와 TB가 같은 Active에서 경쟁 | **Reactive** set → DUT가 안정된 **후** TB 실행 |
| 결과 | race를 코딩 규칙으로 피해야 함 | 구조적으로 race 회피 가능 (`program`, clocking block) |

> 영역별 상세 설명은 [1104 · 7. Scheduling](#7-scheduling-event-region) 참고.
> 원본 그림: IEEE 1800-2017 **Figure 4-1** (Event scheduling regions), Cummings & Salz, *SystemVerilog Event Regions, Race Avoidance & Guidelines* (SNUG 2006)

---

## 5. Q&A — transaction 객체 공유

**질문** : 현재 코드에서 driver와 scoreboard가 mailbox에서 값을 **읽어오기만** 하는 상황이면, transaction 객체 하나를 공유해도 문제가 없나요? (값을 쓰면 문제가 될 것 같음)

| 항목 | 답 |
|---|---|
| 객체가 사라지나? | 아직 tr 객체가 사용되고 있으므로 **GC가 삭제하지 않는다** |
| 읽기만 할 때 | 문제 없음 |
| 다시 쓰는 구조일 때 | 같은 객체를 **공유**하므로 race condition이 발생할 수 있음 |
| 대응 (보충) | 쓰는 쪽이 있다면 객체를 **복사(새로 `new`)**해서 넘김 |

> 실제 환경과 유사하게 시뮬레이션하는 것이 좋다.

---

## 6. FIFO 설계 (새 프로젝트)

**FIFO vs LIFO**

| 구조 | 다른 이름 | 꺼내는 순서 |
|---|---|---|
| **FIFO** | queue | **먼저** 넣은 데이터가 먼저 나옴 |
| LIFO | stack | **나중에** 넣은 데이터가 먼저 나옴 |

### 6-1. FIFO 동작 모델링

> 직접 설계한 코드 : `system_verilog/lib/fifo.sv`

| # | 경우 | 동작 (내 `fifo.sv` 기준) |
|---|---|---|
| 0 | **초기 상태** (reset), push = 0, pop = 0 | wptr = rptr = 0, full = 0, **empty = 1** |
| 1 | **push only** | full이 아니면 write 후 wptr + 1, empty = 0. 다음 wptr이 rptr과 같으면 **full = 1** |
| 2 | **pop only** | empty가 아니면 rptr + 1, full = 0. 다음 rptr이 wptr과 같으면 **empty = 1** |
| 3 | **push / pop 동시** | full이면 pop만, empty면 push만, 그 외에는 wptr · rptr 둘 다 + 1 |

### 6-2. 비동기 FIFO

| 항목 | 내용 |
|---|---|
| 질문 | 비동기 FIFO는 어떻게 설계하는가? |
| 방법 | 포인터를 **gray code로 변환**해서 넘김 |
| 이유 (보충) | 읽기 · 쓰기 clock이 달라 포인터를 다른 clock domain으로 넘겨야 함. gray code는 한 번에 **1 bit만** 바뀌어 synchronizer로 넘겨도 값이 크게 틀어지지 않음 |
| 수업 메모 | 요즘엔 잘 안 쓴다 |

---

# 1111 (수) — FIFO 검증 · queue

> **핵심 한 줄** : FIFO의 expected 모델은 **queue**로 만든다. 크기를 제한한 queue에 한쪽으로 넣고 반대쪽으로 꺼내면 FIFO와 똑같이 동작한다.

| # | 목차 |
|---|------|
| 1 | queue 선언 (크기 제한) |
| 2 | queue로 FIFO 동작 만들기 |
| 3 | queue 기본 메서드 |

---

## 1. queue 선언 (크기 제한)

| 선언 | 크기 | 용도 |
|---|---|---|
| `ram[$]` | **무한대** (제한 없음) | 일반 버퍼 |
| `expected_fifo[$:3]` | **최대 4개** (인덱스 0 ~ 3) | FIFO 깊이(4)와 같은 expected 모델 |

> 보충 : 크기를 제한한 queue에 최대 크기를 넘게 넣으면 넘친 데이터는 버려진다.

---

## 2. queue로 FIFO 동작 만들기

**FIFO처럼 동작하려면? → 넣는 쪽과 꺼내는 쪽을 반대로**

| 넣기 | 꺼내기 | 결과 |
|---|---|---|
| `push_back()` | `pop_front()` | **FIFO** (먼저 넣은 것이 먼저 나옴) |
| `push_front()` | `pop_back()` | **FIFO** (방향만 반대) |
| 같은 쪽 (예: `push_back()` → `pop_back()`) | | LIFO (stack) |

---

## 3. queue 기본 메서드

| 메서드 | 동작 |
|---|---|
| `push_back()` | **뒤에서** 집어넣기 |
| `push_front()` | **앞에서** 집어넣기 |
| `pop_front()` | **앞에서** 꺼내기 |
| `pop_back()` | **뒤에서** 꺼내기 |
| `size()` | queue의 **현재 크기** 반환 |

> 전체 메서드는 [1105 · 5-2. queue 메서드](#5-2-queue-메서드) 참고.

---

# 1112 (목) — UART TX 검증 플랜

> **핵심 한 줄** : monitor가 **tx · tx_busy가 바뀌는 순간(edge)**을 잡아 시작 / 종료를 판단하고, 그 사이 tx를 bit 단위로 모아 기댓값과 비교한다. **왜 그 방법을 골랐는지** 설명할 수 있어야 한다.

| # | 목차 |
|---|------|
| 1 | 검증 플랜 구성 |
| 2 | 시나리오 |
| 3 | monitor — edge로 시작 / 종료 검출 |
| 4 | 이 방법이 유효한 이유 & 한계 |
| 5 | 데이터 수집 (tick counter) |
| 6 | scoreboard로 전달 |
| 7 | 교수님 조언 |

---

## 1. 검증 플랜 구성

| 항목 | 정할 것 |
|---|---|
| 시나리오 | 어떤 입력 상황을 만들 것인가 |
| 기댓값 산출 방법 | expected를 **언제, 어디서** 가져올 것인가 |
| monitor | 결과를 **언제** 읽고 **언제** scoreboard로 보낼 것인가 |

**타이밍 기준 (100 MHz, 9600 bps)**

| 항목 | 값 |
|---|---|
| 1 bit 시간 | 100,000,000 / 9600 ≈ **10416 clk** |
| 반 bit | **5208 clk** (bit 가운데를 읽기 위한 시간) |
| 한 프레임 | start 1 + data 8 + stop 1 = **10 bit** |

---

## 2. 시나리오

| # | 시나리오 | 방법 |
|---|---|---|
| 1 | **reset** | assertion으로 확인 : `rst \|=>` 다음 클럭에 초기값 |
| 2 | **normal case** | start · tx_data **random** |
| | | start는 **1 clock** 펄스, **negedge drive** |
| | | **tx_busy가 0일 때만** start |
| | | busy가 끝나고 start를 주는 시간을 **random**하게 → start 시점을 조작할 필요가 있음 |
| 3 | **busy 중 start** | tx_busy = 1일 때 start = 1 발생 주기를 **random**하게 |

> 보충 : `uart_tx.sv`의 reset 초기값은 **tx = 1 (idle)**, **tx_busy = 0**이다. assertion에서 어떤 신호를 0으로 볼지 구분할 것.

---

## 3. monitor — edge로 시작 / 종료 검출

**transaction에 넣을 내부 저장 변수 필요 (expect data)** → `bit [7:0] reg_tx_data`

| 순서 | 할 일 |
|---|---|
| 1 | **시작 시점**(`posedge + 1ns`, tx_busy 0 → 1 · tx 1 → 0)에 tx_data를 기댓값으로 받아옴 → **xor gate**로 변화 검출 |
| 2 | 그 이후 tick counter로 결과값 저장 |
| 3 | count == 9이면 기댓값 · 결과값을 mailbox에 put |

**edge 검출** : 이전 값과 현재 값을 xor → 바뀌었으면 1

| 구간 | tx (이전 → 현재) | tx_busy (이전 → 현재) | tx edge | busy edge | 동작 |
|---|---|---|---|---|---|
| **시작** | 1 → 0 | 0 → 1 | **1** | **1** | 기댓값 저장, 수집 시작 |
| 데이터 | 1 → 0 / 0 → 1 / 유지 | 1 유지 | 0 또는 1 | 0 | 수집만 |
| **종료** | 1 → 1 (stop bit) | 1 → 0 | **0** | **1** | 기댓값 · 결과 전송 (mon2scb) |

```
<시작 시점>
                11111000000
tx_buff         ____‾‾‾____          tx 1 → 0
                0000011111
busy_buff       ____‾‾‾____          busy 0 → 1
→ tx_buff && busy_buff == 1 일 때만 기댓값을 가져온다

<종료 시점>
                11111111111
tx_buff         ___________          tx 1 유지
                1111100000
busy_buff       ____‾‾‾____          busy 1 → 0
→ tx_buff == 0 && busy_buff == 1 → 기댓값 전송 (mon2scb)
```

---

## 4. 이 방법이 유효한 이유 & 한계

| 항목 | 내용 |
|---|---|
| 시작 | start 신호 → `posedge`에서 **busy 0 → 1, tx 1 → 0**이 동시에 바뀜 → 이 순간이 monitor 시점 |
| 종료 | **busy 1 → 0, tx 1 → 1** (stop bit 유지) |
| 결론 | **바뀐 순간을 체크해야** 정확한 검증이 됨 |
| 기댓값 시점 | `posedge + 1` · tx_busy == 0 · tx 1 → 0일 때 `reg_tx_data = uart_vif.tx_data` (바로 transaction에 저장 X) |
| **한계** | **tx_busy에 오류가 있으면?** → 시작 / 종료 판단이 틀어짐. 이것도 기댓값 산출에 넣어야 함 |
| 대응 | 기댓값은 **tx_start** 시점에, 결과는 busy · tx로 → mailbox를 **in / out 2개**로 분리 (6장) |

---

## 5. 데이터 수집 (tick counter)

```
logic [7:0] compare_tx_data
bit [$clog2(10416/2):0] tick_counter
int count  -> 0~9   (0 : start / 1~8 : data 수집 / 9 : done)
```

| count | 구간 | 동작 |
|---|---|---|
| 0 | start bit | **무시** |
| 1 ~ 8 | data bit | `compare_tx_data = {tr.tx, compare_tx_data[7:1]}` (LSB부터 들어오므로 오른쪽으로 shift) |
| 9 | stop bit | done → 6장으로 |

> 보충 주의 : tick을 **5208 clk마다** 세면 count 1칸이 **반 bit**가 되어 bit 경계에서 읽게 된다. 시작 후 **5208 clk 한 번**(start bit 가운데)을 기다린 뒤에는 **10416 clk마다** 읽어야 매 bit의 가운데를 읽는다.

---

## 6. scoreboard로 전달

**count == 9이면 기댓값 · 결과값을 mailbox에 put**

```
if(count == 9) begin
    tr.expect_data  = reg_tx_data;
    tr.compare_data = compare_tx_data;
    tr.busy = uart_vif.busy;
    ...
    mon2scb.put(tr);
end
```

**mailbox 2개로 분리**

| mailbox | 보내는 것 | 시점 |
|---|---|---|
| `mon2scb_in` | 기댓값 (입력 tx_data) | tx_start |
| `mon2scb_out` | 결과값 (받은 data) | 프레임 수신 완료 |

> tx_start + tx_busy + tx **조합**으로 판단한다.

---

## 7. 교수님 조언

| 조언 | 내용 |
|---|---|
| 방법 선택의 이유 | **왜 그 방법을 택했는지**, 어떤 방법들이 있었고, **왜 그 방법을 선택할 수밖에 없었는지** 설명할 수 있어야 함 |
| 면접 | 내가 했던 것을 **꼬치꼬치 다** 물어봄 |

---

# 1113 (금) — UART TX 추가 검사 · 검사 스펙 · 커버리지

> **핵심 한 줄** : 검사 스펙을 잡으려면 **기준점**과 **허용오차**부터 정한다. 데이터 값뿐 아니라 **시간 성분**(start bit 유지, frame 길이, interval)도 검사하고, 경계 데이터(0xAA, 0x55)로 커버리지를 채운다.

| # | 목차 |
|---|------|
| 1 | 추가 검사 항목 |
| 2 | 검사 스펙 — 기준점 & 허용오차 |
| 3 | 경계 조건 데이터 (0xAA · 0x55) |
| 4 | 커버리지 계획 |

---

## 1. 추가 검사 항목

| 검사 | 내용 | 기준점 |
|---|---|---|
| **start bit 유지** | start bit가 0으로 **1 baud time 동안 유지**되는지 | tx 1 → 0 |
| **interval** | 다음 start까지 interval **clock 수만큼** 적용됐는지 | **tx_busy의 negedge** |
| **frame 길이** | tx_busy 구간 = frame 길이가 맞는지 (**시간 성분**) | tx_busy 0 → 1 ~ 1 → 0 |
| **stop bit** | stop bit 에러를 어떻게 볼까? → **01010101 (0x55)** 전송 | 마지막 data bit → stop bit 경계 |

---

## 2. 검사 스펙 — 기준점 & 허용오차

> 검사 스펙을 잡는 것 = **기준점을 잡고, 허용오차를 잡는다.**

| 기준 | 허용오차 | 값 (100 MHz, 9600 bps) |
|---|---|---|
| bit 하나 (baud time) | **baud time × 1/16** = **1 tick** | 10416 clk 중 ±651 clk |
| frame 전체 (10 bit) | **±½ baud time** — 10 bit 중 얼마나 밀렸는지 판단 | 104160 clk 중 ±5208 clk |

**frame 길이 판정식**

```
baud_time × 10 − ½ baud_time  ≤  측정한 frame 길이  ≤  baud_time × 10 + ½ baud_time
```

---

## 3. 경계 조건 데이터 (0xAA · 0x55)

UART는 **LSB부터** 보낸다. start bit = 0, stop bit = 1.

| data | 2진수 | LSB | MSB | 전송 순서 (start · D0~D7 · stop) | 의미 |
|---|---|---|---|---|---|
| **0xAA** | 1010_1010 | **0** | **1** | 0 · 0101_0101 · 1 | LSB = start bit, MSB = stop bit와 **같음** → 경계에서 tx가 **안 바뀜** |
| **0x55** | 0101_0101 | **1** | **0** | 0 · 1010_1010 · 1 | LSB · MSB가 start · stop bit와 **다름** → 경계마다 tx가 **바뀜** |

| 확인할 것 | 쓰는 데이터 | 이유 |
|---|---|---|
| start / stop bit 길이를 edge로 측정 | **0x55** | start → D0, D7 → stop 경계에서 edge가 생김 |
| edge 없이도 bit를 구분하는지 | **0xAA** | 경계에서 값이 같아 edge가 없음 → 타이밍만으로 맞게 읽어야 함 |

---

## 4. 커버리지 계획

| 대상 | 경계 조건 |
|---|---|
| **tx_data** | 0xAA, 0x55 (3장) |
| **interval** | **interval == 0** (busy가 끝나자마자 바로 start) |

---

# 1116 (월) — VCS · Verdi · 서버 시뮬레이션 flow

> **핵심 한 줄** : **VCS**로 컴파일·시뮬레이션해서 **FSDB**를 만들고, **Verdi**로 FSDB 파형을 보며 디버깅한다. 모든 작업은 **서버**에서 (MobaXterm으로 접속) 실행한다.

| # | 목차 |
|---|------|
| 1 | VCS vs Verdi |
| 2 | 검증 flow |
| 3 | 실행 환경 |

---

## 1. VCS vs Verdi

| 툴 | 역할 | 출력 / 특징 |
|---|---|---|
| **VCS** | **컴파일 + 시뮬레이션** 실행 | **tcl 기반 log** 출력, 파형 파일 **FSDB를 꼭 만들어야 함** |
| **Verdi** | **파형 보는 용** (디버깅) | FSDB를 읽어서 파형 확인, 코드 수정까지 가능 |

> **FSDB** = VCS 시뮬레이션 결과 파형 파일. 이게 없으면 Verdi에서 볼 게 없다.

---

## 2. 검증 flow

```
설계 ─▶ VCS (컴파일 / 시뮬레이션) ─▶ FSDB 생성 ─▶ Verdi (파형 디버깅, 코드 수정) ─▶ 설계 재검증
  ▲                                                                                   │
  └───────────────────────────────────────────────────────────────────────────────────┘
```

| 단계 | 하는 일 | 결과물 |
|---|---|---|
| 1. 설계 | RTL / TB 작성 | `.v` / `.sv` |
| 2. VCS | 컴파일 → 시뮬레이션 실행 | log, **FSDB** |
| 3. Verdi | FSDB 파형 보며 디버깅, 코드 수정 | 수정된 코드 |
| 4. 재검증 | 다시 VCS 돌려서 확인 | 새 FSDB |

---

## 3. 실행 환경

| 항목 | 내용 |
|---|---|
| **실행 위치** | **서버**에서 실행 (로컬 X) |
| **접속 툴** | **MobaXterm** |

---

# 1118 (수) — 검증 툴 · SV 자료형 · package · static · class 심화 (은닉화 · 상속 · 파라미터화)

> **핵심 한 줄** : SystemVerilog를 **전부** 지원하는 시뮬레이터는 3대 EDA 회사(Synopsys · Cadence · Siemens) 툴이고, Vivado는 **일부만** 지원한다. SV 검증에는 **동적 배열 · 연관 배열 · clocking block · DPI**가 쓰이고, 공통 정의는 **package**로 묶어서 `import`한다. class는 **`local`(자기만) / `protected`(자식까지)**로 멤버를 숨기고, `extends`로 상속한다. class의 **`static` 멤버는 모든 객체가 공유**하고, **파라미터화 class**는 타입을 바꿔 끼워 재사용한다 (UVM의 `uvm_driver #(item)`). UVM은 mailbox 대신 **TLM**(함수 호출로 핸들 전달)을 쓴다.

| # | 목차 |
|---|------|
| 2 | 검증 툴 비교 |
| 3 | 동적 배열 vs 연관 배열 |
| 4 | clocking block · DPI |
| 5 | package 예시 & 해석 |
| 6 | package 더 알아보기 (담을 수 있는 것 · 참조 방법 · explicit vs wildcard) |
| 7 | static vs automatic |
| 8 | SV 시간 단위 · step |
| 9 | `'0` `'1` `'x` `'z` — 폭에 맞춰 채우기 |
| 10 | 현재 폴더 `macro_demo.sv` 해석 — 매크로 |
| 11 | 데이터 은닉화 — `local` |
| 12 | 상속 — `local` vs `protected` |
| 13 | class의 `static` 멤버 (exam_05) |
| 14 | `::` 연산자 정리 |
| 15 | `extern` — method 몸체를 밖에서 정의 (exam_06) |
| 16 | 파라미터화 class (exam_07) |

---

## 2. 검증 툴 비교

| 회사 | 툴 | 용도 | SystemVerilog 지원 범위 |
|---|---|---|---|
| **Synopsys** | **VCS / Verdi** | VCS = 컴파일·시뮬레이션, Verdi = 파형 디버깅 (FSDB) | **전체 지원** — 설계 + 검증(class, randomize, coverage, assertion), UVM |
| **Cadence** | **Xcelium** | 시뮬레이션 (디버깅은 SimVision 등) | **전체 지원** — 설계 + 검증, UVM |
| **Siemens** | **Questa** (구 Mentor) | 시뮬레이션 + 디버깅 | **전체 지원** — 설계 + 검증, UVM |
| **AMD (Xilinx)** | **Vivado** | **FPGA** 합성·구현 + 내장 시뮬레이터(XSim) | **일부 지원** — 합성은 **합성 가능한 SV만**, XSim은 class·randomize·UVM 일부 지원, 커버리지 등은 **제한적** |

> 3대 EDA 회사 툴 = 칩 회사 **실무 검증용**. Vivado = **FPGA 개발용**이라서 검증 기능이 상대적으로 약하다.

---

## 3. 동적 배열 vs 연관 배열

| 구분 | **동적 배열** (dynamic array) | **연관 배열** (associative array) |
|---|---|---|
| 선언 모양 | `int arr[];` — **크기 비워둠** | `int arr[string];` — **[ ] 안에 index 타입** |
| 크기 | 선언할 때 **사이즈 지정 X** → 실행 중에 **`new[크기]`**로 메모리 할당 | 크기 개념 없음 — **값을 넣는 순간** 그 칸이 생김 |
| index | 0, 1, 2 … **연속된 정수** | **이름(key)**으로 접근 가능 ex) `arr["class1"]` |
| 메모리 | `new` 한 크기만큼 한 번에 잡힘 | **쓴 칸만** 잡힘 → 넓은 주소 범위를 듬성듬성 쓸 때 유리 |
| 자주 쓰는 메서드 | `size()`, `delete()` | `num()`/`size()`, `exists()`, `delete()`, `first()`/`next()` |
| 쓰임 | 개수가 실행 중에 정해지는 데이터 (패킷 payload 등) | 메모리 모델(주소 → 데이터), 이름별 점수표 등 |

> 참고 — 앞에서 배운 **queue**(`[$]`)는 앞/뒤로 넣고 빼기(push/pop) 전용, 동적 배열은 **크기를 정해서 한 번에 할당**.

---

## 4. clocking block · DPI

| 기능 | 무엇인가 | 왜 쓰나 |
|---|---|---|
| **clocking block** | 특정 clock 기준으로 **신호를 묶고**, 입력을 언제 샘플링할지 / 출력을 언제 drive할지(**skew**)를 지정하는 블록. 주로 **interface 안에** 선언 | TB ↔ DUT 사이 **race condition 방지** (1110 스케줄링 내용과 연결) — driver/monitor가 clock 기준으로 안전하게 drive·sample |
| **DPI** (Direct Programming Interface) | SV에서 **C 함수를 직접 호출** (`import "DPI-C"`), 반대로 C에서 SV 함수 호출(`export`)도 가능 | C로 짠 **reference model**(알고리즘, 골든 모델)을 그대로 가져와 scoreboard에서 비교 |

---

> **Q. clocking block으로 보낼 때 skew를 주는 건 알겠는데, DUT는 clock edge에서 바뀌니까 interface가 일부러 지연해서 출력을 받겠다는 거지?**
> **A. 반은 맞음.** 지연(뒤로 미루기)은 **TB가 보내는 쪽(output skew)**이고, **받는 쪽(input skew)은 반대로 edge 직전(앞)으로 당겨서** 샘플함. 두 방향 모두 목적은 하나 → **TB를 진짜 플립플롭처럼 동작시켜 같은 edge에서 race가 안 나게**
> - **output skew (TB → DUT)** : `cb.d <= 1` 하면 핀은 **edge + skew 후**에 바뀜 → DUT는 **이번 edge에서는 옛 값**, **다음 edge에서 새 값**을 잡음 (실제 FF의 clock-to-Q 지연과 같은 역할)
> - **input skew (DUT → TB)** : `#1step` = **edge 바로 직전 값**(Preponed)을 샘플 → DUT가 이번 edge에서 바꾼 출력은 **이번 샘플에 안 들어가고 다음 edge 샘플**에 보임 (다음 단 FF가 edge 직전 값을 잡는 것과 같음)
> - 즉 interface가 DUT 출력을 "늦게 받는" 게 아니라 **edge 직전에 확정된 값만 받는** 것 → 결과적으로 TB 입장에선 한 사이클 뒤에 보임
> - skew가 없으면 : 같은 edge에서 DUT의 `q <= d`와 TB의 샘플·drive가 섞여서 **실행 순서에 따라 결과가 달라짐** (1110 race 내용)
>
> **확인 예제** (D 플립플롭, clk 주기 10ns, posedge = 5·15·25ns, Verilator 5.051 실행)
> ```systemverilog
> clocking cb @(posedge clk);
>     default input #1step output #2;   // 입력: edge 직전 값, 출력: edge 후 2ns
>     output d;
>     input  q;
> endclocking
> // DUT : always_ff @(posedge clk) q <= d;
> // TB  : @(vif.cb); vif.cb.d <= 1;  이후 매 edge 마다 vif.cb.q 출력
> ```
> | 시각 | 일어난 일 |
> |---|---|
> | 5ns (edge) | TB `cb.d <= 1` |
> | 7ns | 핀 `d` → 1 (**output skew #2** 만큼 뒤) |
> | 15ns (edge) | DUT가 `d=1`을 잡아서 핀 `q` → 1 / 그런데 TB `cb.q` 샘플 = **0** (핀은 이미 1) |
> | 25ns (edge) | TB `cb.q` 샘플 = **1** (한 edge 뒤에 보임) |

---

> **Q. 왜 edge 이후의 값을 안 받음? edge 이후에는 값이 불안정할 수도 있어서?**
> **A. 실제 하드웨어 기준으로는 맞음, 시뮬레이션에서는 "불안정"보다 "아직 안 정해짐(순서 문제)"이 이유**
> - **하드웨어** : edge 직후는 FF 출력이 바뀌는 중(clock-to-Q 지연, 조합 논리 glitch) → 값이 흔들리는 구간. 그래서 FF는 **edge 직전에 안정된 값**을 잡음 (= **setup time**을 지켜야 하는 이유)
> - **시뮬레이션(RTL)** : 지연 0이라 물리적으로 흔들리지는 않음. 대신 **같은 시각(edge) 안에서 실행 순서**가 문제
>   - LRM은 **영역(region) 사이 순서만** 정하고, **같은 영역 안 process(always / initial) 순서는 안 정함** → 시뮬레이터마다(파일·모듈 순서, 최적화에 따라) 다름
>   - 예) DUT `always_ff @(posedge clk) q <= d;` + TB `@(posedge clk); d = 1;`(blocking) → 둘 다 edge의 Active 영역에서 깨어남 → DUT가 먼저면 `q=0`, TB가 먼저면 `q=1` (**race**)
>   - 읽는 쪽도 같음 : TB가 Active에서 읽으면 옛 값, `program`(Reactive)·`@(q)` 등 NBA 뒤에서 읽으면 새 값 → 읽는 위치에 따라 결과가 달라짐
>   - edge 직전(Preponed) 값은 **이전 시각에 이미 끝난 값**이라 순서와 상관없이 항상 같음 → 결과가 하나로 정해짐
> - **의미상으로도 맞음** : edge 직후 값은 "이번 edge의 **결과**" = 다음 사이클 값. DUT 안의 다음 단 FF도 edge 직전 값을 잡으므로, TB(monitor)도 똑같이 잡아야 **실제 회로가 보는 값과 같은 시점**으로 검증됨
> - 참고 : `input #0`으로 바꾸면 edge 시각의 Observed 영역(NBA 후)에서 샘플 → 새 값을 받음. 가능은 하지만 기본(`#1step`)을 바꿀 이유가 있을 때만 씀

---

> **Q. edge 이후에는 NBA가 이미 끝났을 텐데, DUT 출력을 edge 이후로 지연해서 받으면 문제가 됨?**
> **A. 문제 없음.** NBA가 끝난 뒤 읽으면 값이 하나로 정해져서 **race 없음** → 실제로 많이 쓰는 방식. `#1step`(edge 직전)이 **기본값인 이유**가 따로 있을 뿐
> - edge 이후 샘플 방법 : monitor를 `@(negedge clk)`에서 샘플 / `@(posedge clk); #1;` 후 샘플 / clocking block `input #0`(Observed 영역 = NBA 후)
> - `#1step`을 기본으로 쓰는 이유
>
> | 이유 | edge 이후 샘플 | edge 직전 샘플 (`#1step`) |
> |---|---|---|
> | 지연 값 고르기 | RTL(지연 0)은 `+1ns`면 충분, **게이트 레벨**(clock-to-Q + 조합 지연)은 `+1ns`에 아직 바뀌는 중일 수 있음 → 회로마다 안전한 지연을 따로 정해야 함 | 타이밍 맞는 회로(setup 만족)면 **항상 안정된 값** → 회로 무관하게 그대로 사용 |
> | TB drive와 겹침 | TB도 edge 이후에 다음 입력을 drive → 샘플이 drive보다 앞/뒤인지 신경 써야 함 (조합 출력이면 방금 넣은 **다음 사이클 입력이 섞인 값**을 읽을 수 있음) | 샘플 = edge **직전**, drive = edge **이후** → 둘이 절대 안 겹침 |
> | 다른 것과 시점 맞추기 | DUT·SVA와 보는 시점이 다름 | DUT 안 FF, **SVA(assertion, Preponed 샘플)**와 같은 시점 → monitor와 assertion이 같은 사이클에 같은 값을 봄 |
>
> - **정리** : RTL 검증만 하면 edge 이후 샘플도 OK. 단 **사이클 해석이 다름** → edge 직전 = 이번 edge **이전** 값, edge 이후 = 이번 edge의 **결과** 값 → **한 TB 안에서는 한 가지로 통일**

---

> **Q. clocking block은 edge에서 동작하는 것?**
> **A. 맞음.** 모든 동작이 **선언한 clock edge 하나**(`clocking cb @(posedge clk)`)가 기준점. skew는 따로 기다리는 지연(`#2` 문장)이 아니라 **edge에서 앞/뒤로 떨어진 거리(오프셋)**
>
> | 동작 | 일어나는 시점 |
> |---|---|
> | `@(vif.cb)` | posedge clk 올 때까지 대기 |
> | `vif.cb.q` 읽기 | edge **− input skew**에 샘플해 둔 값 (`#1step` = edge 바로 직전) |
> | `vif.cb.d <= 1` | edge **+ output skew**에 핀에 반영 |
> | 사이클 중간에 `cb.d <= 1` 실행 | 바로 안 바뀌고 **다음 edge + skew**에 반영 |
>
> - TB 코드가 언제 실행되든 DUT와 주고받는 시점은 **항상 edge 주변의 정해진 지점** → driver·monitor가 `@(vif.cb)` 기준으로만 움직이면 race 없음

---

> **Q. output skew를 `#0`으로 하기도 함?**
> **A. 많이 씀. 오히려 기본값**: skew를 안 쓰면 `default input #1step output #0`
> - `#0`이면 `cb.d <= 1`이 **edge와 같은 시각**의 **Re-NBA 영역**(DUT NBA보다 뒤)에서 핀에 반영 → DUT는 이번 edge에선 옛 값, 다음 edge에 새 값 → `#2`와 결과 같고 race 없음
> - 그래도 양수 skew(`#1`, `#2`)를 주는 경우
>   - **파형 보기** : `#0`이면 입력이 clk edge와 정확히 같은 시각에 바뀌어 "이번 edge에 잡혔나?" 헷갈림
>   - **게이트 레벨 / 타이밍 시뮬** : 실제 FF는 **hold time**(edge 후 입력 유지 시간)이 있어서, edge에 딱 맞춰 바뀌면 hold 위반 → hold보다 큰 skew
>   - **실제 회로 흉내** : 앞단 FF의 clock-to-Q 지연
> - **정리** : RTL 검증은 `#0`(기본)으로 충분, 게이트 레벨·파형 가독성이 필요하면 작은 양수 skew

---

> **Q. `output #0` 이면 DUT NBA가 끝난 뒤에 출력(TB → DUT) 값이 전달되는 것?**
> **A. 맞음.** 같은 edge 시각 안 순서
>
> | 순서 | 영역 | 일어나는 일 |
> |---|---|---|
> | 1 | Preponed | TB가 `cb.q` 샘플 (edge 직전 값, `#1step`) |
> | 2 | Active | DUT `always_ff`가 **옛 `d`**를 읽고 `q <= d` 계산 |
> | 3 | NBA | DUT `q`가 새 값으로 (**DUT 출력 갱신**) |
> | 4 | Reactive | TB 코드 실행 (`program` 블록 등) |
> | 5 | **Re-NBA** | TB `cb.d <= 1`이 핀에 반영 (**clocking block output 전달**) |
>
> - 5번에서 `d`가 바뀌면 같은 시각 안에서 **다시 Active로 돌아가** 그 값에 영향받는 것들을 계산 → DUT **조합 논리**(`assign c = d;`)는 바로 새 값, **FF**는 edge가 다시 안 오니 그대로
> - `output #2`처럼 양수 skew면 edge 시각이 아니라 **edge + 2ns라는 별도 시각**에 일어남 → DUT NBA와 순서를 따질 필요조차 없음

---

> **Q. `output #0` + `input #1step`이면 한 사이클 안에 결과를 다 볼 수 있는 것?**
> **A. DUT 출력이 조합일 때만.** FF 출력은 `#0`이어도 **2 edge 뒤**에 보임 → output skew는 "사이클 안에서 언제 바뀌냐"만 바꾸고, **몇 번째 edge에 잡히는지는 안 바꿈**
>
> 확인 (Verilator 5.051, clk 주기 10ns, posedge = 5·15·25ns, 5ns edge에서 `cb.d <= 1`, DUT 출력 FF `q <= d` / 조합 `c = d`)
>
> | 시각 | 일어난 일 | `cb.q` (FF) | `cb.c` (조합) |
> |---|---|---|---|
> | 5ns (edge) | 핀 `d` → 1 (**5ns에 바로**, `#0`) | | |
> | 15ns (edge) | DUT FF가 `d=1`을 잡아 핀 `q` → 1 | **0** | **1** |
> | 25ns (edge) | | **1** | 1 |
>
> - 조합 : 5ns에 넣고 15ns(다음 edge) 샘플에서 바로 보임 → 1사이클
> - FF : DUT가 15ns에 잡음 → TB는 15ns에 edge 직전 값(0) 샘플 → **25ns에 보임** (`output #2` 실험과 같은 결과)
> - 실제 회로의 "입력 FF → DUT FF → 다음 단 FF" 지연과 같은 정상 동작 → scoreboard 기대값 비교 시 **DUT 레지스터 단수만큼 지연을 맞춰야 함**

---

> **Q. DUT의 NBA가 TB의 Re-NBA보다 왜 먼저임? (왜 우선순위가 있음?)**
> **A. "DUT라서" 우선이 아니라, SV가 스케줄러를 일부러 설계 쪽 / TB 쪽 두 묶음으로 나눠서 순서를 정해 둔 것** → TB ↔ DUT race를 **문법 구조로** 없애려고 (Verilog에는 없던 영역, SV에서 추가)
>
> | 묶음 | 영역 | 여기서 실행되는 코드 |
> |---|---|---|
> | **Active 묶음 (설계)** | Active → Inactive → **NBA** | `module` 안 코드 (`always`, `assign`, `<=` 갱신) = DUT |
> | **Reactive 묶음 (TB)** | Reactive → Re-Inactive → **Re-NBA** | `program` 블록 코드, clocking block drive(`cb.d <=`) = TB |
>
> - 규칙 : **Active 묶음이 더 할 일이 없을 때까지 다 끝나야** Reactive 묶음으로 넘어감 → DUT가 이번 edge의 새 상태를 **먼저 다 계산해서 확정**
> - 그다음 TB가 **확정된 DUT 값을 보고** 반응(Reactive) → TB가 바꾼 값을 반영(Re-NBA)
> - Re-NBA에서 바뀐 값 때문에 DUT 쪽에 할 일이 생기면 → **같은 시각 안에서 다시 Active로** (조합 논리가 바로 새 값이 되는 이유) → 더 할 일이 없으면 다음 시각으로
> - 같은 원리의 작은 버전 = **NBA가 Active 뒤에 있는 이유** : 모든 FF가 Active에서 **옛 값을 먼저 다 읽고**, NBA에서 **한꺼번에 갱신** → 실제 회로에서 FF들이 같은 edge에 동시에 바뀌는 것을 흉내. Re-NBA는 이걸 TB ↔ DUT 사이로 한 번 더 적용한 것
> - ⚠️ TB를 `module`로 짜고 clocking block 없이 `d <= 1` 하면 → TB도 **Active 묶음**(같은 NBA 영역)이라 DUT와 우선순위 차이 없음. 이때는 "Active에서 다 읽고 NBA에서 갱신" 규칙 덕분에만 안전 (blocking `d = 1`이면 race)

---

## 5. package 예시 & 해석

**package = 여러 파일이 같이 쓰는 정의(typedef, parameter, function, class)를 한 곳에 모아두는 이름 공간**

```systemverilog
// ① package 정의 — uart_pkg.sv
package uart_pkg;

    parameter int BAUD_RATE = 9600;                 // 공통 상수

    typedef enum logic [1:0] {                      // 공통 타입
        IDLE, START, DATA, STOP
    } state_e;

    function automatic logic parity(logic [7:0] d); // 공통 함수
        return ^d;
    endfunction

    class transaction;                              // 공통 class
        rand logic [7:0] tx_data;
    endclass

endpackage


// ② package 사용 — tb_uart_tx.sv
module tb_uart_tx;

    import uart_pkg::*;                // uart_pkg 안의 모든 것 가져오기

    transaction tr;                    // package의 class 바로 사용
    state_e     st;                    // package의 enum 타입 사용

    initial begin
        tr = new();
        tr.randomize();
        $display("baud=%0d parity=%b", BAUD_RATE, parity(tr.tx_data));
        $display("baud=%0d", uart_pkg::BAUD_RATE);  // import 없이 :: 로 직접 지정도 가능
    end

endmodule
```

**구문 해석**

| 구문 | 의미 |
|---|---|
| `package uart_pkg; … endpackage` | `uart_pkg`라는 이름 공간을 만들고 그 안에 공통 정의를 넣음 |
| `parameter int BAUD_RATE` | 모든 파일이 같은 값을 쓰게 하는 공통 상수 |
| `typedef enum … state_e` | 상태 이름을 타입으로 정의 → DUT/TB가 같은 상태 이름 공유 |
| `function automatic …` | 공통 함수. `automatic` = 호출할 때마다 변수를 새로 잡음 (재귀·동시 호출 안전) |
| `class transaction` | TB 컴포넌트들(gen/drv/mon/scb)이 같이 쓰는 transaction 정의 |
| `import uart_pkg::*;` | package 안의 **모든** 이름을 현재 scope로 가져옴 → 이름만으로 사용 |
| `uart_pkg::BAUD_RATE` | import 없이 **`package이름::항목`**으로 하나만 직접 지정 (`::` = scope 연산자) |

**주의할 점**

| 항목 | 내용 |
|---|---|
| **컴파일 순서** | package 파일을 **사용하는 파일보다 먼저** 컴파일해야 함 (VCS 파일 목록에서 앞에 둘 것) |
| **`include` vs `import`** | `include` = 파일 내용을 그대로 **복사 붙여넣기**, `import` = 이미 컴파일된 package에서 이름을 **가져다 씀** |
| **이름 충돌** | `*`로 import한 이름과 현재 scope 이름이 같으면 **현재 scope 쪽이 우선** → 헷갈리면 `pkg::이름`으로 명시 |

---

> **Q. package 파일을 따로 저장해서 sv 파일에서 불러올 때 `include` 방식을 쓰는 것 같은데, 예시는?**
> **A. 조금 다름.** package 파일 자체는 `include`로 불러오지 않고 **따로 컴파일 + `import`**. `include`는 **package 안에서** class 파일들을 끌어 모을 때 씀 (UVM TB의 표준 구조)
>
> **방식 ① 기본 : package 파일 따로 컴파일 → `import`** (위 예시와 같은 구조)
> ```text
> filelist.f              ← 순서 중요 : package 가 먼저
>   uart_pkg.sv
>   uart_tx.sv            (DUT)
>   tb_uart_tx.sv         (import uart_pkg::*;)
> ```
> - 실행 : `vcs -sverilog -f filelist.f` (Vivado는 `xvlog`에 같은 순서로)
> - 순서를 거꾸로(`tb_uart_tx.sv` 먼저) 하면 → `Reference to 'transaction' before declaration` 오류 (Verilator 5.051 확인)
>
> **방식 ② UVM식 : package 파일 하나가 class 파일들을 `include`** ★ 실무에서 제일 많이 봄
> ```text
> tb/
>   uart_pkg.sv        ← package 껍데기 (컴파일 목록에는 이것만)
>   transaction.sv     ← class 하나씩 파일로
>   driver.sv
> ```
> ```systemverilog
> // tb/uart_pkg.sv
> package uart_pkg;
>     parameter int BAUD_RATE = 9600;
>     function automatic logic parity(logic [7:0] d); return ^d; endfunction
>
>     `include "transaction.sv"    // 파일 내용이 이 자리에 그대로 복사됨
>     `include "driver.sv"         // driver 가 transaction 을 쓰므로 순서도 transaction 먼저
> endpackage
>
> // tb/transaction.sv
> `ifndef TRANSACTION_SV            // include guard : 두 번 include 돼도 한 번만 들어가게
> `define TRANSACTION_SV
> class transaction;
>     rand logic [7:0] tx_data;
> endclass
> `endif
>
> // tb/driver.sv
> `ifndef DRIVER_SV
> `define DRIVER_SV
> class driver;
>     function void drive(transaction tr);           // 같은 package 안이라 import 없이 바로 사용
>         $display("drive %h parity=%b", tr.tx_data, parity(tr.tx_data));
>     endfunction
> endclass
> `endif
>
> // tb/tb_uart_tx.sv
> module tb_uart_tx;
>     import uart_pkg::*;          // 사용하는 쪽은 방식 ①과 똑같이 import
>     transaction tr;  driver drv;
>     initial begin
>         tr = new();  drv = new();
>         tr.tx_data = 8'h5A;
>         drv.drive(tr);           // → drive 5a parity=0
>         $display("baud=%0d", BAUD_RATE);   // → baud=9600
>     end
> endmodule
> ```
> ```text
> filelist.f
>   +incdir+tb           ← `include "transaction.sv" 를 tb/ 폴더에서 찾으라는 뜻
>   tb/uart_pkg.sv       ← class 파일(transaction.sv, driver.sv)은 목록에 넣지 않음
>   tb/tb_uart_tx.sv
> ```
> - 장점 : class마다 파일을 나눠서 관리 + 쓰는 쪽은 `import` 한 줄. UVM의 `uvm_pkg`도 이 구조 (`uvm_pkg.sv` 안에서 수백 개 파일을 `include`)
> - ⚠️ class 파일을 filelist에 **또 넣으면** 안 됨 → package 밖에 같은 이름 class가 하나 더 생겨서 **다른 타입**이 됨 (핸들 대입 시 타입 불일치 오류)
>
> **방식 ③ (비추천) : 쓰는 파일마다 package 파일을 `include`**
> ```systemverilog
> `include "uart_pkg.sv"           // tb 파일 맨 위
> module tb; import uart_pkg::*; ... endmodule
> ```
> - 파일 하나만 그렇게 하면 동작은 함. 하지만 **두 파일 이상**이 각각 `include` 하면 package가 **두 번 정의**됨 → `Duplicate declaration of package: 'uart_pkg'` (Verilator 5.051 확인)
> - package는 "한 번 컴파일해서 여러 곳에서 `import`" 하라고 만든 것 → 방식 ①·②로
>
> | | `include` | `import` |
> |---|---|---|
> | 동작 | 전처리 단계에서 **파일 내용 복사** | 컴파일된 package에서 **이름만 가져옴** |
> | 대상 | 아무 파일 (class, 매크로 `.svh` 등) | **package**만 |
> | 주로 쓰는 곳 | **package 안**에서 class 파일 모으기, 매크로 파일(`uvm_macros.svh`) | **모듈·class** 안에서 package 사용 |

---

> **Q. class 파일 맨 위 `` `ifndef `` 하는 이유는?**
> **A. include guard = 같은 파일이 두 번 `include` 돼도 내용은 한 번만 들어가게 막는 장치.** `include`는 무조건 복사라서, 두 번 들어가면 같은 class가 두 번 정의됨 → 오류
> ```systemverilog
> `ifndef TRANSACTION_SV      // 1) TRANSACTION_SV 라는 매크로가 아직 없으면 (= 처음 include)
> `define TRANSACTION_SV      // 2) 매크로를 만들어 "이미 들어왔음" 표시
> class transaction; ... endclass
> `endif                      // 3) 두 번째 include 때는 매크로가 있으니 ifndef ~ endif 사이를 통째로 건너뜀
> ```
> - 확인 (Verilator 5.051, package 안에서 같은 파일을 2번 `include`)
>
> | | 결과 |
> |---|---|
> | guard 없음 | `Duplicate declaration of CLASS 'transaction'` 오류 |
> | guard 있음 | 정상 컴파일 (두 번째는 빈 내용) |
>
> - 언제 두 번 들어감? : 파일이 많아지면 실수로 겹침
>   - `driver.sv` 안에서도 `` `include "transaction.sv" `` 하고, package에서도 `include` 하는 경우
>   - 여러 파일이 공통 매크로 파일(`defines.svh`)을 각자 `include` 하는 경우
> - 위 ② 예시처럼 package에서 한 번씩만 `include` 하면 guard 없어도 동작함 → **안전장치로 습관처럼 붙이는 것** (UVM 라이브러리 파일도 전부 `` `ifndef UVM_..._SVH `` 로 시작)
> - 규칙
>   - 매크로 이름은 **파일마다 겹치지 않게** → 보통 파일 이름을 대문자로 (`transaction.sv` → `TRANSACTION_SV`)
>   - `` `define`` 은 컴파일 전체에 남음 → 한 번 들어간 class 파일은 **다른 package에 또 `include` 해도 안 들어감** (어차피 다른 package에 넣으면 이름만 같은 **다른 타입**이 되므로 하면 안 되는 구조)
> - C 언어 헤더의 `#ifndef` / `#define` / `#endif` 와 같은 원리

---

## 6. package 더 알아보기

### 6-1. package 방식

> `import` 하면 **그 scope 안**(그 안의 class·function·begin 블록까지)에서 모두 쓸 수 있다. **UVM도 같은 방식** (`import uvm_pkg::*;`)
>
> ⚠️ 메모의 "하위에서 모두 쓸 수 있다"에서 **하위 = 그 scope 안쪽**이라는 뜻. 그 모듈이 **인스턴스한 하위 모듈에는 전달되지 않는다** → 하위 모듈 파일에서도 각자 `import` 해야 함 (그래서 UVM 파일마다 `import uvm_pkg::*;`가 붙어 있음).

| 위치 | 방법 | 권장 |
|---|---|---|
| **모듈 안** | `module tb; import pkg::*; …` → 그 모듈 안에서만 보임 | ✅ **권장** — 영향 범위가 그 모듈로 한정 |
| 모듈 밖 | 파일 맨 위(`$unit`)에 `import pkg::*;` → 그 뒤에 컴파일되는 코드 전체에 보임 | 가능은 하지만 어디까지 영향 가는지 헷갈림 |

### 6-2. package에 담을 수 있는 것 vs 없는 것

| 담을 수 있는 것 ✅ | 담을 수 없는 것 ❌ |
|---|---|
| `parameter` / `localparam` (공용 상수) | `module` · `interface` · `program` **인스턴스** |
| `typedef` (enum, struct …) | `initial` / `always` 블록 |
| `function` / `task` | `assign` (연속 할당) |
| `class` | 다른 모듈 신호 **계층 참조** (`top.dut.sig` 같은 것) |
| 다른 package `import` | — |

| 주의 | 이유 |
|---|---|
| **package 안의 `parameter`는 바깥에서 재정의 불가** | 설정값이 아니라 **공용 상수** → 사실상 `localparam`과 같음 |
| **package 안에 변수는 쓰지 않는다** | package 변수는 **static 하나**를 모든 사용처가 **공유** → 누가 언제 바꿨는지 추적이 어려움 |

### 6-3. package를 참조하는 방법

| # | 방법 | 모양 | 특징 |
|---|---|---|---|
| 1 | **scope resolution** | `pkg::BAUD_RATE` | import 없이 **매번 package 이름을 붙여** 씀 |
| 2 | **explicit import** | `import pkg::BAUD_RATE;` | **필요한 이름 하나만** 가져옴 |
| 3 | **wildcard import** | `import pkg::*;` | **전부** 가져옴 → **실무에서 가장 많이 씀** |
| 4 | 모듈 헤더 import | `module m import pkg::*; (포트…);` | **포트 선언**에서도 package 타입을 쓰고 싶을 때 |

> 메모에는 1~3번만 있어서, 4번(모듈 헤더 import)은 보충한 것.

### 6-4. explicit import vs wildcard import

| 비교 | **explicit** (`import pkg::name;`) | **wildcard** (`import pkg::*;`) |
|---|---|---|
| **가져오는 시점** | import 하는 **즉시** 그 이름을 가져옴 | 미리 가져오지 않고 **그 이름이 실제로 쓰일 때** 가져옴 |
| **같은 이름의 지역 선언** | 지역에 같은 이름을 선언하면 **에러** (충돌) | **지역 선언이 우선** → package 쪽 이름은 가려짐 |
| **두 package에 같은 이름** | 두 package에서 같은 이름을 explicit import 하면 **에러** | 그 이름을 **안 쓰면 OK**, 쓰는 순간 **어느 쪽인지 모호 → 에러** |
| **겹치면?** | 바로 에러 → 일찍 발견 | 지역 선언에 **조용히 가려질 수** 있음 → `pkg::이름`으로 명시해서 해결 |
| **추천 용도** | 몇 개만 쓸 때, 이름 충돌을 확실히 막고 싶을 때 | UVM처럼 **많이 가져다 쓰는** package (`uvm_pkg::*`) |

---

## 7. static vs automatic

| 구분 | **static** | **automatic** |
|---|---|---|
| 비유 | 전역변수처럼 | 지역변수처럼 |
| 생기는 시점 | 시뮬레이션 시작 때 **한 번** | function/task가 **불릴 때마다 새로** 생김 |
| 사라지는 시점 | 시뮬레이션 끝까지 유지 → **이전 호출 값이 남음** | 호출이 끝나면 **메모리에서 삭제** |
| 동시 호출·재귀 | 변수 하나를 같이 써서 **값이 꼬임** | 호출마다 따로라서 **안전** |

**지정 안 하고 선언하면? — 위치에 따라 다름 (직접 돌려서 확인)**

| 선언 위치 | 기본값 | 같은 함수 3번 호출 (안에서 `c = 0; c++` 후 return) |
|---|---|---|
| **module / package** 안의 function·task | **static** | `1 2 3` → 값이 남아서 누적 |
| `function automatic` 으로 명시 | automatic | `1 1 1` |
| **class** 안의 method | **automatic** | `1 1 1` |

> 메모의 "지정 안 하고 선언 시 automatic"은 **class method일 때만** 맞음. module·package 함수는 **static이 기본**이라서 package 함수에는 `automatic`을 붙여 쓰는 게 관례 (5번 예시의 `function automatic`).

**Q. 지역변수(automatic)는 메모리 어디에 잡히나?**

| 종류 | 할당 위치 (개념) | 언제 |
|---|---|---|
| static 변수 | 프로그램 전체에서 쓰는 **고정 영역** (C의 전역/데이터 영역 같은 곳) | elaboration 때 한 번 |
| automatic 변수 | 호출할 때마다 만드는 **호출 프레임** (C의 스택 프레임 같은 것) | 호출 시 생성 → return 시 해제 |
| class 객체 | **heap** (동적 메모리) | `new()` 할 때 생성, 아무도 핸들을 안 가지면 시뮬레이터가 회수 |

> 실제 위치는 시뮬레이터 구현 몫. task는 `#`, `@`로 **중간에 멈출 수** 있어서, 시뮬레이터는 호출 프레임을 return 할 때까지 따로 살려둔다 (C의 스택처럼 바로 버리지 않음).

---

## 8. SV 시간 단위 · step

| 항목 | 내용 | 예 |
|---|---|---|
| **시간 단위 직접 지정** | Verilog는 `#10`처럼 숫자만 쓰고 단위는 `timescale`을 따름. SV는 **숫자에 단위를 붙일 수 있음** | `#10ns`, `#2.5us`, `#100ps` |
| **step** | **정밀도(time precision) 1단위** | `1step` |
| step 쓰임 | **clocking block**에서 많이 씀 → `input #1step` = clock edge **바로 직전 값**을 샘플 | 1110 스케줄링 · 4번 clocking block과 연결 |

---

## 9. `'0` `'1` `'x` `'z` — 폭에 맞춰 채우기

| 표기 | 뜻 | 8비트에 넣으면 |
|---|---|---|
| `'0` | 모든 비트 0 | `0000_0000` |
| `'1` | 모든 비트 1 | `1111_1111` |
| `'x` | 모든 비트 x | `xxxx_xxxx` |
| `'z` | 모든 비트 z | `zzzz_zzzz` |

> 장점: **폭을 안 적어도** 변수 폭에 맞춰 채워짐 → parameter로 폭이 바뀌어도 코드를 안 고쳐도 됨. (Verilog에서는 `{WIDTH{1'b1}}`처럼 써야 했음)

**실무에서 쓰는 예**

| 코드 | 쓰는 곳 | 설명 |
|---|---|---|
| `assign full = (q == '1);` | FIFO full, 카운터 최대값 검출 | q가 **모든 비트 1**(최대값)인지 비교 |
| `if (!rst_n) q <= '0;` | 리셋 | 폭과 상관없이 0으로 초기화 |
| `assign bus = oe ? data : 'z;` | 3상태(tri-state) 버스 | 출력 안 할 때 버스를 놓아줌 (high-Z) |
| `mask = '1;` | 비트 마스크 | 전부 켠 마스크에서 시작 |
| `data = 'x;` | TB 초기값 / 의미 없는 구간 | 값이 안 정해진 걸 파형에서 바로 보이게 → 잘못 쓰면 x가 퍼져서 버그 발견 |

> ⚠️ `q == 1`과 `q == '1`은 다르다. `1`은 값 1(`0000_0001`), `'1`은 **전부 1**(`1111_1111`). (q = `1111_1111`일 때 `q == 1` → 0, `q == '1` → 1, 직접 돌려서 확인)

---

## 10. 현재 폴더 `macro_demo.sv` 해석 — 매크로(`` `define ``)

| 매크로 | 정의 | 쓰인 기법 |
|---|---|---|
| `` `SHOW(v) `` | `` $display(`"v = %0d`",v) `` | **`` `" ``** = 문자열 안에서도 인자 `v`를 치환 (stringify) |
| `` `MSG(s) `` | ``$display(`"name is `\`"s`\`"`")`` | **`` `\`" ``** = 문자열 안에 **큰따옴표(`"`) 자체**를 넣음 |
| `` `FF(n) `` | ``logic [3:0] n``_d, n``_q;`` | **` `` `** (백틱 2개) = 토큰 **이어 붙이기** → `n`이 `state`면 `state_d`, `state_q` |

| 코드 | 매크로가 펼쳐진 모양 | 출력 (직접 돌려서 확인) |
|---|---|---|
| `` `FF(state) `` | `logic [3:0] state_d, state_q;` | (신호 2개 선언) |
| `` `SHOW(count); `` | `$display("count = %0d", count);` | `count = 7` |
| `` `MSG(alu); `` | `$display("name is \"alu\"");` | `name is "alu"` |
| `state_d = 4'd9; state_q = state_d;` 후 `` `SHOW(state_q); `` | `$display("state_q = %0d", state_q);` | `state_q = 9` |

> 매크로는 컴파일 전에 **글자 그대로 바꿔치기**만 함 (함수 호출 X). 그래서 변수 **이름**을 문자열로 찍거나(`SHOW`), 신호 **이름**을 만들어내는(`FF`) 것이 가능.

---

> **Q. 매크로는 자주 쓰이는 건가?**
> **A. 검증(TB·UVM)에서는 매우 자주, RTL에서는 제한적으로.** 직접 만들기보다 **라이브러리가 만든 매크로를 가져다 쓰는** 경우가 대부분
>
> | 분야 | 사용 빈도 | 대표 예 |
> |---|---|---|
> | **UVM** | ★★★ 매일 씀 | `` `uvm_component_utils(driver) `` (factory 등록), `` `uvm_info / `uvm_error `` (로그 출력), `` `uvm_field_int(addr, UVM_ALL_ON) `` |
> | **TB 공통** | ★★ | include guard (`` `ifndef ``), 로그·비교 매크로 (`` `CHECK(a, b) `` 같이 팀에서 만들어 씀), `` `ifdef `` 로 디버그 출력 켜고 끄기 |
> | **RTL** | ★ 제한적 | `` `ifdef SIM `` / `` `ifdef FPGA `` 조건부 컴파일, assertion 매크로, 회사 공통 FF 매크로 |
>
> - 이 데모의 기법이 실제로 쓰이는 곳
>   - **`` `" `` (stringify)** : UVM 매크로 내부. `` `uvm_field_int(addr, …) `` 가 출력할 때 `"addr"` 라는 **이름 문자열**을 만드는 데 사용 → 우리가 직접 쓸 일은 적고 **라이브러리 안**에 있음
>   - **` `` ` (이어 붙이기)** : 신호/타입 이름 자동 생성. 일부 회사·오픈소스 RTL이 `` `FF(q, d, rst) `` 같은 FF 매크로로 `always_ff` 반복을 줄임
>   - **`` `\`" ``** : 드묾
> - RTL에서 덜 쓰는 이유 : 매크로는 **전역**(파일·모듈 구분 없음)이라 이름이 겹치면 다른 파일 동작까지 바뀜, 에러 위치가 펼쳐진 코드 기준이라 디버깅이 어려움
> - 그래서 역할을 나눔
>
> | 하고 싶은 것 | 쓰는 것 |
> |---|---|
> | 상수 (폭, 깊이) | `parameter` / `localparam` (모듈마다 따로, override 가능) → `` `define `` 보다 우선 |
> | 반복 계산 | `function` |
> | 이름 자체를 만들거나 문자열로 찍기, 조건부 컴파일, include guard | **매크로만 가능** |
>
> - 정리 : UVM 수업부터는 `` `uvm_... `` 매크로를 계속 보게 됨 → **"코드가 펼쳐지는 것"** 이라는 이 데모 개념을 알면 UVM 매크로가 하는 일을 이해하기 쉬움

---

> **Q. `` `uvm_component_utils `` 매크로는 실제로 어떻게 선언되어 있나?**
> **A. 매크로 2개를 부르는 껍데기 매크로.** factory 등록용 `type_id` + 이름을 돌려주는 함수를 class 안에 **찍어 넣음**
> - 출처 : Accellera UVM 원본 `src/macros/uvm_object_defines.svh` (IEEE 1800.2 버전, GitHub `accellera-official/uvm-core`)
>
> **① 껍데기**
> ```systemverilog
> `define uvm_component_utils(T) \
>    `m_uvm_component_registry_internal(T,T) \
>    `uvm_type_name_decl(`"T`")
> ```
> - `` `"T`" `` = 위 10번 표의 **stringify** → `T`가 `base_driver`면 문자열 `"base_driver"`
> - 줄 끝 `\` = 매크로를 다음 줄까지 이어서 정의
>
> **② factory 등록 부분**
> ```systemverilog
> `define m_uvm_component_registry_internal(T,S) \
>    typedef uvm_component_registry #(T,`"S`") type_id; \
>    static function type_id get_type(); \
>      return type_id::get(); \
>    endfunction \
>    virtual function uvm_object_wrapper get_object_type(); \
>      return type_id::get(); \
>    endfunction
> ```
>
> **③ 이름 함수 부분**
> ```systemverilog
> `define uvm_type_name_decl(TNAME_STRING) \
>      static function string type_name(); \
>        return TNAME_STRING; \
>      endfunction : type_name \
>      virtual function string get_type_name(); \
>        return TNAME_STRING; \
>      endfunction : get_type_name
> ```
>
> **실제로 펼쳐진 모양** (`uvm/01_uvm_hello/uvm_base.sv` 의 `` `uvm_component_utils(base_driver) ``)
> ```systemverilog
> class base_driver extends uvm_driver #(base_item);
>   // ↓ `uvm_component_utils(base_driver) 한 줄이 아래로 바뀜
>   typedef uvm_component_registry #(base_driver, "base_driver") type_id;
>   static function type_id get_type();                 return type_id::get(); endfunction
>   virtual function uvm_object_wrapper get_object_type(); return type_id::get(); endfunction
>   static function string type_name();                 return "base_driver";  endfunction
>   virtual function string get_type_name();            return "base_driver";  endfunction
>   ...
> endclass
> ```
>
> | 생기는 것 | 역할 |
> |---|---|
> | `typedef ... type_id` | factory에 이 class를 **`"base_driver"` 이름으로 등록**하는 대리인. 그래서 `base_driver::type_id::create("drv", this)` 가 가능 |
> | `get_type()` (static) | 객체 없이 class 자체의 factory 정보 얻기 → override 할 때 사용 (`set_type_override_by_type(base_driver::get_type(), my_driver::get_type())`) |
> | `get_object_type()` (virtual) | 객체 핸들에서 "실제 타입"의 factory 정보 얻기 |
> | `type_name()` / `get_type_name()` | `"base_driver"` 문자열 반환 → 로그·`print()` 에 class 이름이 찍히는 이유 |
>
> - 매크로 없이 이 5줄을 직접 써도 동작은 같음 → 매크로는 **class마다 반복되는 등록 코드를 한 줄로 줄인 것**
> - `uvm_object_utils` 도 같은 구조 (`uvm_component_registry` → `uvm_object_registry` 로만 바뀜)
> - 파라미터화 class 용 `uvm_component_param_utils(T)` 는 ③(이름 문자열)이 없음 → `#(T)` 마다 이름이 달라져서 **이름으로 factory 조회 불가**, 타입으로만 가능

---

> **Q. `` `" `` 가 도대체 뭐야?**
> **A. "매크로 안에서 쓰는 큰따옴표".** 일반 `"` 대신 `` `" `` 로 문자열을 감싸면, 그 문자열 **안에 있는 인자 이름도 치환**됨
> - 배경 : 매크로는 인자를 글자 그대로 바꿔치기하지만, **`"..."` 문자열 안은 건드리지 않음** (문자열은 한 덩어리로 취급)
> - 그래서 문자열 안의 인자까지 바꾸고 싶을 때 쓰는 **특수 따옴표**가 `` `" ``
>
> ```systemverilog
> `define PLAIN(v)  $display("v = %0d", v)       // 일반 따옴표
> `define STR(v)    $display(`"v = %0d`", v)     // 매크로용 따옴표
> `define NAME(T)   `"T`"                        // 인자를 그대로 문자열로
> ```
>
> | 호출 | 펼쳐진 코드 (`verilator -E` 로 확인) | 출력 |
> |---|---|---|
> | `` `PLAIN(count); `` | `$display("v = %0d", count);` → 문자열 안 `v` **안 바뀜** | `v = 7` |
> | `` `STR(count); `` | `$display("count = %0d", count);` → 문자열 안 `v` 도 **`count`로 바뀜** | `count = 7` |
> | `` s = `NAME(base_driver); `` | `s = "base_driver";` | `s = base_driver` |
>
> - 펼친 뒤에는 `` `" `` 가 **평범한 `"` 로 바뀜** → 최종 코드에는 `` ` `` 가 남지 않음
> - 짝 : 여는 것도 `` `" ``, 닫는 것도 `` `" ``
> - 쓰는 이유 = **변수/class "이름"을 문자열로 만들기** (매크로가 아니면 불가능)
>   - `` `SHOW(count) `` → `"count = 7"` 처럼 변수 이름을 같이 출력
>   - `` `uvm_component_utils(base_driver) `` → 안에서 `` `"T`" `` 로 `"base_driver"` 를 만들어 factory 등록·`get_type_name()` 에 사용
> - 비슷한 기호 정리
>
> | 기호 | 뜻 | 예 (`T` = `state`) |
> |---|---|---|
> | `` `" `` | 문자열 시작/끝 + 안의 인자 치환 | `` `"T`" `` → `"state"` |
> | `` `\`" `` | 문자열 안에 `"` 글자 자체 넣기 | `` `"`\`"T`\`"`" `` → `"\"state\""` (출력: `"state"`) |
> | ` `` ` | 토큰 이어 붙이기 | ``T``_q`` → `state_q` |

---

## 11. 데이터 은닉화 — `local`

| 항목 | 내용 |
|---|---|
| **`local`** | 그 **class 안에서만** 사용 가능 |
| class 밖에서는? | 변수에 직접 접근 ❌, 대신 **method(function, task)는 사용 가능** → method를 통해서만 값을 읽고 바꿈 |
| 사용 목적 | class 밖에서 **멤버 변수를 함부로 바꾸지 못하게** |

```systemverilog
class A;
    local int a_cnt = 0;   // 이 변수는 밖에서 접근 불가능
endclass
```

---

## 12. 상속 — `extends` · `local` vs `protected`

| 접근 지정 | class 안 | **자식 class** | class 밖 |
|---|---|---|---|
| (안 붙임) = public | ✅ | ✅ | ✅ |
| **`protected`** | ✅ | ✅ | ❌ |
| **`local`** | ✅ | ❌ (**상속받아도 수정 불가**) | ❌ |

**상속 예시**

```systemverilog
class packet;                          // 부모 class
    local     int id;                  // packet 안에서만
    protected int len;                 // packet + 자식 class 까지
    int           data;                // 어디서나 (public)

    function new(int id, int len);
        this.id  = id;
        this.len = len;
    endfunction

    function int get_id();             // local 변수는 method 로만 꺼내 봄
        return id;
    endfunction

    virtual function void print();
        $display("[packet]     id=%0d len=%0d data=%0d", id, len, data);
    endfunction
endclass

class err_packet extends packet;       // 자식 class : packet 의 멤버·method 를 물려받음
    bit crc_err;                       // 자식에서 새로 추가한 멤버

    function new(int id, int len);
        super.new(id, len);            // 부모 생성자 먼저 호출
    endfunction

    function void make_long();
        len = len * 2;                 // ✅ protected → 자식에서 접근 가능
        // id = 0;                     // ❌ local → 자식에서도 접근 불가 (컴파일 에러)
    endfunction

    virtual function void print();     // 부모 method 재정의 (override)
        super.print();                 // 부모 print 먼저 실행
        $display("[err_packet] id=%0d crc_err=%0b", get_id(), crc_err);
    endfunction
endclass

module tb;
    err_packet ep;

    initial begin
        ep = new(7, 4);
        ep.data    = 8'hA5;            // ✅ public
        ep.crc_err = 1;
        ep.make_long();                // len : 4 → 8
        ep.print();
        // ep.len = 0;                 // ❌ protected → class 밖에서 접근 불가
        // ep.id  = 0;                 // ❌ local → class 밖에서 접근 불가
    end
endmodule
```

**실행 결과** (verilator로 직접 돌려서 확인)

```
[packet]     id=7 len=8 data=165
[err_packet] id=7 crc_err=1
```

**구문 해석**

| 구문 | 의미 |
|---|---|
| `class err_packet extends packet;` | `packet`을 **상속** → 부모의 멤버·method를 그대로 물려받고, 필요한 것만 추가/재정의 |
| `super.new(id, len);` | 자식 생성자에서 **부모 생성자**를 먼저 호출해 부모 쪽 멤버 초기화 |
| `len = len * 2;` (자식 안) | `protected` 라서 자식에서 **직접 수정 가능** |
| `// id = 0;` (자식 안) | `local` 이라서 자식이어도 **에러** → `'id' is hidden as 'local'` |
| `get_id()` | `local` 변수를 밖/자식에서 보려면 **부모가 열어준 method**로만 |
| `virtual function … print()` | 자식이 **재정의(override)** 할 수 있는 method. 부모 핸들로 불러도 자식 버전이 실행됨 |
| `super.print();` | 재정의한 method 안에서 **부모 버전**도 같이 실행 |
| `// ep.len = 0;` (class 밖) | `protected` 라서 class 밖에서는 **에러** → `'len' is hidden as 'protected'` |

---

> **Q. 자식 class 생성자는 부모 생성자와 인자가 같아야 하나?**
> **A. 아니다. 자식 `new` 인자는 자유.** 단, **`super.new(...)` 를 부모가 요구하는 인자에 맞춰 첫 줄에서 불러야** 함
> - 위 예시는 자식도 `new(int id, int len)` 로 같게 썼지만, 그건 **편해서** 그런 것이지 규칙이 아님
> - 생성자는 `virtual` 이 아님 → override 규칙(인자 똑같이)이 적용되지 않음. 반대로 **`virtual` method(`print`)는 부모와 인자·리턴 타입이 같아야** 함
>
> | 경우 (부모 = `new(int id, int len)`) | 코드 | 결과 (Verilator 5.051) |
> |---|---|---|
> | 자식 인자 **줄이기** | `new(int id); super.new(id, 10);` | ✅ `id=7 len=10` |
> | 자식 인자 **늘리기** | `new(int id, int len, bit e); super.new(id, len); this.e = e;` | ✅ `id=7 len=4` |
> | `super.new` **안 부름** | `new(int id); this.id = id;` | ❌ `Missing argument on non-defaulted argument 'id' in function call to FUNC 'new'` |
> | 자식에 `new` **아예 없음** | `class c4 extends packet; endclass` | ❌ 같은 에러 |
> | `super.new` 를 **둘째 줄 이후**에 | `$display("before"); super.new(id, 10);` | ❌ `'super.new' not first statement in new function` |
>
> - 왜 안 부르면 에러? : 자식 `new` 에 `super.new` 가 없거나, 자식에 `new` 가 아예 없으면 컴파일러가 **`super.new()` (인자 없이)를 자동으로 넣음** → 부모는 인자 2개를 요구하니 에러
> - 왜 첫 줄? : 부모 쪽 멤버가 먼저 만들어져야 자식이 그걸 쓸 수 있음 (집 기초 → 그 위에 층)
> - 자동 호출이 통하는 경우 : **부모 인자에 기본값**이 있으면 `super.new()` 로도 OK
>
> ```systemverilog
> class packet;
>     function new(int id = 1, int len = 2); ... endfunction   // 기본값
> endclass
> class c5 extends packet; endclass      // new 없음 → super.new() 자동 → id=1 len=2 ✅
> class c6 extends packet(3, 5); endclass // extends 에 인자 직접 → id=3 len=5 ✅ (잘 안 쓰는 문법)
> ```
>
> - **UVM에서는 사실상 같게 씀** : factory가 `type_id::create("drv", this)` → 내부에서 **`new(name, parent)` 로 호출**하기 때문
>
> ```systemverilog
> class base_driver extends uvm_driver #(base_item);
>     function new(string name, uvm_component parent);   // 부모(uvm_component)와 같은 모양 고정
>         super.new(name, parent);
>     endfunction
> endclass
> ```
>   - component = `new(string name, uvm_component parent)`, object(seq_item) = `new(string name = "...")` 가 정해진 모양 → 인자를 바꾸면 factory 생성이 깨짐

---

> **Q. UVM 생성자에서 `uvm_component parent = null` 처럼 null을 주는 이유는?**
> **A. `= null` 은 "parent를 안 넘기면 null로 하겠다"는 **기본값**. UVM은 parent가 null이면 **맨 꼭대기(`uvm_top`, root)** 에 붙임**
> ```systemverilog
> function new(string name = "my_agent", uvm_component parent = null);
>     super.new(name, parent);
> endfunction
> ```
> - 기본값(`= 값`) 자체는 SV 함수 문법 : 인자를 생략하고 `new("a2")` 처럼 불러도 되게 해 줌 (위 Q의 `c5` 예시와 같은 원리)
>
> **UVM 원본** (`uvm_component::new`, Accellera `src/base/uvm_component.svh`)
> ```systemverilog
> if (parent == null) begin
>     parent = top;          // top = uvm_root (트리의 맨 꼭대기)
> end
> ```
>
> **null 이 실제로 쓰이는 곳 = test**
> - `run_test("my_test")` 가 test를 만들 때 **parent 자리에 null** 을 넘김 → test는 root 바로 아래 `uvm_test_top` 이 됨
> ```systemverilog
> // uvm_root.svh 의 run_test 안
> $cast(uvm_test_top, factory.create_component_by_name(test_name, "", "uvm_test_top", null));
> ```
> - 즉 test = **부모가 없는 유일한 컴포넌트** → 그래서 test 템플릿에 `parent = null` 이 자주 보임
>
> **확인** (Verilator 5.051 + Accellera UVM 원본, test 에서 `config_db::set(this, "*", "cfg", 7)` 후 agent 2개 생성)
>
> | 생성 방법 | `get_full_name()` | 부모 | config_db `cfg` |
> |---|---|---|---|
> | test (`run_test` 가 null 로 생성) | `uvm_test_top` | root | — |
> | `a1 = my_agent::type_id::create("a1", this);` | `uvm_test_top.a1` | `uvm_test_top` | **7** ✅ |
> | `a2 = new("a2");` (parent 생략 → null) | **`a2`** | **root** | **-1** ❌ (못 받음) |
>
> - a2는 test 아래가 아니라 **root 바로 아래**로 떨어짐 → 경로가 `uvm_test_top.*` 이 아니라서 test가 내려준 설정을 **못 받음**
> - 정리
>   - `= null` 은 **"생략 가능하게" 하는 관례**일 뿐. factory(`type_id::create`)는 항상 name·parent를 **둘 다** 넘기므로 기본값이 없어도 동작함 (기본값 없는 test로도 `run_test` 정상 동작 확인)
>   - null 을 진짜로 쓰는 건 **test(최상위)** 뿐
>   - env·agent·driver 등은 반드시 **`create("이름", this)`** → 부모를 안 넘기면 트리가 깨짐

---

## 13. class의 `static` 멤버 — 모든 객체가 공유 (exam_05)

> 메모: "static 변수 → 공용 전역화, compile 단계에서 할당"
> → **정리** : class 안의 `static` 변수는 **객체마다 생기지 않고 class 전체에 딱 하나**. 시뮬레이션 **시작 전(컴파일·elaboration 단계)**에 만들어져서 **객체가 하나도 없어도 존재**한다.

| 구분 | 일반 멤버 (`id`) | **static 멤버** (`count`) |
|---|---|---|
| 개수 | **객체마다** 하나씩 | **class 전체에 하나** (모든 객체가 공유) |
| 생기는 시점 | `new()` 할 때 | 시뮬레이션 시작 전 → **객체 없이도 있음** |
| 접근 | `p1.id` | `Paket::count` (객체 없이) 또는 `p1.count` (같은 변수) |
| static method | — | `static function get_count()` → **static 멤버만** 쓸 수 있음 (특정 객체가 없으니 `this`도 없음) |

> ⚠️ 7번의 static(수명: 호출이 끝나도 값 유지)과 이름은 같지만 **다른 이야기**. 여기 static은 "class에 하나, 모두가 공유"라는 뜻.

**exam_05 실행 결과 해석** (서버 예제 `~/center/Ahnsung/example/4_example/exam_05.sv`, verilator로 직접 돌려서 확인)

| 출력 | 왜 이렇게 나오나 |
|---|---|
| `(1) 객체가 없어도 count = 0` | 객체를 만들기 전인데도 `Paket::get_count()`로 static 변수를 읽을 수 있음 |
| `(2) id : p1 = 1 , p2 = 2, p3 = 3` | `new()` 할 때마다 공유 `count`가 1씩 늘고, 그 값을 각자 `id`에 저장 |
| `(3) count : p1 = 3 , p2 = 2, p3 = 3` | p1.count = **3** (공유 값). ⚠️ 코드가 `p2.id, p3.id`를 찍고 있어서 2, 3이 나온 것 → **`p2.count, p3.count`로 고쳐야** 라벨과 맞음 (그러면 3, 3, 3) |
| `(4) p3.count = 100` | `p1.count = 100`으로 바꿨는데 p3에서도 100 → **같은 변수 하나**라는 증거 |
| `(5) p4.count = 101 p4.id = 101` | p4를 `new()` 하면서 100 → 101, 그 값이 p4의 id |

---

## 14. `::` 연산자 (scope resolution) 정리

| 형태 | 예 (예제 코드) | 의미 |
|---|---|---|
| **패키지 :: 이름** | `bus_pkg::WRITE`, `bus_pkg::WIDTH` | package 안의 이름 (6-3의 1번 방법) |
| **클래스 :: static 멤버** | `Paket::get_count()`, `Packet::get_count()` | **객체 없이** static 변수·method 사용 |
| **클래스 :: 타입·enum 이름** | `Packet::LARGE` | class 안에서 `typedef`한 타입/enum 값 |
| **클래스 :: method** (extern 몸체) | `function Packet::new(...)` | class 밖에서 method **몸체를 정의**할 때 (15번) |
| **파라미터 클래스 :: static** | `Stack#()::made` | 파라미터 조합별 static 멤버 (16번) |

> ⚠️ 메모의 "클래스 :: 멤버"는 **static 멤버일 때만** 가능. 일반 멤버(`id`)는 객체마다 따로 있어서 `Paket::id`처럼 쓸 수 없음 → `p1.id`처럼 핸들로 접근.

---

## 15. `extern` — method 몸체를 class 밖에서 정의 (exam_06)

> 메모: "extern function new → 나중에 쓸 거야, 클래스 밖에서"
> → **정정** : "나중에 **쓰겠다(호출)**"가 아니라 "몸체(코드)는 class **밖에서 정의하겠다**"는 표시. 호출하는 방법은 똑같다 (`P = new(Packet::LARGE);`).

| 위치 | 코드 | 역할 |
|---|---|---|
| class 안 | `extern function new(size_e size);` | **선언만** (이런 method가 있다는 원형) |
| class 밖 | `function Packet::new(size_e size); … endfunction` | **몸체 정의** — `클래스이름::`을 붙여 어느 class 것인지 표시 |

| 왜 쓰나 | 주의할 점 |
|---|---|
| class 선언부가 짧아져서 **어떤 method가 있는지 한눈에** 보임 (C++의 헤더/구현 분리와 비슷) | 밖에서 정의할 때 **인자 목록이 원형과 같아야** 함 |
| 긴 method 코드를 class 밖으로 분리 | 반환 타입이 class 안의 타입이면 그것도 `Packet::size_e`처럼 써야 함 |

**exam_06 실행 결과 해석** (verilator로 직접 확인)

| 출력 | 설명 |
|---|---|
| `[1] kind = WRITE, WIDTH =           0` | `bus_pkg::kind_e` 타입 변수에 `bus_pkg::WRITE` 대입, `.name()`으로 enum 이름 출력. WIDTH 앞 공백은 `%d`가 32비트 폭만큼 자리를 잡아서 → **`%0d`로 쓰면 공백 없음** |
| `(2) Packet 하나생성` / `size = LARGE` | `new(Packet::LARGE)` → class 밖에 정의한 `Packet::new`가 실행됨 → `show()`도 밖에서 정의한 몸체 |
| `[3] count = 1` | 생성자에서 static `count++` → `Packet::get_count()` |

---

## 16. 파라미터화 class — 타입을 바꿔 끼우는 class (exam_07)

```systemverilog
class Stack #(type T = int, int DEPTH = 4);   // T : 타입 파라미터, DEPTH : 값 파라미터
```

| 파라미터 | 종류 | 의미 |
|---|---|---|
| `type T = int` | **타입** 파라미터 | 스택에 넣을 데이터 **타입**을 바꿔 끼움 (int, byte, string, transaction …) |
| `int DEPTH = 4` | **값** 파라미터 | 스택 크기 (module parameter와 같은 개념) |

| 선언 | T | DEPTH |
|---|---|---|
| `Stack #() s_int;` | int (기본값) | 4 (기본값) |
| `Stack #(byte, 8) s_byte;` | byte | 8 |
| `typedef Stack #(string, 2) str_stack_t;` | string | 2 → 긴 이름을 `typedef`로 줄여 씀 |

> **파라미터가 다르면 서로 다른 class가 된다** → static 멤버 `made`도 **조합마다 따로** 있음. 다른 조합끼리는 핸들 대입도 안 됨 (`s_int = s_byte;` ❌).

**exam_07 실행 결과 해석** (서버 VCS 로그 `sim.log`와 verilator 결과 동일)

| 출력 | 설명 |
|---|---|
| `(1) int 스택 : size = 2  pop = 20` | 10, 20 push → size 2. `pop_back`이라 **마지막에 넣은 20**이 먼저 나옴 (스택 = LIFO) |
| `(2) 세번째 push 결과 = 0` | `str_stack_t`는 DEPTH = 2 → 3번째 `push("C")`는 꽉 차서 **0(실패)** 반환 |
| `(3) string 스택 : pop = B` | A, B만 들어가 있음 → 마지막 B |
| `(4) made : int = 1 byte = 1 string = 2` | `made`는 **조합별** static. `s_str`, `s_str2`는 같은 조합(string, 2)이라 2 |

| 코드 | 의미 |
|---|---|
| `local T items[$];` | 내부 queue를 `local`로 숨김 → push/pop method로만 조작 (11번 은닉화) |
| `void'(s_int.push(10));` | function **반환값을 버린다**고 명시 (안 쓰면 경고가 나올 수 있음) |
| `Stack#()::made` | 파라미터 조합까지 붙여서 static 멤버 접근 (14번) |

> ⚠️ 검토 메모: 예제의 `pop()`은 비어 있는지 확인하지 않음 → 빈 스택에서 pop 하면 queue가 경고를 내고 기본값(0, "")을 돌려줌. 실제로 쓰려면 `if (items.size() == 0)` 검사를 넣는 게 안전.

---

# 1119 (목) — 2-state vs 4-state · casting · typedef · enum · 다형성 · 추상 class · UVM 개요

> **핵심 한 줄** : 설계(RTL)는 **4-state(`logic`)**로 써서 X/Z를 보이게 하고, 2-state로 옮기기 전엔 **`$isunknown()`**으로 X를 검사한다. casting은 **값은 그대로 두고 해석(타입·폭·부호)만 바꾸는 static cast**와 **실행 중에 검사하는 `$cast`**로 나뉜다. 상태값은 **`typedef enum`**으로 만들어 파형·출력에서 **이름**으로 보이게 한다. (5장) **다형성** = 상속 + virtual + 부모 핸들 → 부모 핸들로 불러도 **실제 객체**의 method가 실행되고, 부모 → 자식 핸들은 **`$cast`로만**(실제 객체가 맞을 때만) 바꿀 수 있다. **추상 class**는 규격(약속)만 정하고 자식이 구현한다. **UVM**은 이 구조를 표준 라이브러리로 만든 것 — **컴포넌트(구조)**와 **시퀀스(자극)**가 분리되어 있다.

| # | 목차 |
|---|------|
| 1 | 4-state vs 2-state 자료형 |
| 2 | `$isunknown()` — 2-state로 옮기기 전 X 검사 |
| 3 | casting 4가지 (static cast) |
| 4 | 부호 casting — `signed'(a)` vs `-a` (질문 답변) |
| 5 | 비트 쪼개기·묶기 — struct packed casting |
| 6 | `$cast` (동적 casting) · static cast vs `$cast` |
| 7 | `const` — 상수 변수 |
| 8 | `typedef` — 사용자 정의 타입 · 이름 규칙 |
| 9 | `enum` — 필요성 · 선언 문법 · 주의사항 |
| 10 | enum에 값을 직접 주는 이유 (질문 답변) |
| 11 | enum method |
| 12 | (5장) `super` — 부모 method·생성자 부르기 |
| 13 | 다형성 · upcasting vs downcasting |
| 14 | virtual function |
| 16 | 추상 class — `virtual class` · `pure virtual` |

> 이 날 예시 코드의 출력은 전부 **서버 VCS (W-2024.09)**로 직접 돌려서 확인한 값.

---

## 1. 4-state vs 2-state 자료형

| 구분 | 타입 | 폭 | 부호 기본값 | 가질 수 있는 값 |
|---|---|---|---|---|
| **4-state** | `logic` (= `reg`) | 지정 | unsigned | **0, 1, X, Z** |
| | `integer` | 32 | signed | 0, 1, X, Z |
| **2-state** | `bit` | 지정 | unsigned | **0, 1만** |
| | `byte` | 8 | signed | 0, 1 |
| | `shortint` | 16 | signed | 0, 1 |
| | `int` | 32 | signed | 0, 1 |
| | `longint` | 64 | signed | 0, 1 |

> 메모의 `short int`, `long int` → 정확한 키워드는 띄어쓰기 없이 **`shortint`, `longint`**. 메모 표에 없던 `integer`(4-state 32비트)와 폭·부호 열은 보충.

| 규칙 | 이유 |
|---|---|
| **설계(RTL)할 때는 2-state를 쓰지 마라** | 2-state는 X/Z를 **0으로 바꿔버림** → 리셋 안 된 레지스터, 신호 충돌(X), 연결 안 된 선(Z)이 **시뮬레이션에서 안 보임** → 버그가 숨는다 |
| TB에서는 2-state 써도 됨 | 반복문 카운터, 점수 계산처럼 X가 나올 일 없는 값은 `int`가 편하고 시뮬레이션도 빠름 |

---

## 2. `$isunknown()` — 2-state로 옮기기 전 X 검사

> 메모의 `$isunkown()` → 철자 **`$isunknown()`**. 값 안에 **X나 Z가 한 비트라도 있으면 1**을 돌려준다.

**왜 필요한가** — DUT 출력(`logic`)을 TB의 `bit`/`int` 변수에 넣는 순간 X가 0으로 바뀌어서, **scoreboard가 틀린 값을 정상처럼 비교**하게 된다.

| 코드 (TB) | 결과 (VCS 확인) |
|---|---|
| `dout = 8'bxxxx_0101;` (DUT 출력이 일부 X) | `dout = xxxx0101` |
| `b = dout;` (`bit [7:0] b`) | `b = 00000101` → **X가 0으로 사라짐** |
| `i = dout;` (`int i`) | `i = 5` → 정상 값처럼 보임 ⚠️ |
| `$isunknown(dout)` | **1** → X가 있다는 걸 잡아냄 |
| `$isunknown(b)` | 0 → 이미 옮긴 뒤에는 못 잡음 |

**실무 사용 예 (monitor에서)**

```systemverilog
// DUT 출력을 transaction(2-state 변수)에 담기 전에 X 검사
if ($isunknown(vif.dout))
    $error("[MON] dout에 X/Z 발견 : %b", vif.dout);   // 여기서 바로 알림
else
    tr.dout = vif.dout;                               // 깨끗할 때만 옮김
```

---

## 3. casting 4가지 (static cast)

> casting = 자료형을 변환하는 것. 아래 4가지는 모두 **`타입'(값)`** 모양이고 **컴파일할 때 정해지는 static cast**. 검사 없이 그냥 변환한다.

| # | 종류 | 모양 | 예 | 결과 (VCS 확인) |
|---|---|---|---|---|
| 1 | **타입** cast | `타입'(값)` | `int'(3.7)` | `4` (실수 → 정수, 반올림) |
| 2 | **크기(폭)** cast | `폭'(값)` | `4'(8'hAB)` | `b` (윗비트 잘림) / `16'(8'hF0)` → `00f0` (0으로 확장) |
| 3 | **부호** cast | `signed'(값)` / `unsigned'(값)` | `signed'(8'hF0)` | `-16` (비트는 그대로, 해석만 signed) |
| 4 | **const** cast | `const'(값)` | `const'(x)` | 그 값을 상수로 취급 (거의 안 씀) |

> ⚠️ 메모의 "실행 중에 값이 대상 타입에 맞는지 검사하고 할당"은 위 4가지가 아니라 **`$cast`(6번)**의 설명. static cast는 **검사하지 않는다**.

---

## 4. 부호 casting — `signed'(a)` vs `-a` (질문 답변)

> 메모: "data를 보낼 때 unsigned라서 `signed'(a)`로 바꿔줘야 함"

---

> **Q. `-` 연산을 쓰면 되는데 왜 굳이 casting? ALU에서 `-` 말고 이렇게 가공해야 하나?**

**A. 둘은 하는 일이 다르다.** `-a`는 **값을 바꾸는 연산**(음수 만들기), `signed'(a)`는 **비트는 그대로 두고 "부호 있는 수로 읽어라"**라고 해석만 바꾸는 것.

| `a = 8'hF0` (`1111_0000`) | 비트 | 값 | 의미 |
|---|---|---|---|
| `a` (unsigned) | `1111_0000` | **240** | 그대로 읽음 |
| `signed'(a)` | `1111_0000` (그대로) | **-16** | 같은 비트를 2의 보수로 읽음 |
| `-a` | `0001_0000` (**바뀜**) | 16 | 2의 보수를 **계산**한 새 값 |

**언제 casting이 필요한가 — 데이터가 원래 부호 있는 값일 때 (VCS 확인)**

| 상황 | unsigned 그대로 | `signed'()` 사용 |
|---|---|---|
| **비교** `a < 8'h10` | `240 < 16` → **0** (틀림) | `-16 < 16` → **1** (맞음) |
| **폭 넓히기** 8 → 16비트 | `00f0` (0으로 채움 → 240) | `fff0` (**부호 확장** → -16 유지) |
| **산술 시프트** `>>>` | 0으로 채움 | 부호 비트로 채움 |

| ALU 예 | 설명 |
|---|---|
| `SLT` (signed less than) | `signed'(a) < signed'(b)` — 같은 비트라도 signed로 비교해야 음수 판정이 맞음 |
| `SRA` (산술 오른쪽 시프트) | `signed'(a) >>> sh` |
| 부호 확장 (immediate 등) | `32'(signed'(imm12))` |

> 정리 : ALU가 "빼기"를 할 때는 `-`(또는 `a - b`)를 쓰는 게 맞다. casting은 **빼기 대신 쓰는 게 아니라**, 버스·포트로 들어온 unsigned 비트 묶음을 **signed 숫자로 비교·확장·시프트해야 할 때** 쓴다. (Verilog의 `$signed(a)`와 같은 역할)

---

## 5. 비트 쪼개기·묶기 — struct packed casting

> 메모: "address bit를 쪼개고 묶고도 가능 → 예시 필요"

`struct packed`는 필드들이 **한 줄로 붙은 비트 묶음**이라서, 같은 폭의 벡터와 casting으로 **바로 바꿀 수 있다**.

```systemverilog
typedef struct packed {
    logic [3:0] tag;      // [15:12]
    logic [7:0] index;    // [11:4]
    logic [3:0] offset;   // [3:0]
} addr_t;                 // 전체 16비트

logic [15:0] addr;
addr_t       af;

addr = 16'hA3C5;
af   = addr_t'(addr);     // 쪼개기 : 16비트 → 필드별
//  af.tag = a, af.index = 3c, af.offset = 5
addr = 16'(af);           // 묶기   : 필드 → 16비트 (a3c5)
```

| 동작 | 코드 | 결과 (VCS 확인) |
|---|---|---|
| 쪼개기 | `af = addr_t'(16'hA3C5);` | `tag = a`, `index = 3c`, `offset = 5` |
| 묶기 | `16'(af)` | `a3c5` |
| 쓰는 곳 | 캐시 주소(tag/index/offset), 버스 패킷 헤더, 레지스터 필드 | `addr[11:4]`처럼 숫자로 자르는 것보다 **이름으로** 읽혀서 실수가 적음 |

---

## 6. `$cast` (동적 casting) · static cast vs `$cast`

| 비교 | **static cast** `타입'(값)` | **`$cast(목적지, 값)`** |
|---|---|---|
| 언제 | **컴파일** 때 | **실행 중** |
| 검사 | ❌ 안 함 → 범위 밖 값도 그냥 들어감 | ✅ 대상 타입에 **맞는 값인지 검사** |
| 실패하면 | (실패 개념 없음) | 함수로 쓰면 **0 반환**, 목적지는 **안 바뀜** / task로 쓰면 런타임 에러 |
| 주 용도 | 폭·부호·타입 변환 | **int → enum**, **부모 class 핸들 → 자식 class 핸들** |

**enum으로 확인 (`state_e = {IDLE, READ, WRITE}` → 0, 1, 2)**

| 코드 | 결과 (VCS 확인) |
|---|---|
| `ok = $cast(st, 2);` | `ok = 1`, `st = WRITE` |
| `ok = $cast(st, 3);` (3은 없는 값) | `ok = 0`, `st`는 **WRITE 그대로** |
| `st = state_e'(3);` (static cast) | 검사 없이 `st = 3` 들어감 → `st.name()`이 **빈 문자열** ⚠️ |

---

> **UVM에서 `$cast` 쓰는 예제** (추가)
> - 공통 이유 : UVM 함수는 **어떤 class가 올지 모르니** 부모 타입(`uvm_object`, `uvm_component`)으로 **돌려줌** → 내 class 멤버를 쓰려면 **downcasting**
> - `do_compare` 예제는 15번에 있음. 여기서는 그 외 자주 나오는 4곳
>
> ```systemverilog
> class bus_item extends uvm_sequence_item;
>     rand bit [7:0] addr, data;
>     `uvm_object_utils(bus_item)
>     function new(string name = "bus_item"); super.new(name); endfunction
>
>     // ① do_copy : copy()/clone() 이 부르는 함수. 인자가 uvm_object 로 들어옴
>     virtual function void do_copy(uvm_object rhs);
>         bus_item rhs_;
>         if (!$cast(rhs_, rhs)) `uvm_fatal("COPY", "rhs is not a bus_item")
>         super.do_copy(rhs);
>         addr = rhs_.addr;  data = rhs_.data;
>     endfunction
> endclass
>
> class my_test extends uvm_test;
>     ...
>     task run_phase(uvm_phase phase);
>         bus_item tr, tr_copy;  my_agent ag;  uvm_object obj;
>         tr = bus_item::type_id::create("tr");
>         tr.addr = 8'h10;  tr.data = 8'hAA;
>
>         // ② clone : 리턴 타입이 uvm_object
>         if (!$cast(tr_copy, tr.clone())) `uvm_fatal("CAST", "clone cast fail")
>         tr.data = 8'h55;                               // 원본만 바꿈 → 복사본은 그대로 AA
>
>         // ③ 트리에서 컴포넌트 찾기 : lookup / get_parent / get_child 는 uvm_component 리턴
>         if ($cast(ag, lookup("a"))) `uvm_info("FIND", $sformatf("id=%0d", ag.id), UVM_LOW)
>
>         // ④ factory 이름으로 생성 : create_object_by_name 은 uvm_object 리턴
>         obj = uvm_factory::get().create_object_by_name("bus_item", "", "made_by_name");
>         if ($cast(tr, obj)) `uvm_info("BYNAME", tr.get_type_name(), UVM_LOW)
>     endtask
> endclass
> ```
>
> **확인** (Verilator 5.051 + Accellera UVM 원본 `uvm-core`, `+define+UVM_NO_DPI`)
>
> | 곳 | UVM이 돌려주는 타입 | 결과 |
> |---|---|---|
> | ② `$cast(tr_copy, tr.clone())` | `uvm_object` | `tr.data=55  tr_copy.data=aa` → **별개 객체**로 복사됨 (① `do_copy` 가 불려서 필드 복사) |
> | ③ `$cast(ag, lookup("a"))` | `uvm_component` | `found uvm_test_top.a, id=3` → 내 agent 멤버 `id` 접근 |
> | ④ `$cast(tr, obj)` | `uvm_object` | `type=bus_item name=made_by_name` |
> | `$cast` 없이 `tr_copy = tr.clone();` | — | ❌ 컴파일 에러 `Assign RHS expects a CLASSREFDTYPE 'bus_item', got CLASSREFDTYPE 'uvm_object'` |
> | `$cast` 없이 `ag = lookup("a");` | — | ❌ `… expects 'my_agent', got 'uvm_component'` |
>
> - 실무에서 제일 자주 보는 곳 = **② clone (monitor)**
>   - monitor가 같은 `tr` 객체를 계속 재사용하면서 `ap.write(tr)` 하면, scoreboard가 받은 핸들도 **같은 객체** → 다음 샘플에서 값이 바뀌어 버림 (1110 transaction 공유 Q&A)
>   - 그래서 `$cast(tr_copy, tr.clone()); ap.write(tr_copy);` 로 **복사본**을 보냄
> - `$cast` 는 **함수 모양 + 결과 확인** (`if (!$cast(...)) uvm_fatal/uvm_error`) 으로 쓰는 게 규칙 (14번)

---

## 7. `const` — 상수 변수

| 항목 | 내용 |
|---|---|
| 의미 | 변수 값을 **상수로 고정** → 이후 변경 불가 |
| 초기화 | **선언할 때 한 번만** (`const int MAXV = 10;`) |
| 바꾸려 하면 | `MAXV = 3;` → **컴파일 에러** |
| `parameter`와 차이 | `parameter`는 컴파일(elaboration) 때 정해지는 상수 → 배열 크기·폭에 쓸 수 있음. `const`는 **변수**라서 실행 중 값으로 초기화할 수 있지만 폭 지정 등에는 못 씀 |

---

## 8. `typedef` — 사용자 정의 타입 · 이름 규칙

> 메모: "typedef : 재정의 / 사용자 정의형 **변수가 아니다**"
> → **정리** : `typedef`는 **새 타입 이름**을 만드는 것이지 변수를 만드는 게 아니다. 변수는 그 타입으로 **따로 선언**해야 생긴다.

| 효과 | 설명 |
|---|---|
| 가독성 | `logic [31:0]` 대신 `word_t` → 무슨 데이터인지 이름으로 보임 |
| 재사용성 | 폭을 바꿀 때 typedef **한 곳만** 고치면 됨 |
| 실수 방지 | 같은 의미의 신호는 항상 같은 폭·타입 |

| 코드 | 의미 |
|---|---|
| `typedef logic [31:0] word_t;` | 32비트 타입 `word_t` 정의 (변수 아님) |
| `word_t addr;` | 그 타입의 **변수** `addr` 선언 |
| `typedef logic [3:0] nib_t;` | 4비트 타입 |
| `nib_t [0:7] nibs;` | `nib_t` **8개를 붙인 packed 배열** (4 × 8 = 32비트) — 메모의 `nivs`는 오타로 보고 `nibs`로 정리 |

**이름 규칙 & 선언 위치**

| 규칙 | 이유 |
|---|---|
| 타입 이름 끝에 **`_t`** (enum은 `_e`, struct는 `_s`도 많이 씀 — exam_06의 `kind_e`, `size_e`) | 정의와 사용이 **다른 파일**에 있는 경우가 많음 → 이름만 보고 **타입인지** 알 수 있어야 읽기 쉬움 |
| **package**에 선언 | `typedef enum`, `typedef struct`를 package에 모아두고 RTL·TB가 같이 `import` (1118 6번) |

---

## 9. `enum` — 필요성 · 선언 문법 · 주의사항

### 9-1. 필요성

| `define` / `parameter`로 상태를 만들면 | `enum`으로 만들면 |
|---|---|
| 파형·`$display`에 **숫자(값)**로 나옴 → `2`가 무슨 상태인지 코드를 찾아봐야 함 | 파형·`.name()`에 **이름**(`WRITE`)으로 나옴 → 보기 편함 |
| 아무 숫자나 대입돼도 모름 | **정해진 이름만** 넣을 수 있음 → 실수 방지 |

> 메모: "enum → 값으로 넣는 게 아니다. 오동작할 수 있다"
> → **정리** : enum 변수에는 **이름(라벨)으로 대입**한다. 숫자를 직접 넣으면(`st = 2;`) 표준상 불법이고, 없는 값(3)도 들어갈 수 있어 오동작 위험. VCS는 이 경우 **Warning(ENUMASSIGN)만 내고 실행**하니 경고를 무시하지 말 것. 숫자를 넣어야 하면 `$cast`(6번).

### 9-2. 선언 문법

| # | 규칙 | 예 | 결과 / 설명 |
|---|---|---|---|
| 1 | **base type을 생략하면 `int`** (32비트 2-state) | `enum {IDLE, RUN}` | 폭·4-state가 필요하면 **base type을 명시** → `typedef enum logic [1:0] {…} state_e;` |
| 2 | **라벨 범위 자동 생성** | `typedef enum logic [3:0] {DATA[4]} data_e;` | `DATA0, DATA1, DATA2, DATA3` (= 0~3) 생성. `DATA[1:3]`이면 `DATA1~DATA3` |
| 3 | **값을 안 쓰면 순서대로** | `enum {b0 = 1'b0, b1, b2}` | 0, 1, 2 — 첫 라벨은 0부터, 다음은 **앞 값 + 1** |
| 3' | 중간에 값을 주면 거기서 이어서 +1 | `enum {A = 1, B, C = 5, D}` | `A=1, B=2, C=5, D=6` (VCS 확인) |

> 메모 2번의 "팩으로도 가능" → packed 배열이 아니라 **`이름[개수]`로 라벨을 여러 개 자동 생성**하는 문법. (VCS 확인 : `DATA2 = 2`, `first = DATA0`, `last = DATA3`, `num = 4`)
>
> ⚠️ 메모 3번 "always 안에서는 enum logic을 되도록 쓰지 마라"는 **확인이 필요**. FSM의 state 변수를 `enum logic`으로 선언하고 `always_ff`/`always_comb`에서 쓰는 건 **표준적인 방법**이다. "always 블록 **안에서 enum 타입을 선언하지 말고** module/package에서 `typedef` 하라"는 뜻이었을 가능성이 높음 → 교수님께 다시 확인 권장.

### 9-3. 주의사항

| 주의 | 이유 |
|---|---|
| **라벨 수에 맞는 최소 폭**을 명시 (라벨 3개 → `logic [1:0]`) | base type을 안 쓰면 `int` = **32비트 2-state** → 의도보다 넓고, **X가 안 보임**. 합성기가 안 쓰는 비트를 지우는 경우가 많지만 설계 의도를 코드에 분명히 쓰는 것이 원칙 |
| 폭이 모자라면 에러 | 라벨 5개를 `logic [1:0]`(4개까지)에 넣으면 컴파일 에러 |
| **서로 다른 enum끼리 대입 불가** | `color = state;` → VCS **Error-[ENUMASSIGNTYPE]** (직접 확인) |
| enum → int는 OK, int → enum은 cast 필요 | `v = st;` 는 자동 변환(`READ` → 1) / 반대는 `$cast` |

---

## 10. enum에 값을 직접 주는 이유 (질문 답변)

> **Q. FSM은 이름(string)으로 보려고 enum을 쓰는 건데, 값을 직접 주는 이유는? 값을 읽어야 하는 경우는 언제이고, 값으로 받을 때 casting 하나?**

**A1. 값을 직접 주는 이유 — enum 값이 결국 하드웨어의 실제 비트가 되기 때문**

| 이유 | 예 |
|---|---|
| **상태 인코딩 지정** (one-hot, gray 등) → 속도·전력·글리치 특성을 설계자가 정함 | `enum logic [3:0] {S_IDLE = 4'b0001, S_RUN = 4'b0010, S_DONE = 4'b0100}` → `S_RUN = 0010` (VCS 확인) |
| **외부 규격과 값이 맞아야 할 때** | 명령어 opcode, 버스 명령 코드(`READ = 2'b01`), 레지스터 필드 값 → 스펙에 정해진 숫자가 실제로 선에 나가야 함 |
| **소프트웨어/다른 블록이 값을 읽을 때** | 상태 레지스터를 CPU가 읽어서 숫자로 판단 |

**A2. 값을 읽어야 하는 경우 & casting 여부**

| 방향 | 방법 | casting? |
|---|---|---|
| enum → 숫자 (값 읽기) | `v = st;` → `READ`면 `1` | ❌ **필요 없음** (자동 변환) |
| enum → 이름 (출력·디버그) | `st.name()` → `"READ"` | ❌ |
| 숫자 → enum (버스·레지스터에서 읽은 값) | `$cast(st, bus_val)` → 없는 값이면 0 반환으로 걸러냄 | ✅ **필요** (`$cast` 권장, static cast는 검사 없음) |

---

## 11. enum method

> 메모의 빈 표 채움. 예 : `typedef enum logic [1:0] {IDLE, READ, WRITE} state_e;` (출력은 VCS 확인)

| method | 설명 | 예 → 결과 |
|---|---|---|
| `first()` | **첫 번째** 라벨 | `st.first()` → `IDLE` |
| `last()` | **마지막** 라벨 | `st.last()` → `WRITE` |
| `next(N)` | **N칸 다음** 라벨 (생략 시 1). 끝에서 넘어가면 **처음으로 돌아감** | `WRITE.next()` → `IDLE`, `READ.next(2)` → `IDLE` |
| `prev(N)` | **N칸 이전** 라벨 (생략 시 1). 처음에서 넘어가면 **마지막으로** | `IDLE.prev()` → `WRITE` |
| `num()` | 라벨 **개수** | `st.num()` → `3` |
| `name()` | 현재 값의 **이름 문자열**. 없는 값이면 빈 문자열 | `READ.name()` → `"READ"` |

> `next()`·`prev()`는 **값 +1이 아니라 선언 순서**를 따른다 (`A=1, B=2, C=5`에서 `B.next()`는 3이 아니라 `C`).
> `.name()`은 `$display("%s", st.name())`처럼 TB 로그에서 상태를 사람이 읽기 좋게 찍을 때 많이 쓴다.

---

## 12. (5장) `super` — 부모 method·생성자 부르기

| 규칙 | 설명 |
|---|---|
| **재정의한 method 안에서 `super.메서드()`** | 부모 버전을 **같이 실행** (부모 동작 + 자식에서 추가) |
| **자식 생성자에서는 `super.new()`가 맨 처음** | 부모 쪽 멤버부터 초기화해야 하므로 **첫 줄**이어야 함. 생략하면 인자 없는 `super.new()`가 자동 호출 → 부모 `new`가 인자를 받으면 **에러** |
| UVM에서 | `build_phase`, `run_phase` 등을 재정의할 때 첫 줄에 `super.build_phase(phase);` 를 부르는 이유가 이것 |

> 메모: "super → 부모 객체를 뜻함"
> → **정정** : 부모 객체가 **따로 있는 게 아니다**. `new()`로 만든 객체는 **하나**이고, `super`는 "이 객체 안에서 **부모 class에게 물려받은 부분**(멤버·method)"을 가리킨다.

---

## 13. 다형성 = 상속 + virtual method + 부모 핸들

> 하나의 **부모 핸들**로 여러 **자식 객체**를 가리키고, 같은 method를 불러도 **실제 객체에 맞는 동작**이 실행되는 것.

| 재료 | 역할 |
|---|---|
| 상속 | 자식들이 같은 부모 틀(method 이름)을 가짐 |
| **virtual method** | 핸들 타입이 아니라 **실제 객체의 class** method가 실행되게 함 |
| **부모 핸들** | `shape s = rect_obj;` 처럼 자식 객체를 부모 타입 핸들에 담음 (**upcasting**, 자동) |

### 13-1. upcasting vs downcasting

| 구분 | 방향 | 방법 | 항상 되나? |
|---|---|---|---|
| **upcasting** | 자식 객체 → **부모** 핸들 | `s = rr;` (그냥 대입) | ✅ 항상 됨 (자식은 부모의 모든 걸 갖고 있음) |
| **downcasting** | 부모 핸들 → **자식** 핸들 | **`$cast(rr, s)`** 만 가능 | ⚠️ **실제 객체가 그 자식 타입일 때만** 성공 |

---

> **Q. downcasting은 항상 안 되는 건가?** → **아니다.**
> - `rr = s;`처럼 **직접 대입**하는 건 항상 **컴파일 에러** (VCS `Error-[SV-ICA] Illegal class assignment`, 직접 확인)
> - `$cast(rr, s)`는 **실행 중에 실제 객체를 검사** → 부모 핸들이 진짜 `rect` 객체를 가리키고 있으면 **성공(1)**, `circle` 객체면 **실패(0)**

### 13-2. 예시 — 다형성 · virtual · downcasting (VCS로 직접 확인)

```systemverilog
virtual class shape;                          // 추상 class (14번)
    string name;
    function new(string name); this.name = name; endfunction
    pure virtual function real area();        // 약속만 (본문 없음)
    virtual function void show();             // virtual
        $display("[%s] area = %0.1f", name, area());
    endfunction
    function void hello();                    // virtual 아님
        $display("hello from shape (%s)", name);
    endfunction
endclass

class rect extends shape;
    real w, h;
    function new(real w, real h);
        super.new("rect");                    // 맨 처음
        this.w = w; this.h = h;
    endfunction
    virtual function real area(); return w * h; endfunction
    function void hello(); $display("hello from rect"); endfunction
endclass

class circle extends shape;
    real r;
    function new(real r); super.new("circle"); this.r = r; endfunction
    virtual function real area(); return 3.14 * r * r; endfunction
    virtual function void show();
        super.show();                         // 부모 show 먼저
        $display("  (radius = %0.1f)", r);
    endfunction
endclass

module tb;
    shape  s;  shape list[$];
    rect   rr, r2;  circle cc;
    initial begin
        rr = new(2, 3);
        s  = rr;                              // upcasting (자동)
        s.show();                             // virtual     → rect 의 area
        s.hello();                            // non-virtual → shape 의 hello
        rr.hello();
        r2 = new(1, 4);  cc = new(1);
        list.push_back(r2);  list.push_back(cc);
        foreach (list[i]) list[i].show();     // 다형성 : 같은 show() 호출, 동작은 객체마다
        if ($cast(rr, list[0])) $display("downcast list[0] -> rect OK, w=%0.1f", rr.w);
        if (!$cast(rr, list[1])) $display("downcast list[1] -> rect FAIL (real type: %s)", list[1].name);
    end
endmodule
```

| 출력 | 왜 |
|---|---|
| `[rect] area = 6.0` | `s`는 shape 핸들이지만 `area()`가 **virtual** → 실제 객체(rect)의 `area` 실행 |
| `hello from shape (rect)` | `hello()`는 **virtual 아님** → **핸들 타입(shape)**의 method 실행 |
| `hello from rect` | rect 핸들로 부르면 rect 것 |
| `[rect] area = 4.0` / `[circle] area = 3.1` / `(radius = 1.0)` | 같은 `list[i].show()`인데 객체마다 다르게 동작 = **다형성**. circle은 `super.show()` 후 반지름 추가 출력 |
| `downcast list[0] -> rect OK, w=1.0` | list[0]의 실제 객체가 rect → `$cast` 성공 |
| `downcast list[1] -> rect FAIL (real type: circle)` | 실제 객체가 circle → 실패 |

---

## 14. virtual function

| virtual | 부모 핸들에 **자식 객체**가 들어있을 때 실행되는 것 |
|---|---|
| **있음** | **자식(실제 객체)**의 method |
| 없음 | **부모(핸들 타입)**의 method |

> 메모: "upcasting 시에 부모 핸들에 **자식 생성자**가 들어갔을 때" → **자식 객체**(생성자로 만든 객체)가 들어갔을 때.
> 메모: "안전하게 내 class의 function을 실행시킬 때 virtual" → **정정** : virtual은 "핸들 타입과 상관없이 **실제 객체의 class** method를 실행"하게 하는 것. 부모 핸들로 다뤄도 각 자식의 동작이 나오게 하려고 쓴다.

| 규칙 | 이유 |
|---|---|
| 재정의될 method는 **부모에서 `virtual`**로 선언 | 부모에서 virtual이면 자식에서 `virtual`을 안 써도 virtual로 유지됨 |
| **`$cast`는 성공했는지 반드시 확인 + 메시지** | 실패하면 목적지 핸들이 **안 바뀐 채(null일 수도)** 진행 → 뒤에서 엉뚱한 에러가 남. `if (!$cast(...)) $error/uvm_error(...)` 형태로 쓴다 |

---

> **Q. 부모 함수를 오버라이딩하면서 부모 기능을 그대로 쓰려면 `virtual` 로 선언해야 하는 것 아닌가?**
> **A. 아니다. 부모 기능을 같이 쓰는 건 `super.함수()` 의 일이고, `virtual` 과는 무관.** `virtual` 은 **부모 핸들로 불렀을 때** 자식 버전이 실행되느냐만 정함
>
> | 하고 싶은 것 | 필요한 것 | virtual 필요? |
> |---|---|---|
> | 부모 함수를 **그대로** 쓰기 | 자식에서 **재정의 안 하면 됨** (자동 상속) | ❌ |
> | 재정의하면서 부모 기능도 **같이** 실행 | 자식 함수 안에서 **`super.함수()`** | ❌ |
> | **부모 핸들**로 불러도 **자식 버전** 실행 (다형성) | 부모 함수에 **`virtual`** | ✅ |
>
> **확인** (Verilator 5.051 — `hi()` 는 non-virtual, `vhi()` 는 virtual, 자식은 둘 다 `super` 호출 후 한 줄 추가)
> ```systemverilog
> class parent;
>     function void hi();          $display("parent.hi");  endfunction   // virtual 아님
>     virtual function void vhi(); $display("parent.vhi"); endfunction   // virtual
>     function void keep();        $display("parent.keep"); endfunction  // 자식이 재정의 안 함
> endclass
> class child extends parent;
>     function void hi();  super.hi();  $display("child.hi  (추가)"); endfunction
>     function void vhi(); super.vhi(); $display("child.vhi (추가)"); endfunction
> endclass
> // child c = new;  parent p = c;   (같은 객체를 자식 핸들 c, 부모 핸들 p 로)
> ```
>
> | 호출 | 출력 | 해석 |
> |---|---|---|
> | `c.keep()` | `parent.keep` | 재정의 안 함 → 부모 것 그대로 (virtual 무관) |
> | `c.hi()` (non-virtual, 자식 핸들) | `parent.hi` → `child.hi (추가)` | **virtual 없이도** `super` 로 부모 기능 + 추가 ✅ |
> | `p.hi()` (non-virtual, **부모 핸들**) | `parent.hi` 만 | ⚠️ 자식 재정의가 **무시됨** → 핸들 타입(parent) 것 실행 |
> | `c.vhi()` (virtual, 자식 핸들) | `parent.vhi` → `child.vhi (추가)` | 자식 핸들이면 non-virtual과 결과 같음 |
> | `p.vhi()` (virtual, **부모 핸들**) | `parent.vhi` → `child.vhi (추가)` | **virtual 이라서** 부모 핸들로도 자식 버전 실행 |
>
> - 차이는 **부모 핸들로 부를 때(`p.hi()` vs `p.vhi()`)만** 나타남
> - 그런데도 재정의할 method는 **습관적으로 virtual** 로 둠 : UVM처럼 라이브러리가 **부모 핸들**로 내 코드를 부르는 구조에서는 virtual이 아니면 내 재정의가 **아예 실행 안 됨**
>   - 예 : UVM이 `comp.build_phase(phase)` 를 `uvm_component` 핸들로 부름 → `build_phase` 가 virtual 이라서 내 driver 의 `build_phase` 가 실행됨 (1120 8번 Q)
> - 정리 : **`super` = "부모 것도 같이"**, **`virtual` = "부모 핸들로 불러도 내 것이"** → 서로 다른 일

---

## 16. 추상 class — `virtual class` · `pure virtual`

| 문법 | 의미 |
|---|---|
| **`virtual class`** | **객체를 만들 수 없는** class → **상속해서만** 쓴다 |
| **`pure virtual function`** | **본문이 없는 약속** (이름·인자·반환 타입만). 자식이 **반드시 구현**해야 함 |

**왜 class를 추상으로 만드나** — 실체(구체적인 동작)는 아직 정하지 않았지만, **공통된 규격(틀)**은 먼저 정해두고 싶을 때.
→ "**약속만 한다 → 상속 → 자식이 약속을 지킨다(구현)**"

| 위반하면 (VCS 확인) | 에러 |
|---|---|
| `s = new();` (추상 class 객체 생성) | `Error-[SV-ACCNBI] An abstract class cannot be instantiated` |
| 자식이 pure virtual method를 구현 안 함 | `Error-[SV-VMNI] Virtual method 'area' not implemented in class 'sq'` |

**예시** : 13-2의 `shape`가 추상 class.
`area()`는 모양마다 계산법이 달라서 shape에서는 **약속만**(`pure virtual`) 하고, `rect`·`circle`이 각자 구현한다. 공통 동작(`show()`)은 부모에 한 번만 써두고, 그 안에서 `area()`를 부르면 자식 구현이 실행된다.

| UVM의 추상 class | 확인 |
|---|---|
| `uvm_void`, **`uvm_object`**, **`uvm_component`** | UVM 1.2 소스에 `virtual class`로 선언됨 (서버 `$VCS_HOME/etc/uvm-1.2/src` 에서 확인) |
| `uvm_sequence_item` | 추상이 **아님** (일반 class) — 그래도 보통 상속해서 내 item을 만든다 |

> 그래서 UVM에서는 `uvm_component`를 바로 `new` 하지 않고, **상속해서 `my_driver`, `my_monitor`**를 만든다.

---

# 1120 (금) — struct · union · packed vs unpacked array · UVM phase · sequence-driver handshake · factory

> **핵심 한 줄** : **struct**는 멤버를 **나란히 묶고**, **union**은 같은 비트를 **여러 이름으로 겹쳐 본다**. tagged union은 지금 어떤 멤버가 들어있는지 **tag로 기억**해서 잘못 읽으면 에러를 낸다. **packed** 배열은 **한 덩어리 벡터**(통째로 연산·부분 선택), **unpacked** 배열은 **원소가 따로**(메모리). 합성은 **고정 크기 배열만** 되고, 동적 배열·연관 배열·queue는 검증(TB) 전용이다. UVM은 **phase**(build → connect → end_of_elaboration → run → report)로 진행되고, run_phase는 **objection**이 다 내려가면 끝난다. sequence와 driver는 `start_item`/`finish_item` ↔ `get_next_item`/`item_done`으로 **handshake** 하며, 부품·item은 `new` 대신 **factory(`type_id::create`)**로 만들어 override 할 수 있게 한다.

| # | 목차 |
|---|------|
| 1 | struct vs union (packed union) |
| 2 | struct + union 조합 예시 |
| 3 | tagged union |
| 4 | unpacked array vs packed array |
| 5 | array 합성 가이드 |
| 6 | array 조회 함수 |
| 7 | 합성되지 않는 array |

> 이 날 예시 출력은 전부 **서버 VCS (W-2024.09)**로 직접 돌려서 확인한 값.

---

## 1. struct vs union (packed union)

| 비교 | **struct** | **union** |
|---|---|---|
| 개념 | 멤버들을 **나란히 붙여** 하나로 묶음 | 멤버들이 **같은 비트를 공유** (겹쳐 놓음) |
| 전체 크기 | 멤버 폭의 **합** | 가장 큰 멤버 폭 (**packed union은 멤버 폭이 모두 같아야 함**) |
| 한 멤버를 바꾸면 | 그 멤버만 바뀜 | **다른 멤버로 읽어도 바뀐 값이 보임** (같은 비트니까) |
| 쓰는 목적 | 관련 신호를 이름으로 묶기 (패킷 헤더, 레지스터 필드) | **같은 데이터를 여러 모양으로 보고 싶을 때** (32비트 통째로 / 바이트별 / 필드별) |

> 메모: "union — member size가 동일 → 개별로 꺼내고 싶을 때"
> → **정리** : 멤버 폭이 같아야 하는 건 **packed union**의 규칙. union의 목적은 **같은 비트를 다른 이름·모양으로 꺼내 보는 것**이다. (unpacked union은 폭이 달라도 되지만, 마지막에 쓴 멤버 말고 다른 멤버로 읽는 건 값이 보장되지 않아 잘 안 씀)

---

## 2. struct + union 조합 예시

```systemverilog
typedef struct packed {          // 필드별로 보기 (8 + 8 + 16 = 32비트)
    logic [7:0]  opcode;
    logic [7:0]  rd;
    logic [15:0] imm;
} instr_s;

typedef union packed {           // 같은 32비트를 3가지로 보기 (모두 32비트)
    logic [31:0]     word;       // 통째로
    logic [3:0][7:0] bytes;      // 바이트별
    instr_s          f;          // 필드별 (struct)
} instr_u;

instr_u u;
u.word     = 32'h1234_ABCD;      // 통째로 쓰고
// u.bytes[3] = 12, u.bytes[0] = cd, u.f.opcode = 12, u.f.rd = 34, u.f.imm = abcd
u.f.opcode = 8'hFF;              // 필드 하나만 바꾸면
// u.word = ff34abcd             // 통째로 읽어도 반영됨 (같은 비트)
```

| 동작 | 결과 (VCS 확인) |
|---|---|
| `u.word = 32'h1234_ABCD` | `bytes[3]=12`, `bytes[0]=cd`, `f.opcode=12`, `f.rd=34`, `f.imm=abcd` |
| `u.f.opcode = 8'hFF` 후 `u.word` | `ff34abcd` |
| 쓰는 곳 | 명령어 디코드, 버스로 받은 32비트를 필드별로 해석, 레지스터 맵 |

---

> **Q. struct packed에서 opcode가 제일 상위 비트?**
> **A. 맞음.** packed struct는 **먼저 선언한 필드가 MSB 쪽**, 마지막 필드가 LSB 쪽
> - `instr_s` 비트 배치: `opcode = [31:24]`, `rd = [23:16]`, `imm = [15:0]`
> - 근거: `u.word = 32'h1234_ABCD` → `f.opcode = 12` (맨 위 바이트), `f.imm = abcd` (맨 아래 16비트)
> - `bytes[3:0]`도 같은 원리: 왼쪽 인덱스 `[3]`이 MSB → `bytes[3] = 12` = `opcode`와 같은 비트
> - 그래서 `{opcode, rd, imm}` 연결(concatenation)과 같은 순서로 생각하면 됨
> - unpacked struct는 비트 순서 개념 없음 (필드가 따로 저장, 시뮬레이터마다 배치 다름) → 통째 대입·union 겹쳐 보기는 packed일 때만

---

## 3. tagged union

> union에 **이름표(tag)**를 붙여서, 지금 **어떤 멤버가 들어있는지 기억**하게 만든 union.

```systemverilog
typedef union tagged {
    int         Imm;     // 즉시값
    logic [4:0] Reg;     // 레지스터 번호
} operand_t;

operand_t x;
int       y;

x = tagged Imm 42;       // tag = Imm, 값 = 42 를 같이 넣음
y = x.Imm;               // ✅ tag 가 Imm 이니까 OK → y = 42

x = tagged Reg 5'd3;     // 이제 tag = Reg
y = x.Imm;               // ❌ 실행 중 에러 (tag 가 Reg 인데 Imm 으로 읽음)
```

| 항목 | 내용 |
|---|---|
| 대입 | **`tagged 멤버이름 값`** → 값과 함께 "지금은 이 멤버"라는 tag가 저장됨 (메모의 "이름표 안에 값을 넣는다", "화살표 느낌") |
| 읽기 | **현재 tag와 같은 멤버**로만 읽을 수 있음 |
| 다른 멤버로 읽으면 | **런타임 에러** — VCS: `Error-[TU-INVMEMUSG] … The expected tag is 'Reg', but tag 'Imm' is used.` (직접 확인) |
| tag로 분기 | `case (x) matches  tagged Imm .n : …  tagged Reg .r : …  endcase` → tag에 맞는 줄이 실행되고 값이 `n`/`r`에 들어감 (확인 : `Imm 42`) |
| 일반 union과 차이 | 일반 union은 아무 멤버로나 읽어도 에러 없음 → 실수해도 모름. tagged union은 **잘못 읽기를 막아줌** |
| ⚠️ VCS 옵션 | tagged union은 VCS에서 제한 기능(LCA) → 컴파일 옵션 **`-lca`** 필요 (없으면 `Error-[LCA_FEATURES_NEED_OPTION]`). 예제 Makefile의 `VCS_OPTS`에는 이미 `-lca`가 들어 있음 |
| 합성 | 툴마다 지원이 제한적 → 주로 **검증·모델링**용 |

---

## 4. unpacked array vs packed array

| 비교 | **unpacked array** | **packed array** |
|---|---|---|
| 차원 위치 | 이름 **뒤** : `logic [7:0] mem [0:3]` | 이름 **앞** : `logic [3:0][7:0] w` |
| 구조 | **원소가 따로따로** 있는 묶음 | 비트가 **한 줄로 붙은 벡터**를 여러 차원으로 나눈 것 |
| 크기 표기 | `[0:3]` = `[4]` (C처럼 개수만 써도 됨 → `[0:N-1]`) | `[3:0]`처럼 범위로 씀 |
| 원소 타입 | 아무 타입 (int, real, class 핸들, struct …) | **비트 타입만** (`bit`, `logic`, packed struct/union, enum) |
| 통째로 연산 | ❌ 산술 안 됨 (같은 모양끼리 **대입·`==` 비교만** 가능) | ✅ **벡터처럼** 산술·비교·시프트 (`w + 1`) |
| 부분 선택 | 원소 하나 `mem[2]` | 원소 `w[3]`, **sub-array** `w[1:0]`, 비트 `w[3][7]` |
| 통째로 대입 | `'{8'h11, 8'h22, 8'h33, 8'h44}` / `'{default: 0}` | 숫자 하나로 `w = 32'hA1B2C3D4` |
| 합성 | **메모리(RAM)**로 추론되기 좋음 | **레지스터·버스(배선)** |
| 주 용도 | 메모리, 레지스터 파일, 같은 신호 여러 개 | 버스를 바이트/필드로 나눠 보기 |

| 예 (VCS 확인) | 결과 |
|---|---|
| `w = 32'hA1B2C3D4;` | `w[3] = a1`, `w[1:0] = c3d4`, `w + 1 = a1b2c3d5` |
| `mem = '{8'h11, 8'h22, 8'h33, 8'h44};` | `mem[0] = 11`, `mem[3] = 44` |
| `mem2 = mem;` (같은 모양 통째로 복사) | `mem2 == mem` → `1` |
| `m3 = '{default: 8'hFF};` | `'{'hff, 'hff, 'hff, 'hff}` |

> 메모: "일반적으로 unpacked array를 많이 사용한다"
> → **정리** : **메모리처럼 원소를 하나씩 다루는 곳**은 unpacked가 일반적. 하지만 **비트를 통째로 다뤄야 하는 버스·데이터**는 packed를 쓴다. 둘을 섞은 `logic [3:0][7:0] regs [16]`(32비트 레지스터 16개, 각각 바이트로도 접근) 형태도 많이 쓴다.

---

> **Q. packed array는 MAC 연산 저장 용도로 많이 쓸 수 있겠네?**
> **A. 반은 맞음.** "여러 값을 **한 줄 버스로 묶어서 한 번에 넘기는**" 용도로는 많이 쓰고, "결과를 **여러 개 쌓아 두는**" 저장은 unpacked가 맞음
> - ✅ 잘 맞는 곳: MAC 유닛 여러 개(PE 배열)에 들어가는 **입력·가중치 묶음**
>   - `logic [3:0][7:0] a, b;` → 8비트 4개를 32비트 포트 하나로 전달, 안에서는 `a[i]`, `b[i]`로 레인별 접근
>   - 메모리에서 32비트로 읽은 값을 바이트 4개로 바로 나눠 쓰기 (SIMD 느낌)
> - ❌ 안 맞는 곳: MAC 결과를 **여러 개 저장**하는 버퍼 → 원소를 하나씩 읽고 쓰므로 **unpacked**(RAM 추론) `logic [19:0] acc_buf [0:255]`
> - ⚠️ 주의 1 — **통째 연산은 레인이 안 나뉨**: `a + b`는 32비트 숫자 하나로 더해져서 아래 바이트 carry가 위 바이트로 넘어감 → MAC은 반드시 **원소별로** `for (i=0;i<4;i++) acc[i] += a[i] * b[i];`
> - ⚠️ 주의 2 — **부호**: `logic signed [3:0][7:0] a;`는 32비트 전체만 signed, `a[i]` 원소는 **unsigned** → 원소를 signed로 쓰려면 타입을 먼저 만듦: `typedef logic signed [7:0] s8_t;` `s8_t [3:0] a;`
> - ⚠️ 주의 3 — **비트 폭**: 8×8 곱 = 16비트, N개 누적이면 `16 + ⌈log2 N⌉`비트 필요 (예: 16개 누적 → 20비트) → `acc`는 입력보다 넓게

---

## 5. array 합성 가이드

> 메모의 항목(선언 · 값 할당 · 복사 · struct/union 조합 · 전달)별 정리. **고정 크기**면 합성 가능, 크기가 실행 중에 바뀌는 배열은 불가(7번).

| 항목 | ✅ 합성 OK | ⚠️ 주의 / ❌ 불가 |
|---|---|---|
| **선언** | 고정 크기 packed / unpacked (`logic [7:0] mem [16]`, `logic [3:0][7:0] w`) | 동적 배열 `[]`, 연관 배열 `[string]`, queue `[$]` ❌ |
| **값 할당** | 원소 대입 `mem[i] <= d;` / assignment pattern `'{default: '0}` (리셋) / packed는 `'0`, `'1` | 리셋 때 큰 메모리 전체를 한 번에 지우면 RAM이 아니라 **레지스터로 합성**될 수 있음 → RAM으로 쓰려면 전체 리셋 안 함 |
| **복사** | 같은 모양 unpacked끼리 통째 대입 `a = b;` / packed는 벡터처럼 대입 | 모양(원소 수·폭)이 다르면 unpacked 통째 대입 에러 → 원소별로 |
| **struct·union 조합** | **packed** struct/union, packed struct의 배열 (`instr_s prog [64]`) | unpacked struct 안의 동적 멤버 ❌, tagged union은 툴마다 제한 |
| **전달** (포트·함수 인자) | SV는 **unpacked array도 포트로** 전달 가능 / 함수 인자 가능 / 타입을 `typedef`로 만들어 양쪽에서 같은 이름으로 사용 | 포트 양쪽의 **모양이 정확히 같아야** 함 → typedef를 package에 두고 import 하면 실수 방지 |

---

## 6. array 조회 함수

> 메모의 `$dimensions(a)`, `$`, `$` … 빈칸 채움. 배열의 **크기·범위를 코드에 숫자로 박지 않고** 알아낼 때 사용 (parameter로 크기가 바뀌어도 코드가 따라감).
> `dim` 생략 시 **1번 차원**(가장 바깥 = unpacked 쪽의 첫 차원). 차원 번호는 **unpacked 왼쪽 → packed 오른쪽** 순.

| 함수 | 기능 | `logic [7:0] mem [0:3]` 결과 (VCS 확인) |
|---|---|---|
| **`$dimensions(a)`** | 전체 차원 수 (packed + unpacked) | `2` |
| **`$unpacked_dimensions(a)`** | unpacked 차원 수 | `1` |
| **`$left(a, dim)`** | 선언한 범위의 **왼쪽** 값 | `0` (`$left(mem,2)` = `7`) |
| **`$right(a, dim)`** | 선언한 범위의 **오른쪽** 값 | `3` (`$right(mem,2)` = `0`) |
| **`$low(a, dim)`** | 둘 중 **작은** 값 | `0` |
| **`$high(a, dim)`** | 둘 중 **큰** 값 | `3` |
| **`$increment(a, dim)`** | left ≥ right면 `1`, left < right면 `-1` | `-1` (`[0:3]`) / `1` (`[7:0]`) |
| **`$size(a, dim)`** | 원소 개수 (`high - low + 1`) | `4` (`$size(mem,2)` = `8`) |

| packed 배열 `logic [3:0][7:0] w` | 결과 |
|---|---|
| `$dimensions(w)` / `$unpacked_dimensions(w)` | `2` / `0` |
| `$left(w)` / `$right(w)` / `$size(w)` / `$size(w,2)` | `3` / `0` / `4` / `8` |

```systemverilog
for (int i = $low(mem); i <= $high(mem); i++) mem[i] = '0;   // 크기가 바뀌어도 그대로 동작
```

### 6-1. 예제 (Verilator 5.051로 실행 확인)

**예1. `[0:3]` vs `[3:0]` — `$low/$high`는 같고 `$left/$right`·순서만 다름**
```systemverilog
parameter int N = 4;
logic [7:0] mem   [0:N-1];    // 오름차순 선언
logic [7:0] mem_r [N-1:0];    // 내림차순 선언

foreach (mem[i]) begin mem[i] = 8'h10 + i; mem_r[i] = 8'h10 + i; end

// 1) 범위 무관하게 전부 돌기 : $low ~ $high (작은 번호 → 큰 번호)
for (int i = $low(mem_r); i <= $high(mem_r); i++) ...        // 0 1 2 3

// 2) 선언한 순서대로 돌기 : $left 에서 시작, $increment 만큼 빼면서 $size 번
for (int i = $left(mem_r), k = 0; k < $size(mem_r); i -= $increment(mem_r), k++) ...   // 3 2 1 0
```

| 결과 | `mem [0:3]` | `mem_r [3:0]` |
|---|---|---|
| `$left` / `$right` | `0` / `3` | `3` / `0` |
| `$low` / `$high` | `0` / `3` | `0` / `3` (같음) |
| `$increment` | `-1` | `1` |
| 선언 순서 루프 (2번) | `[0]=10 [1]=11 [2]=12 [3]=13` | `[3]=13 [2]=12 [1]=11 [0]=10` |
| `foreach` 순서 | `0 1 2 3` | `3 2 1 0` (**`foreach`도 left → right**) |

- `$increment`는 "왼쪽에서 오른쪽으로 갈 때 **빼야 하는** 값"이라 `i -= $increment`
- 순서가 상관없으면 그냥 `foreach`가 제일 간단 (순서는 선언 방향을 따름)

**예2. 다차원 (packed + unpacked 섞은 레지스터 파일)**
```systemverilog
logic [3:0][7:0] regs [16];   // 32비트 레지스터 16개, 각각 바이트 4개
// 차원 번호 : 1 = [16] (unpacked)  →  2 = [3:0]  →  3 = [7:0]

for (int r = $low(regs,1); r <= $high(regs,1); r++)       // 레지스터 16개
    for (int b = $low(regs,2); b <= $high(regs,2); b++)   // 바이트 4개
        regs[r][b] = r*16 + b;
```

| 식 | 결과 |
|---|---|
| `$dimensions(regs)` / `$unpacked_dimensions(regs)` | `3` / `1` |
| `$size(regs,1)` / `$size(regs,2)` / `$size(regs,3)` | `16` / `4` / `8` |
| `$bits(regs)` (전체 비트 수, 비교용) | `512` (= 16 × 32) |
| `regs[1]` / `regs[15]` | `13121110` / `f3f2f1f0` |

- `regs`를 `[32]`나 `[7:0][7:0]`으로 바꿔도 루프 코드는 그대로 동작 → **숫자 박지 말 것**의 이유

**예3. 동적 배열에도 사용 가능 (실행 중 크기가 바뀌는 배열)**
```systemverilog
int dyn [];
dyn = new[5];         // $size(dyn) = 5, dyn.size() = 5, $high(dyn) = 4
dyn = new[8](dyn);    // 크기 늘리고 기존 값 유지 → $size(dyn) = 8, $high(dyn) = 7
```
- 동적 배열·queue는 보통 `.size()` 메서드를 쓰지만 `$size`도 같은 값 → 고정 배열과 동적 배열을 **같은 코드로** 다룰 때 `$size` / `$high` 사용

---

## 7. 합성되지 않는 array

| 배열 | 이유 | 쓰는 곳 |
|---|---|---|
| **동적 배열** `int d[];` | 실행 중에 `new[n]`으로 크기가 바뀜 → 하드웨어는 크기가 고정 | TB (1118 3번) |
| **연관 배열** `int a[string];` | 쓰는 순간 칸이 생김, key가 문자열 등 | TB — 메모리 모델, 이름별 표 |
| **queue** `int q[$];` | `push`/`pop`으로 길이가 계속 바뀜 | TB — scoreboard 기대값 저장 (1111) |
| 원소가 `real`, `string`, class 핸들인 배열 | 원소 타입 자체가 하드웨어로 못 만듦 | TB |

> 정리 : **설계(RTL)는 고정 크기 packed/unpacked만**, 크기가 변하는 배열과 그 method(`size()`, `push_back()` …)는 **검증(TB) 전용**.

---

# 1123 (월) — 명세서 · 취업 이야기 · RTL function · 등호 연산자 6가지 · block label · unique / priority

> **핵심 한 줄** : AI가 RTL·TB를 만들어 주는 시대라 **명세서(spec)를 정확히 쓰는 능력**이 중요해졌다. RTL에서 반복되는 조합 논리는 **`function automatic`**으로 묶고, 비교는 **X/Z를 어떻게 다룰지**에 따라 `==` / `===` / `==?`를 골라 쓴다. **`unique` / `priority`**는 "조건이 겹치지 않는다 / 순서가 중요하다"는 설계 의도를 코드에 적어 **시뮬레이터·합성 툴이 같은 뜻으로 읽게** 하고, 어기면 시뮬레이션에서 경고가 난다.

| # | 목차 |
|---|------|
| 1 | 명세서(spec)와 AI 에이전트 (질문 답변) |
| 2 | 취업·포트폴리오 이야기 |
| 3 | RTL에서 `function` 쓰는 예 (요청) |
| 4 | 등호 연산자 6가지 |
| 5 | block label — `begin : 이름 … end : 이름` |
| 6 | `unique` / `priority` |

> 이 날 예시 출력은 전부 **서버 VCS (W-2024.09)**로 직접 돌려서 확인한 값.

---

## 1. 명세서(spec)와 AI 에이전트

| 수업 내용 | 정리 |
|---|---|
| 명세서를 잘 만들어야 함 | 이제 VCS 같은 툴 환경에서 **AI 에이전트가 로그 분석**까지 해 줌 |
| AI가 툴을 쓰는 건 당연 | 예전엔 IT팀에 요청하던 일(스크립트·환경 구성 등)을, 이제 **Verilog 엔지니어가 명세서를 쓰면 에이전트가 상당 부분 만들어 줌** |

> **Q. 명세서가 뭔지?**
> **A.** 명세서(specification, spec) = **"이 블록이 무엇을 해야 하는지"를 빠짐없이 적은 문서**. 코드를 짜기 전에 쓰고, 설계(RTL)와 검증(TB) 둘 다 이걸 기준으로 만든다. AI 에이전트에게 일을 시킬 때도 이게 **입력**이 되므로, 애매하게 쓰면 결과도 애매해진다.

**명세서에 들어가는 것 — UART TX(1112~1113)를 예로**

| 항목 | 내용 | UART TX 예 |
|---|---|---|
| **기능** | 무엇을 하는가 | 8비트 데이터를 직렬로 전송 (LSB 먼저) |
| **인터페이스(포트)** | 신호 이름·폭·방향·의미 | `tx_data[7:0]`, `tx_start`, `tx`, `tx_busy` |
| **프로토콜·타이밍** | 언제 무엇이 바뀌는가 | start bit 0 → data 8개 → stop bit 1, 1비트 = baud time |
| **파라미터** | 바꿀 수 있는 설정 | `CLK_FREQ = 100MHz`, `BAUD = 9600` |
| **동작 조건·예외** | 경계·에러 상황 | 전송 중 `tx_start`가 오면? 리셋 중에는? |
| **검증 기준** | 무엇을 맞다고 볼지 | 비트 길이 허용오차 ±1 tick, frame 길이 ±½ baud (1113 2번) |

> 1112의 **검증 플랜**이 바로 명세서에서 나오는 것. 명세서가 정확해야 검증 플랜·커버리지 목표도 정확해진다.

---

## 2. 취업·포트폴리오 이야기

| 이야기 | 정리 |
|---|---|
| 경력자들도 이직을 안 함 | 업계가 어떻게 될지 몰라서 → 신입 자리가 더 귀함 |
| 10월 졸업자 취업률 약 **40%** | "될 만한 친구들이 되었다" → 준비된 사람이 붙는다 |
| **포트폴리오** | 평소에 한 것을 잘 정리 → **HTML로 변환** → **URL·QR 코드**를 붙여서 "무엇을 했다"를 바로 보여줄 수 있게 |
| 합격하는 친구들은 다르다 | **미리미리 준비** — 이번 주 **목·금 정리 필수** |
| **AI / AX** | AX = **AI Transformation** (AI 전환). AI를 써서 업무를 **자동화**하는 것이 요즘 트렌드 |

> 이 수업 정리(sv.md / uvm.md)와 직접 검증해 본 예제들이 그대로 포트폴리오 재료가 된다.

---

## 3. RTL에서 `function` 쓰는 예

> 메모: "RTL 설계에서 function 쓰는 예시를 좀 들어주면 될 것 같음"

**RTL function 규칙**

| 규칙 | 이유 |
|---|---|
| **`function automatic`**으로 선언 | 호출마다 변수를 새로 잡음 → 여러 곳에서 불러도 값이 섞이지 않음 (1118 7번) |
| **시간 지연 금지** (`#`, `@`, `wait`) | function은 **조합 논리**로 합성됨 → 시간 개념이 없어야 함 |
| 입력만 받고 **값 하나를 return** | 하드웨어로는 "입력 → 출력" 조합 회로 한 덩어리 |
| `assign` / `always_comb` / `always_ff` 안에서 호출 | 같은 논리를 여러 곳에서 쓸 때 **복붙 대신 함수 하나** |

**예 — gray code 변환 · parity · 주소 폭 계산 (VCS 확인)**

```systemverilog
module conv #(parameter int N = 4) (
    input  logic [N-1:0] bin,
    output logic [N-1:0] gray,
    output logic         par
);
    // ① binary → gray code (FIFO 포인터 등에서 사용)
    function automatic logic [N-1:0] bin2gray(input logic [N-1:0] b);
        return b ^ (b >> 1);
    endfunction

    // ② parity : 1의 개수가 홀수면 1 (UART parity bit 등)
    function automatic logic parity(input logic [N-1:0] d);
        logic p = 1'b0;
        for (int i = 0; i < N; i++) p ^= d[i];   // for 는 펼쳐져서 XOR 트리가 됨
        return p;
    endfunction

    assign gray = bin2gray(bin);
    always_comb par = parity(bin);
endmodule

// ③ constant function : parameter 계산용 (elaboration 때 한 번 계산 → 하드웨어 X)
function automatic int clog2(input int v);
    int r = 0;  v = v - 1;
    while (v > 0) begin r++; v >>= 1; end
    return r;
endfunction
localparam int DEPTH = 10;
localparam int AW    = clog2(DEPTH);   // 주소 폭 4  (내장 $clog2(DEPTH) 와 같음)
```

| 입력 `bin` | `gray` | `parity` |
|---|---|---|
| `0000` | `0000` | 0 |
| `0001` | `0001` | 1 |
| `0010` | `0011` | 1 |
| `0011` | `0010` | 0 |
| `0100` | `0110` | 1 |
| `0101` | `0111` | 0 |
| `clog2(10)` | `AW = 4` | (`$clog2(10)` = 4, 같음) |

| 자주 쓰는 RTL function | 용도 |
|---|---|
| bin ↔ gray | 비동기 FIFO 포인터 (1110 6-2) |
| parity / CRC | 통신 에러 검출 |
| one-hot → binary, 우선순위 인코더 | arbiter, 인터럽트 |
| 폭 계산 (`clog2`) | parameter로 포트·배열 크기 정하기 |

---

## 4. 등호 연산자 6가지

| 연산자 | 이름 | X·Z가 있으면 | 합성 |
|---|---|---|---|
| **`==`** | 논리 등호 | 결과가 **`x`** (모름) | ✅ |
| **`!=`** | 논리 부등호 | 결과가 **`x`** | ✅ |
| **`===`** | case 등호 | X·Z도 **글자 그대로 비교** → 항상 0 또는 1 | ❌ (TB 전용) |
| **`!==`** | case 부등호 | X·Z도 글자 그대로 비교 | ❌ (TB 전용) |
| **`==?`** | wildcard 등호 | **오른쪽**의 X·Z(`?`)는 **"상관없음(don't care)"** | ✅ (오른쪽이 상수일 때) |
| **`!=?`** | wildcard 부등호 | 오른쪽의 X·Z는 상관없음 | ✅ |

**VCS 확인**

| 식 | 결과 | 설명 |
|---|---|---|
| `4'b10x1 == 4'b10x1` | `x` | X가 끼면 "같은지 모름" |
| `4'b10x1 === 4'b10x1` | `1` | X까지 똑같이 생겼으니 같음 |
| `4'b1011 == 4'b1xx1` | `x` | |
| `4'b1011 === 4'b1xx1` | `0` | 가운데가 `01` vs `xx`라 다름 |
| `4'b1011 ==? 4'b1xx1` | `1` | 가운데 2비트는 **무시**, 양끝 `1_1`만 비교 → **마스크 비교** |
| `4'b1011 ==? 4'b0xx1` | `0` | 맨 앞 비트가 다름 |
| `4'b1z11 ==? 4'b1111` | `x` | **왼쪽**의 Z는 무시되지 않음 (don't care는 오른쪽만) |

| 언제 무엇을 | |
|---|---|
| RTL 비교 | `==` / `!=` |
| TB에서 X가 나왔는지까지 정확히 비교 | `===` / `!==` (또는 `$isunknown`, 1119 2번) |
| 명령어 디코드처럼 **일부 비트만** 비교 | `==?` (`opcode ==? 7'b??0_0011`) |

---

## 5. block label — `begin : 이름 … end : 이름`

```systemverilog
begin : blk_sum
    int s = 0;
    for (int i = 0; i < 4; i++) s += i;
    $display("%m : s=%0d", s);       // → tb.blk_sum : s=6  (VCS 확인)
end : blk_sum                         // end 뒤 이름은 선택. 쓰면 begin 이름과 같아야 함
```

| 효과 | 설명 |
|---|---|
| **가독성** | 긴 블록의 끝이 어느 begin인지 바로 보임 |
| **계층 이름이 생김** | 블록 안에서 선언한 변수가 `tb.blk_sum.s`처럼 **이름으로 접근**되고, 파형(Verdi)에서도 찾기 쉬움 |
| **이름 검사** | end 이름이 다르면 **컴파일 에러** — VCS: `Error-[SVBENM] End name does not match the begin name` (직접 확인) |
| `disable 이름;` | 그 블록을 **중간에 빠져나갈** 때 사용 |
| generate 블록 | 이름을 안 주면 `genblk1`처럼 자동 이름 → **이름을 주는 게 관례** |

> `module … endmodule : 이름`, `function … endfunction : 이름`, `class … endclass : 이름`도 같은 방식으로 쓸 수 있다.

---

## 6. `unique` / `priority`

> 메모: "설계자의 생각을 코드에 적어, 모든 툴이 같은 **뜻**으로 읽게 한다" (메모의 "듯" → "뜻")
> 일반 `if-else` / `case`는 "조건이 겹칠 수 있는지, 아무것도 안 맞을 수 있는지"를 툴이 **추측**해야 한다. `unique` / `priority`로 **설계 의도를 선언**하면, 시뮬레이터는 **어기면 경고**하고 합성 툴은 그 의도대로 회로를 만든다.

| 키워드 | 선언하는 뜻 | 시뮬레이션에서 경고가 나는 경우 | 합성 |
|---|---|---|---|
| **`unique`** if / case | 조건이 **서로 겹치지 않고**, **반드시 하나는 맞는다** | 둘 이상 맞음 / 하나도 안 맞음 | 우선순위 없이 **병렬** 비교 회로 (더 작고 빠름) |
| **`priority`** if / case | **순서가 의미를 가진다** (먼저 맞는 것이 이김), **반드시 하나는 맞는다** | 하나도 안 맞음 | **우선순위** 회로 (위에서부터) |
| `unique0` | 겹치지 않음 (안 맞는 건 허용) | 둘 이상 맞음 | 병렬 |

**VCS 확인 — 위반하면 실제로 나오는 경고**

| 코드 | 상황 | VCS 경고 |
|---|---|---|
| `unique case (sel)` 00/01/10만 있음 | `sel = 11` → **아무것도 안 맞음** | `Warning-[RT-NCMUCS] No condition matches in statement` |
| `unique casez (sel)` `2'b0?`, `2'b?1` | `sel = 01` → **두 줄 다 맞음** | `Warning-[RT-MTOCMUCS] More than one condition match in statement` |
| `unique if (sel[0]) … else if (sel[1])` | `sel = 11` → **둘 다 맞음** | `Warning-[RT-MTOCMUIF] More than one condition match in statement` |
| `priority if (sel[0]) y=1; else if (sel[1]) y=2;` | `sel = 11` | 경고 없음, **`y = 1`** (먼저 맞은 것) |
| 같은 `priority if` | `sel = 00` → **아무것도 안 맞음** | `Warning-[RT-NCMPRIF] No condition matches in statement` |

| 예 | 쓰는 키워드 |
|---|---|
| FSM의 `case (state)` — 상태는 한 번에 하나 | `unique case` |
| 디코더 (주소 영역이 겹치지 않음) | `unique case` / `unique if` |
| 인터럽트·요청 처리 (동시에 오면 높은 우선순위 먼저) | `priority if` |

> ⚠️ `unique`를 선언해 놓고 실제로 겹치거나 빠진 경우가 생기면, 합성 회로는 "안 겹친다"고 믿고 만들었기 때문에 **시뮬레이션과 실제 하드웨어 동작이 달라질 수 있다**. 그래서 시뮬레이션의 `RT-` 경고를 **절대 무시하면 안 된다**.

---

# 1124 (화) — interface · modport · interface 안의 function/task · assertion · clocking block

> **핵심 한 줄** : **interface**는 여러 신호를 **한 묶음**으로 만들어 모듈·TB에 한 번에 연결하는 것이고, **modport**로 "이 쪽에서는 이 신호만, 이 방향으로" 쓰도록 **역할별 창구**를 만든다. interface 안에는 **function·task·assertion**도 넣을 수 있어서, 버스 규칙 검사를 interface 한 곳에서 할 수 있다. **clocking block**은 샘플·구동 시점(skew)을 정해두는 것이라, driver는 `@(vif.cb)`로 **몇 번째 clock인지만** 정하면 된다.

| # | 목차 |
|---|------|
| 1 | interface 구성 |
| 2 | modport — 방향·접근 제한 (질문 답변) |
| 3 | `.` vs `::` |
| 4 | interface 안의 function / task |
| 5 | interface 안의 assertion |
| 6 | 선언 위치 |
| 7 | 전체 예시 (VCS 확인) |
| 8 | clocking block — 왜 쓰나 · driver 타이밍 (질문 답변) |

> 이 날 예시 출력·에러 메시지는 전부 **서버 VCS (W-2024.09)**로 직접 돌려서 확인한 값.

---

## 1. interface 구성

| 순서 | 넣는 것 | 예 |
|---|---|---|
| 1 | **포트(입력) 선언** — 바깥에서 받아오는 신호 | `interface bus_if (input logic clk);` |
| 2 | **신호** 선언 | `logic req, gnt;  logic [7:0] data;` |
| 3 | **modport** — 역할별 방향 | `modport master (input clk, gnt, output req, data);` |
| 4 | function / task (선택) | 버스 동작을 함수로 |
| 5 | assertion (선택) | 버스 규칙 검사 |

| interface를 쓰면 좋은 점 | 설명 |
|---|---|
| 연결이 짧아짐 | 신호 10개를 포트 10개로 잇던 걸 **`.m(bus)` 하나**로 |
| 신호 추가가 쉬움 | interface에 한 줄 추가하면 모든 모듈에 반영 (포트 목록 수정 X) |
| TB와 공유 | TB class는 **virtual interface**로 같은 interface에 접근 (uvm.md 1120 13번 config_db) |

---

## 2. modport — 방향·접근 제한

> interface 신호에는 원래 방향이 없다. **modport**로 "**master 쪽에서 보면** req는 output, gnt는 input"처럼 **역할별 방향**을 정해준다.

```systemverilog
modport master  (input clk, gnt,      output req, data, import ones, wait_cycles);
modport slave   (input clk, req, data, output gnt);
modport monitor (input clk, req, gnt, data);              // 관찰만 → 전부 input
```

| 모듈 포트 선언 | 연결 | 의미 |
|---|---|---|
| `module master_m (bus_if.master m);` | `master_m u_m (.m(bus));` | 인스턴스 **전체**를 넘겨도, 모듈이 `bus_if.master`라고 선언했으니 **master modport로 제한** |
| `module slave_m (bus_if.slave s);` | `slave_m u_s (.s(bus.slave));` | `인스턴스.modport`로 넘겨도 같음 |

> **Q. 누락되어도 되나? 연결하고 싶은 것만 연결할 수 있나? (modport 여러 개 선언할 때)**
>
> **A1. modport에는 그 역할에 필요한 신호만 넣으면 된다 (누락 OK).** modport마다 신호 목록이 달라도 되고, 모든 신호를 다 넣을 필요 없다. 대신 **modport에 없는 신호는 그 modport로는 접근할 수 없다** (컴파일 에러).
>
> **A2. 연결 자체는 "신호 일부만"이 아니라 interface 단위로 한다.** 모듈에는 interface 인스턴스(또는 `인스턴스.modport`)를 통째로 연결하고, **무엇을 쓸 수 있는지는 modport가 정한다**.

**VCS로 확인한 제한**

| 상황 | 결과 |
|---|---|
| slave modport에 `data`가 없는데 `s.data` 사용 | `Error-[SV-SNVVM] Signal not visible via modport` — "Variable 'data' … cannot be accessed from instance 's'" |
| slave modport에서 `input`인 `req`에 `s.req = 1` | `Error-[MPCBD] Modport port cannot be driven` — "restricted as an input port" |
| ⚠️ interface **포트인 `clk`도** modport에 안 넣으면 | `s.clk` 사용 시 `Error-[SV-SNVVM]` → **clk도 modport에 `input clk`로 넣어야 함** |

---

## 3. `.` vs `::`

> 메모: "실체가 있을 때는 `.` / 간접으로 존재할 때는 `::`"

| 연산자 | 언제 | 예 |
|---|---|---|
| **`.`** | **실체(인스턴스·객체)가 있을 때** 그 안의 멤버 | `bus.gnt` (interface 인스턴스), `m.req` (modport 포트), `tr.data` (객체), `bus.slave` (인스턴스의 modport) |
| **`::`** | 실체 없이 **이름 공간(타입)** 안의 것 | `uvm_pkg::uvm_test` (package), `Packet::LARGE` (class 안 enum), `Paket::count` (class static 멤버) — 1118 14번 |

> 정리 : 메모의 "간접으로 존재"는 **인스턴스 없이 정의(package·class 타입)만 있는 경우**. interface 신호는 인스턴스(`bus`)가 있어야 존재하므로 항상 `.`으로 접근한다.

---

## 4. interface 안의 function / task

> 메모: "function만 void로 넣을 수 있음"
> → **정정** : interface 안에는 **function(반환 타입 아무거나)과 task 둘 다** 넣을 수 있다. VCS로 `int`를 돌려주는 function과 시간이 흐르는 task를 넣어서 확인함. modport에서 **`import`**로 열어줘야 그 modport 쪽에서 부를 수 있다.

```systemverilog
function automatic int ones(logic [7:0] d);   // int 반환 function
    return $countones(d);
endfunction
task automatic wait_cycles(int n);            // 시간이 흐르는 task
    repeat (n) @(posedge clk);
endtask
modport master (…, import ones, wait_cycles); // master 쪽에서 쓸 수 있게 열어줌
```

| 호출 (master 모듈 안) | 결과 (VCS 확인) |
|---|---|
| `m.wait_cycles(2);` | clock 2번 기다림 → 15ns |
| `m.ones(m.data)` (`data = 8'hF0`) | `4` |

---

## 5. interface 안의 assertion

> interface에 assertion을 넣으면, 이 interface를 쓰는 **모든 곳에서 버스 규칙이 자동으로 검사**된다 (TB·DUT 코드에 따로 안 넣어도 됨).

```systemverilog
// 규칙 : gnt 는 직전 clock 에 req 가 있었을 때만 1
property p_gnt_after_req;
    @(posedge clk) gnt |-> $past(req);
endproperty
a_gnt: assert property (p_gnt_after_req) else $error("[ASSERT] gnt without req");
```

| 상황 (VCS 확인) | 결과 |
|---|---|
| 정상 동작 (req → 다음 clock gnt) | 에러 없음 |
| 60ns에 `gnt = 1`, `req = 0`으로 강제 | `Error: "t.sv", 14: tb.bus.a_gnt: at time 75` / `[ASSERT] gnt without req` |

> ⚠️ 처음 예시에서 master가 clock edge와 **같은 시각에 blocking(`=`)으로 req를 바꿨더니** 정상 동작에서도 25ns에 assertion이 걸렸다 (edge에서 TB·DUT 순서가 섞이는 **race**, 1110 내용). **nonblocking(`<=`)**으로 바꾸자 의도한 위반 시점에서만 걸림 → assertion이 TB 타이밍 실수도 잡아준다.

---

## 6. 선언 위치

> 메모: "3. 소스의 최상단 or package의 …" (메모가 중간에 끊김 → 확인한 사실로 정리)

| 위치 | 가능? |
|---|---|
| **파일 최상단** (module 밖, module처럼 따로) | ✅ 일반적인 위치 |
| **package 안** | ❌ VCS: `Error-[USVSNM] … 'interface' inside 'package' is not allowed.` (직접 확인) |
| interface가 쓰는 **타입**(typedef, enum, struct) | ✅ **package**에 두고 interface에서 `import` |

> 컴파일 순서 : interface 파일을 **그걸 쓰는 module/TB보다 먼저** filelist에 둔다 (package와 같은 원리, 1118 5번).

---

## 7. 전체 예시 (VCS 확인)

```systemverilog
interface bus_if (input logic clk);                        // 1. 포트
    logic       req, gnt;                                  // 2. 신호
    logic [7:0] data;
    function automatic int ones(logic [7:0] d);            // 4. function
        return $countones(d);
    endfunction
    task automatic wait_cycles(int n);                     // 4. task
        repeat (n) @(posedge clk);
    endtask
    modport master  (input clk, gnt, output req, data, import ones, wait_cycles);   // 3. modport
    modport slave   (input clk, req, data, output gnt);
    modport monitor (input clk, req, gnt, data);
    property p_gnt_after_req; @(posedge clk) gnt |-> $past(req); endproperty        // 5. assertion
    a_gnt: assert property (p_gnt_after_req) else $error("[ASSERT] gnt without req");
endinterface

module master_m (bus_if.master m);
    initial begin
        m.req <= 0;  m.data <= 8'hF0;
        m.wait_cycles(2);
        $display("%0t [master] data=%h ones()=%0d", $time, m.data, m.ones(m.data));
        m.req <= 1;
    end
endmodule

module slave_m (bus_if.slave s);
    always @(posedge s.clk) s.gnt <= s.req;
endmodule

module tb;
    logic clk = 0;  always #5 clk = ~clk;
    bus_if   bus  (clk);
    master_m u_m (.m(bus));          // 인스턴스 전체 → 모듈이 master 로 제한
    slave_m  u_s (.s(bus.slave));    // 인스턴스.modport
    initial begin
        #60  $display("%0t [tb] gnt=%b", $time, bus.gnt);
        force bus.gnt = 1;  force bus.req = 0;               // 규칙 위반 만들기
        #30  $finish;
    end
endmodule
```

```
15 [master] data=f0 ones()=4
60 [tb] gnt=1
Error: "t.sv", 14: tb.bus.a_gnt: at time 75
[ASSERT] gnt without req
Error: "t.sv", 14: tb.bus.a_gnt: at time 85
[ASSERT] gnt without req
```

---

## 8. clocking block — skew를 정해두고, driver는 clock만 기다린다

> 1118 4번에서 "TB ↔ DUT race 방지"로 처음 나온 것. 이번엔 **왜 쓰는지**와 **driver 코드가 어떻게 바뀌는지**.

```systemverilog
package tb_pkg;
    parameter time OUT_SKEW = 2ns;                       // skew 값을 한 곳에서 관리
endpackage

interface dff_if #(parameter time SKEW = tb_pkg::OUT_SKEW) (input logic clk);
    logic d, q;
    clocking cb @(posedge clk);                          // 기준 clock
        default input #1step output #SKEW;               // 입력 : edge 직전 값 / 출력 : edge + SKEW
        output d;                                        // TB → DUT
        input  q;                                        // DUT → TB
    endclocking
endinterface
```

### 8-1. 왜 쓰나

| 메모 | 정리 |
|---|---|
| "지연값을 파라미터로 설정할 수 있음" | ✅ `output #SKEW`처럼 skew를 **parameter**로 쓸 수 있다 → 신호마다 `#1` 같은 숫자를 박지 않아도 됨 |
| "package에서 선언해서 지연값으로 다양한 시뮬레이션" | ✅ package에 두면 **값 한 곳만 고쳐서** 전체 TB의 skew를 바꿈. ⚠️ 단, **package parameter는 바깥에서 재정의할 수 없다** (1118 6-2) → 값을 바꾸려면 package를 고쳐서 **다시 컴파일**. 시뮬레이션마다 다르게 주고 싶으면 **interface parameter로 받아서 인스턴스에서 override** (아래 B) |

| 쓰는 이유 정리 | |
|---|---|
| ① race 방지 | 입력은 edge **직전(1step)** 값을 샘플, 출력은 edge **뒤(skew)**에 구동 → TB와 DUT가 같은 edge에서 섞이지 않음 (1110 race) |
| ② 타이밍을 한 곳에 | 언제 샘플·구동할지를 clocking block이 정함 → driver·monitor 코드에 `#1`, `negedge` 같은 타이밍 코드가 사라짐 |
| ③ 실제 하드웨어처럼 | output skew = 실제 FF의 clock-to-Q 지연과 같은 역할 |

### 8-2. Q. clocking block을 쓰면 driver run_phase에서 clock 기준 drive 시점을 안 잡아도 되나?

> **A. 반은 맞음.** "**몇 번째 clock에** 보낼지"는 driver가 `@(vif.cb)`로 정해야 한다. 하지만 "**그 clock edge에서 몇 ns 뒤에** 핀을 바꿀지"는 **clocking block이 알아서** 한다. → `@(posedge clk); #1;` 같은 타이밍 코드는 필요 없다.

| clocking block 없이 | clocking block 사용 |
|---|---|
| `@(posedge vif.clk);` | `@(vif.cb);` ← **clock 기다리기는 여전히 필요** |
| `#1;` (race 피하려고 직접 지연) | (필요 없음 — skew가 대신) |
| `vif.d = tr.d;` | `vif.cb.d <= tr.d;` ← **반드시 `<=`** |
| 샘플 : `@(negedge)`에서 읽거나 타이밍 고민 | `vif.cb.q` 읽기 → 자동으로 edge **직전 값** |

```systemverilog
class driver;
    virtual dff_if vif;
    task run();
        repeat (3) begin
            @(vif.cb);                  // ① 다음 clock edge 까지 기다림 (몇 번째 clock 인지는 driver 가 정함)
            vif.cb.d <= ~vif.cb.q;      // ② 핀에 언제 나갈지는 clocking block 이 정함 (edge + SKEW)
        end
    endtask
endclass
```

### 8-3. 실행 결과 (VCS 확인) — A는 package 기본값 2ns, B는 인스턴스에서 4ns로 override

```systemverilog
dff_if               vif_a (clk);    // SKEW = tb_pkg::OUT_SKEW = 2ns
dff_if #(.SKEW(4ns)) vif_b (clk);    // 이 인스턴스만 4ns
```

```
  5 ns [drv] cb.d <= 1 예약 (sampled q=0)     ← edge(5ns)에서 driver 가 예약만 함
  7 ns   [pin A] d -> 1                       ← A : 5 + 2ns 에 핀 변화
  9 ns   [pin B] d -> 1                       ← B : 5 + 4ns 에 핀 변화
 15 ns [drv] cb.d <= 1 예약 (sampled q=0)     ← DUT 는 15ns edge 에서 q=1 이 되지만, TB 는 edge "직전" 값 0 을 봄
 25 ns [drv] cb.d <= 0 예약 (sampled q=1)     ← 한 cycle 뒤에야 q=1 이 보임
 27 ns   [pin A] d -> 0
 29 ns   [pin B] d -> 0
```

| 관찰 | 의미 |
|---|---|
| driver는 5·15·25ns(edge)에만 동작 | driver 코드에 `#` 지연이 하나도 없음 → **타이밍은 clocking block 담당** |
| 핀은 7ns(A) / 9ns(B) | **output skew**가 parameter대로 적용됨 → 인스턴스마다 다른 skew 가능 |
| 15ns에 sampled q가 아직 0 | **input #1step** — DUT가 그 edge에서 바꾼 값은 **다음 edge에서** 보임 (1118 4번 Q&A와 같음) |

### 8-4. 주의할 점

| 주의 | 이유 |
|---|---|
| clocking block 출력에는 **`<=`만** | `vif.cb.d = 1;` (blocking) → VCS `Error-[SV-IDOCBO] Illegally driving clocking block output … driven by a blocking assignment` (직접 확인) |
| 샘플은 **`vif.cb.q`**로 읽기 | `vif.q`로 바로 읽으면 clocking block을 거치지 않아서 1step 샘플이 적용 안 됨 → race가 다시 생길 수 있음 |
| modport로 묶기 | `modport tb (clocking cb);` → TB 쪽은 clocking block으로만 접근하게 제한 (2번 modport) |
