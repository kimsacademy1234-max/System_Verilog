# UVM 수업 정리

> `class.md`에서 분리한 파일. 섹션 번호는 원본 번호 그대로 유지 (본문의 "1118 17번" 같은 참조가 그대로 맞도록). SV 내용은 `sv.md`.

| 날짜 | 주제 |
|---|---|
| [1105 (목)](#1105-목--sv-특징--crv--uvm--자료형) | UVM 개요 · 내 class TB ↔ UVM 대응 |
| [1109 (월)](#1109-월--hold-count--ram-검증--시험--uvm-발표) | UVM 발표 계획 |
| [1118 (수)](#1118-수--검증-툴--sv-자료형--package--static--class-심화-은닉화--상속--파라미터화) | 업계 동향 (UVM 자동화) · UVM 파라미터화 class · mailbox 대신 TLM |
| [1119 (목)](#1119-목--2-state-vs-4-state--casting--typedef--enum--다형성--추상-class--uvm-개요) | UVM에서 다형성 + casting · multi-agent · UVM이란 (SV TB 대응 · 트리 구조 · 동작 흐름 · 라이브러리) |
| [1120 (금)](#1120-금--struct--union--packed-vs-unpacked-array--uvm-phase--sequence-driver-handshake--factory) | UVM phase · objection · object vs component · sequence-driver handshake · factory · `uvm_config_db` |
| [1123 (월)](#1123-월--tlm-통로-3가지--port--export--imp--analysis-port--uvm_subscriber) | TLM 통로 3가지 · port / export / imp · analysis port 동작 · `uvm_subscriber` (coverage) · 계층 구조로 보는 연결 |
| [1124 (화)](#1124-화--uart-top-검증-계획--seq_item-설계--multi-agent--입력-2개-scoreboard) | UART top 검증 계획 · 스펙(속도 오차 한계 계산) · 테스트 계획표 · seq_item 설계 · multi-agent (mon_in / mon_out) · 입력 2개 scoreboard (`imp_decl` / analysis FIFO) · sequence 목록 |
| [1125 (수)](#1125-수--uart-rx-검증--기대값-수집mon_in--rx만-보고-속도-구분--monitor--scoreboard-연결--타이밍-순서) | 기대값은 mon_in이 핀에서 복원 · `rx`만 보고 fast / slow / normal 구분 (edge 시각 정수배) · monitor → scb / cov 연결 · mon_in ↔ `rx_done` 순서 · 교수님 조언 |

---

# 1105 (목) — SV 특징 · CRV · UVM · 자료형

> **핵심 한 줄** : SV는 OOP로 TB를 **추상화·재사용**하고, CRV로 빠르게 검증하되 corner case는 coverage로 보완한다. 이를 표준화한 것이 **UVM**.

| # | 목차 |
|---|------|
| 3 | UVM 개요 |

---

## 3. UVM 개요

> 일반적인 class TB보다 **빠르고 표준화된** 검증 방법론. 역할 분담된 객체들을 **표준 라이브러리**로 제공.

### 3-1. 내 class TB ↔ UVM 대응

| 내가 만든 class TB | UVM | 역할 |
|---|---|---|
| transaction | `uvm_sequence_item` | 주고받는 데이터 |
| generator | `uvm_sequence` + **sequencer** | stimulus 생성 / driver로 전달 순서 관리 |
| driver | `uvm_driver` | 핀 레벨 구동 |
| monitor | `uvm_monitor` | 핀 관찰 → transaction |
| scoreboard | `uvm_scoreboard` | 비교 |
| (drv + mon 묶음) | `uvm_agent` | 인터페이스 1개 담당 단위 |
| environment | `uvm_env` | agent·scb 묶음 |
| initial 블록 시나리오 | `uvm_test` | 테스트 선택 |
| mailbox | TLM port (`seq_item_port`, `analysis_port`) | 컴포넌트 간 통신 |

### 3-2. 수업에서 나온 키워드

| 키워드 | 의미 |
|---|---|
| 등록 관리자 (factory) | class를 **factory에 등록**해 두고, 코드 수정 없이 다른 class로 **교체(override)** 생성 가능 (`uvm_component_utils` / `uvm_object_utils`) |
| 시퀀서 (sequencer) | 여러 sequence가 보내는 item을 **중재(arbitration)** 해서 driver에 하나씩 전달 |
| multi generator | 여러 sequence가 하나의 sequencer에 동시에 붙을 수 있음 → monitor·transaction 구조는 그대로 재사용 |
| phase | build → connect → run → report 순서로 자동 실행 (내가 `new`·`run` 직접 호출하던 걸 대신함) |
| config_db | virtual interface 등을 **전역 DB**로 전달 (`new()` 인자로 넘기던 방식 대체) |

---

# 1109 (월) — Hold Count · RAM 검증 · 시험 · UVM 발표

> **핵심 한 줄** : "N cycle 이상 유지"는 **hold count를 transaction에 넣어 랜덤화**하면 되고, RAM은 scoreboard에 **주소별 expected 버퍼(`logic` 배열)**를 두어 검증한다.

| # | 목차 |
|---|------|
| 7 | UVM 발표 계획 |

---

## 7. UVM 발표 계획

| 항목 | 내용 |
|---|---|
| 일정 | **11/23** 발표 예정 |
| 방식 | **2개 TOP 중 하나** 선택 → 어떻게 검증할 것인지 발표 |
| 범위 | 설계는 기존 구현 그대로 쓰고 **검증 과정만** UVM으로 |
| 이후 수업 | 23일 이후 RISC-V · APB BUS |

| 선택지 | 구성 |
|---|---|
| TOP 1 | control unit → 10000진 카운터 → fnd_controller |
| TOP 2 | UART_FIFO_ASCII_DECODER (UART_LOOP_BACK + ASCII_DECODER) |

---

# 1118 (수) — 검증 툴 · SV 자료형 · package · static · class 심화 (은닉화 · 상속 · 파라미터화)

> **핵심 한 줄** : SystemVerilog를 **전부** 지원하는 시뮬레이터는 3대 EDA 회사(Synopsys · Cadence · Siemens) 툴이고, Vivado는 **일부만** 지원한다. SV 검증에는 **동적 배열 · 연관 배열 · clocking block · DPI**가 쓰이고, 공통 정의는 **package**로 묶어서 `import`한다. class는 **`local`(자기만) / `protected`(자식까지)**로 멤버를 숨기고, `extends`로 상속한다. class의 **`static` 멤버는 모든 객체가 공유**하고, **파라미터화 class**는 타입을 바꿔 끼워 재사용한다 (UVM의 `uvm_driver #(item)`). UVM은 mailbox 대신 **TLM**(함수 호출로 핸들 전달)을 쓴다.

| # | 목차 |
|---|------|
| 1 | 업계 동향 — UVM 자동화 |
| 17 | UVM에서는? — 파라미터화 class · mailbox 대신 TLM |

---

## 1. 업계 동향 — UVM 자동화

| 항목 | 내용 |
|---|---|
| **AI 자동 디버깅** | UVM 환경에서는 **이미 AI로 자동 디버깅**을 하고 있음 |
| **UVM 자동화** | 검증 환경 구성·디버깅을 자동화하는 방향으로 가는 중 → UVM 구조를 이해하고 있어야 함 |

---

## 17. UVM에서는? — 파라미터화 class · mailbox 대신 TLM

### 17-1. UVM의 파라미터화 class

> 메모: "드라이버 객체를 만들 때 파라미터화하겠다"
> → **정정** : 객체를 만들 때(`new`)가 아니라 **class를 선언(상속)할 때** 다룰 transaction 타입을 파라미터로 정한다.

| UVM 코드 | 의미 |
|---|---|
| `class my_driver extends uvm_driver #(bus_item);` | `uvm_driver`가 다룰 item 타입을 `bus_item`으로 지정 → 16번 `Stack #(T)`와 같은 원리 |
| 효과 | 같은 `uvm_driver` 틀을 **item 타입만 바꿔서 재사용**. 내부의 sequencer 연결 포트도 `bus_item` 타입으로 맞춰짐 |

### 17-2. mailbox vs TLM

> 메모: "메일박스 대신 TLM을 쓴다 → share 메모리 방식"
> → **정정** : TLM은 공유 메모리(같은 변수에 같이 읽고 쓰기)가 **아님**. **port ↔ export를 연결해 두고 함수 호출(`put` / `get` / `write`)로 transaction 핸들을 넘기는 방식**이다. 핸들(주소)을 넘기니까 보낸 쪽과 받은 쪽이 **같은 객체를 가리키게** 됨 → 그래서 "공유"처럼 보인 것 (1110의 transaction 공유 Q&A와 같은 이야기).

| 비교 | **mailbox** (지금까지 만든 SV TB) | **TLM** (UVM) |
|---|---|---|
| 정체 | SV 내장 class: 내부 queue + `put`/`get` 블로킹 동기화 | Transaction Level Modeling: **port ↔ export** 연결 + **함수 호출** |
| 넘기는 것 | transaction **핸들** | transaction **핸들** (객체 복사 X) |
| 연결 | 같은 mailbox 핸들을 양쪽 컴포넌트에 넘겨줌 | env의 `connect_phase`에서 `port.connect(export)` |
| 1 : N | 한 번 `get` 하면 꺼내져서 **한 곳만** 받음 | **analysis port** `write()` → scoreboard·coverage 등 **여러 곳이 동시에** 받음 |
| 장점 | 간단 | 컴포넌트끼리 서로 몰라도 됨(**표준 인터페이스**) → 재사용·교체 쉬움 |

> 메모의 "mailbox는 관리해 주므로 리소스를 많이 차지" → mailbox는 내부 queue와 대기(블로킹) 처리를 따로 관리하는 객체라는 뜻. 다만 UVM이 TLM을 쓰는 **핵심 이유는 리소스보다 표준 인터페이스·컴포넌트 분리·1:N 방송**이다.

---

> **Q. TLM이랑 mailbox, 둘 다 핸들(주소)을 넘기는 거면 방식은 똑같은 것 아닌가?**
> **A. "무엇을" 넘기는지(핸들)는 같음. "어떻게" 넘기는지가 다름.** mailbox = **중간에 상자**를 두고 넣어 놓고 감, TLM = 상자 없이 **받는 쪽 함수를 직접 호출**
>
> | 비유 | mailbox | TLM (analysis port) |
> |---|---|---|
> | 전달 방식 | **택배함** : 넣어 두면 받는 사람이 **나중에 와서** 꺼냄 | **직접 건네줌** : 보내는 쪽이 받는 쪽의 `write()` 를 **그 자리에서 호출** |
> | 중간 저장 | 있음 (내부 queue) | 없음 (그냥 함수 호출) |
> | 받는 쪽 코드 실행 시점 | 받는 쪽이 `get` 할 때 (보낸 뒤 언제든) | 보낸 **순간 바로** (보내는 쪽 호출 안에서) |
> | 받는 쪽 준비 | `forever mb.get(t)` 도는 **스레드(task)** 가 있어야 함 | `function void write(T t)` **함수 하나**만 만들면 됨 |
>
> **확인** (Verilator 5.051, mailbox와 analysis port 축소판을 나란히 실행)
> ```
> == mailbox
>   [0] sender   : put 끝 (상자에 넣고 바로 다음 줄)
>   [3] receiver : 이제야 get 하러 옴
>   [3] receiver : data=7 꺼냄               ← 보낸 지 3ns 뒤에 받음
> == TLM analysis port
>   [5] scb.write : data=7                   ← 보내는 순간 받는 쪽 코드가 실행
>   [5] cov.write : data=7                   ← 연결된 곳 전부 차례로
>   [5] sender   : write 끝                  ← 받는 쪽이 다 끝나야 돌아옴
> ```
>
> **UVM 원본 `uvm_analysis_port::write`** (Accellera `src/tlm1/uvm_analysis_port.svh`, 에러 처리 생략)
> ```systemverilog
> function void write (input T t);
>     for (int i = 0; i < this.size(); i++) begin
>         tif = this.get_if(i);     // connect 된 상대(scoreboard, coverage …)
>         tif.write(t);             // ← 상대의 write() 를 직접 호출. 중간 상자 없음
>     end
> endfunction
> ```
>
> - 그래서 같은 "핸들 전달" 이어도 차이가 생김
>   - mailbox : 보내는 쪽 · 받는 쪽이 **같은 mailbox 핸들**을 알아야 함, 한 번 `get` 하면 사라져서 **1곳만** 받음
>   - TLM : 서로를 몰라도 됨 (`connect` 는 env가 해 줌), `write` 한 번에 연결된 **여러 곳이 전부** 받음
> - 상자가 필요할 때는? → **`uvm_tlm_fifo`** 를 중간에 끼움. 원본을 보면 내부에 `local mailbox #(T) m;` → **TLM 안에 mailbox가 들어간 것** (`src/tlm1/uvm_tlm_fifos.svh`)
>   - 예 : scoreboard가 expected / actual 을 각각 받아 두었다가 순서대로 비교할 때 `uvm_tlm_analysis_fifo` 사용
> - 정리 : mailbox = **"저장소"**, TLM = **"연결 규격(함수 호출 약속)"**. TLM은 필요하면 mailbox를 품을 수도 있는 더 큰 개념

---

# 1119 (목) — 2-state vs 4-state · casting · typedef · enum · 다형성 · 추상 class · UVM 개요

> **핵심 한 줄** : 설계(RTL)는 **4-state(`logic`)**로 써서 X/Z를 보이게 하고, 2-state로 옮기기 전엔 **`$isunknown()`**으로 X를 검사한다. casting은 **값은 그대로 두고 해석(타입·폭·부호)만 바꾸는 static cast**와 **실행 중에 검사하는 `$cast`**로 나뉜다. 상태값은 **`typedef enum`**으로 만들어 파형·출력에서 **이름**으로 보이게 한다. (5장) **다형성** = 상속 + virtual + 부모 핸들 → 부모 핸들로 불러도 **실제 객체**의 method가 실행되고, 부모 → 자식 핸들은 **`$cast`로만**(실제 객체가 맞을 때만) 바꿀 수 있다. **추상 class**는 규격(약속)만 정하고 자식이 구현한다. **UVM**은 이 구조를 표준 라이브러리로 만든 것 — **컴포넌트(구조)**와 **시퀀스(자극)**가 분리되어 있다.

| # | 목차 |
|---|------|
| 15 | UVM에서 다형성 + casting이 쓰이는 곳 |
| 17 | multi-agent 기법 |
| 18 | UVM이란? — SV TB 대응 · 트리 구조 · 동작 흐름 · 라이브러리 불러오기 |

> 이 날 예시 코드의 출력은 전부 **서버 VCS (W-2024.09)**로 직접 돌려서 확인한 값.

---

## 15. UVM에서 다형성 + casting이 쓰이는 곳

> 메모: "각각의 시퀀스 아이템별로 캐스팅을 이용해서 pass/fail 판독" → 정리 요청

UVM 라이브러리는 **어떤 transaction이 올지 모르기 때문에** 부모 타입(`uvm_object`, `uvm_sequence_item`)으로 받는다. 내가 만든 item의 필드를 보려면 **`$cast`로 downcasting** 해야 한다.

| 곳 | 받는 타입 (부모) | 하는 일 |
|---|---|---|
| **`do_compare(uvm_object rhs, …)`** | `uvm_object` | `$cast(rhs_, rhs)`로 내 item 타입으로 바꾼 뒤 필드 비교 → scoreboard의 `exp.compare(act)` pass/fail |
| **`do_copy(uvm_object rhs)`** | `uvm_object` | `$cast` 후 필드 복사 (clone 할 때 사용) |
| `clone()` | `uvm_object`를 **돌려줌** | `$cast(tr2, tr.clone())` 로 받아야 내 타입으로 사용 가능 |
| **factory override** | 부모 타입 핸들 | `type_id::create()`가 **자식 타입 객체**를 만들어 줘도 부모 핸들로 받아 그대로 동작 (= 다형성). 코드 수정 없이 item·driver를 바꿔 끼움 |
| `virtual function` 재정의 | — | `build_phase`, `run_phase`, `do_compare` 등은 전부 **virtual** → 내 class 것이 실행됨 |

**예시 — `do_compare`에서 `$cast` (서버 VCS + UVM 1.2로 직접 확인)**

```systemverilog
class bus_item extends uvm_sequence_item;
    rand bit [7:0] addr, data;
    `uvm_object_utils(bus_item)
    function new(string name = "bus_item"); super.new(name); endfunction

    virtual function bit do_compare(uvm_object rhs, uvm_comparer comparer);
        bus_item rhs_;
        if (!$cast(rhs_, rhs)) begin                       // downcasting + 실패 체크
            `uvm_error("CMP", "rhs is not a bus_item")
            return 0;
        end
        return super.do_compare(rhs, comparer)
               && addr == rhs_.addr && data == rhs_.data;  // 필드 비교
    endfunction
endclass
```

| 호출 | 결과 (직접 확인) |
|---|---|
| `exp.compare(act)` — addr·data 같음 | `1` (pass) |
| `act.data`만 다르게 | `0` (fail) |
| 다른 타입 item(`other_item`)과 compare | `UVM_ERROR … [CMP] rhs is not a bus_item` → `0` |

---

> **Q. `$cast(rhs_, rhs)` 는 class 타입을 비교하는 건가? 뭘 비교하는 건지 모르겠다**
> **A. 비교가 아니라 "검사 + 대입".** "`rhs` 가 가리키는 **실제 객체**가 `bus_item` 인가?" 를 검사해서, 맞으면 **같은 객체**를 `bus_item` 타입 핸들 `rhs_` 에 담아 줌. **값 비교는 그 다음 줄**(`addr == rhs_.addr …`)에서 함
>
> **등장인물** (`exp.compare(act)` 를 불렀을 때)
>
> | 이름 | 정체 | 타입 |
> |---|---|---|
> | `this` | `exp` (compare를 부른 쪽) | `bus_item` |
> | `rhs` | `act` (괄호 안에 넣은 쪽, right-hand side) | **`uvm_object`** 핸들 ← UVM이 아무 타입이나 받으려고 부모 타입으로 받음 |
> | `rhs_` | 내가 만든 빈 핸들 | `bus_item` 핸들 (처음엔 null) |
>
> - 문제 : `rhs` 는 `uvm_object` 타입 핸들이라 `rhs.addr` 이라고 쓰면 **컴파일 에러** (uvm_object에는 addr이 없음). 실제 객체는 bus_item인데 핸들 타입 때문에 못 봄
> - 해결 : `$cast(rhs_, rhs)` → 같은 객체를 **bus_item 핸들로 다시 잡음** → `rhs_.addr` 사용 가능
>
> ```
>   rhs  (uvm_object 핸들) ──┐
>                            ├──▶ [ act 객체 : bus_item, addr=10, data=AA ]
>   rhs_ (bus_item 핸들)   ──┘      ← $cast 성공 후 같은 객체를 가리킴
> ```
>
> **확인** (Verilator 5.051 + Accellera UVM 원본, `do_compare` 안에 출력 추가)
> ```
> == exp.compare(act)
>   this=exp  rhs=act (실제 class: bus_item)
>   $cast 전 rhs_ = null
>   $cast 결과=1, rhs_ = act, 같은 객체? 1          ← 검사 통과, rhs_ == rhs (복사 아님, 같은 객체)
>   비교: this.addr=10 rhs_.addr=10 / this.data=aa rhs_.data=aa
>   => 1
> == exp.compare(act) data 다름
>   $cast 결과=1, rhs_ = act, 같은 객체? 1          ← 타입은 맞으니 cast 는 성공
>   비교: … this.data=aa rhs_.data=55               ← 여기서 값이 달라 fail
>   => 0
> == exp.compare(oth)
>   this=exp  rhs=oth (실제 class: other_item)
>   $cast 결과=0, rhs_ = null, 같은 객체? 0          ← 실제 객체가 bus_item 아님 → 실패, rhs_ 그대로 null
>   => 0
> ```
>
> | 단계 | 코드 | 확인하는 것 |
> |---|---|---|
> | ① 타입 검사 + 핸들 바꿔 잡기 | `$cast(rhs_, rhs)` | `rhs` 의 **실제 객체 class** 가 `bus_item`(또는 그 자식)인가 → 맞으면 `rhs_ = rhs` |
> | ② 값 비교 | `addr == rhs_.addr && data == rhs_.data` | 두 객체의 **필드 값**이 같은가 |
>
> - ① 이 실패하면 `rhs_` 가 null 이라 ② 에서 `rhs_.addr` 를 읽는 순간 **null 접근 에러** → 그래서 `if (!$cast(...)) return 0;` 로 먼저 빠져나감
> - 정리 : `$cast` = "이 핸들, 사실 bus_item 맞지? 그럼 bus_item 핸들로 다시 잡을게" (13-1 downcasting). **같은 객체를 다른 타입 안경으로 보는 것**

---

> **Q. `uvm_object` 핸들(`rhs`)이 bus_item을 가리키게 되는 시점이 `` `uvm_object_utils(bus_item) `` 으로 등록한 순간인가?**
> **A. 아니다. 등록은 "설계도(타입)"를 factory 명단에 올리는 것뿐, 객체는 안 생김.** `rhs` 가 bus_item 객체를 가리키는 건 **`exp.compare(act)` 를 호출해서 `act` 가 인자로 넘어가는 순간**
>
> | 시점 | 일어나는 일 | bus_item 객체 | `rhs` |
> |---|---|---|---|
> | ① 컴파일 / 시뮬 시작 | `` `uvm_object_utils(bus_item) `` → factory 명단에 `"bus_item"` **타입 이름** 등록 (10번 Q의 `type_id` 등) | **없음** | 없음 |
> | ② `act = bus_item::type_id::create("act");` (또는 `new`) | **객체 생성** → `act` 핸들이 가리킴 | `act` 생김 | 없음 |
> | ③ `exp.compare(act);` | `compare(uvm_object rhs, …)` 의 인자 `rhs` 에 `act` 가 **대입** (upcasting, 자동) | — | **이때 act 를 가리킴** |
> | ④ UVM 내부 → `do_compare(rhs, comparer)` | 같은 핸들을 그대로 넘김 | — | 계속 act |
> | ⑤ `$cast(rhs_, rhs)` | 같은 객체를 bus_item 핸들로 다시 잡음 | — | `rhs_` 도 act |
>
> - ③ 의 원리 : UVM 원본 선언이 `function bit compare (uvm_object rhs, uvm_comparer comparer=null);` (`uvm_object.svh`) → 인자 타입이 **부모(`uvm_object`)** 라서 `act`(bus_item 핸들)를 넣으면 **upcasting** 으로 자동 대입. 함수 인자 넘기기 = `rhs = act;` 대입과 같음
>
> **확인** (Verilator 5.051 + Accellera UVM 원본, `new` 와 `do_compare` 안에 출력 추가)
> ```
> == 1) 시뮬 시작 : 등록은 됐지만 객체는 아직 없음
>   factory 에 "bus_item" 등록? 1        ← 등록은 이미 되어 있음
>   h = null                             ← uvm_object 핸들은 아직 아무것도 안 가리킴
>                                        ← bus_item::new 출력 없음 = 객체 0개
> == 2) 객체 생성
>   [5] bus_item::new("act") 객체 생성    ← create / new 를 불러야 비로소 생김
>   [5] bus_item::new("exp") 객체 생성
> == 3) compare 호출 : 이때 rhs = act
>   do_compare : rhs 가 가리키는 객체 = act
> ```
>
> - 등록이 하는 일 = **"bus_item 이라는 이름의 class가 있다"** 를 factory에 알려 두는 것 → 나중에 `type_id::create` · 이름으로 생성(`create_object_by_name("bus_item", …)`) · override 가 가능해짐
> - 비유 : 등록 = **메뉴판에 요리 이름 올리기**, `create` = **실제로 요리 만들기**, `compare(act)` = **그 요리를 접시(`rhs`)에 담아 건네기**

---

## 17. multi-agent 기법 (메모: "이게 뭔지 알아봐")

> 지금 배우는 건 agent 하나짜리 기초 구조. 실무 DUT는 **인터페이스가 여러 개**라서 env 안에 **agent를 여러 개** 둔다.

**agent 복습** : 인터페이스 **하나**를 담당하는 묶음 = sequencer + driver + monitor

| 형태 | 예 | 핵심 |
|---|---|---|
| **종류가 다른 agent 여러 개** | UART 칩 = **APB agent**(CPU가 레지스터 설정) + **UART agent**(TX/RX 선 구동·관찰) | 인터페이스마다 agent 하나 |
| **같은 agent 여러 개 (배열)** | 4포트 라우터 → `port_agent agt[4]` | 같은 class를 개수만큼 생성, config로 각자 다른 vif 연결 |
| **active / passive** | active = driver + monitor (자극을 줌) / passive = **monitor만** (관찰만) | DUT 출력 쪽이나, 블록 TB를 시스템 TB에 재사용할 때 passive로 |

| multi-agent에서 필요한 기법 | 하는 일 |
|---|---|
| **agent별 config object** + `uvm_config_db` | 각 agent에 **어느 vif를 쓸지, active/passive인지** 전달 |
| **virtual sequencer / virtual sequence** | 여러 agent의 sequence를 **순서·타이밍 맞춰** 실행 (예: APB로 설정 → 그다음 UART 데이터 전송) |
| **scoreboard 여러 입력** | 여러 monitor의 analysis port를 scoreboard에 연결 (`uvm_tlm_analysis_fifo`, `` `uvm_analysis_imp_decl `` 로 입력 구분) |

> 1118 17번(TLM)의 analysis port가 여기서 쓰인다 → monitor 여러 개가 scoreboard 하나로 transaction을 보냄.

---

## 18. UVM이란?

| 항목 | 내용 |
|---|---|
| 이름 | **U**niversal **V**erification **M**ethodology (메모의 "Methology" → **Methodology**) |
| 정체 | SV로 작성된 **검증용 class 라이브러리 + 작성 방법론**. 지금까지 직접 만든 generator·driver·monitor·scoreboard 구조를 **표준 틀**로 만들어 둔 것 |
| 배포 | 표준화 단체 **Accellera**(accellera.org)에서 라이브러리 다운로드 가능. IEEE 1800.2로 표준화 |
| 우리 환경 | VCS에 **UVM 1.2가 내장** → 따로 받을 필요 없이 컴파일 옵션 `-ntb_opts uvm-1.2`로 사용 (예제 Makefile에 주석으로 있는 그 옵션) |

### 18-1. 지금까지의 SV TB → UVM 대응

| 직접 만든 SV TB | UVM | 역할 |
|---|---|---|
| transaction | **`uvm_sequence_item`** | 주고받는 데이터 묶음 |
| generator | **`uvm_sequence`** | item을 만들고 **randomize** 해서 내보냄 (자극 생성) |
| mailbox (gen → drv) | **`uvm_sequencer`** + TLM 포트 | sequence의 item을 **driver에게 전달** (여러 sequence가 있으면 순서 조정) |
| driver | **`uvm_driver`** | item을 받아 **DUT 핀에 구동** |
| monitor | **`uvm_monitor`** | DUT 핀을 **관찰**해서 item으로 만들어 보냄 |
| scoreboard | **`uvm_scoreboard`** | 기대값과 비교 → pass/fail |
| — | **`uvm_agent`** | 인터페이스 하나의 sequencer + driver + monitor를 **묶어 관리** |
| environment | **`uvm_env`** | agent(들) + scoreboard(+ coverage)를 묶음 |
| test (program/initial) | **`uvm_test`** | **동작시키는 최상위**: env를 만들고 설정하고, 어떤 sequence를 돌릴지 결정 (`+UVM_TESTNAME=`으로 선택) |

### 18-2. UVM 트리 구조 ① — 컴포넌트 계층 (실행 중 객체 트리)

```
uvm_top (run_test()가 만듦)
└── test                         : uvm_test       ← 동작시키는 최상위
    └── env                      : uvm_env
        ├── agent                : uvm_agent      ← 인터페이스 1개 담당
        │   ├── sequencer        : uvm_sequencer  ← sequence 의 item 을 driver 로 전달
        │   ├── driver           : uvm_driver     ← DUT 핀 구동
        │   └── monitor          : uvm_monitor    ← DUT 핀 관찰
        └── scoreboard           : uvm_scoreboard ← 비교·판정

  sequence (uvm_sequence) ── 트리 밖. test 가 만들어서 sequencer 위에서 실행(start)
```

| 설명 | |
|---|---|
| 부모가 자식을 만든다 | test가 env를, env가 agent·scoreboard를, agent가 sequencer·driver·monitor를 `build_phase`에서 생성 |
| 이름이 경로가 됨 | `uvm_test_top.env.agent.driver` 처럼 트리 경로로 각 컴포넌트를 찾음 (config_db 설정, 로그 출처 표시에 사용) |
| multi-agent | env 아래 agent가 **여러 개** 붙는 형태 (17번) |

### 18-3. UVM 트리 구조 ② — class 상속 트리 (UVM 1.2 소스에서 확인)

```
uvm_void                                   (추상)
└── uvm_object                             (추상)  ── 데이터 쪽 : 실행 중 만들고 버림
    ├── uvm_transaction                    (추상)
    │   └── uvm_sequence_item                      ← 내 item 은 여기서 상속
    │       └── uvm_sequence_base
    │           └── uvm_sequence #(REQ,RSP)        ← 내 sequence 는 여기서 상속
    └── uvm_report_object
        └── uvm_component                  (추상)  ── 구조 쪽 : 시뮬레이션 내내 존재
            ├── uvm_test / uvm_env / uvm_agent
            ├── uvm_driver #(REQ,RSP) / uvm_monitor / uvm_scoreboard
            └── uvm_sequencer_base → … → uvm_sequencer #(REQ,RSP)
```

### 18-4. 컴포넌트 그룹 vs 시퀀스 그룹 — 완전히 분리

| 구분 | **컴포넌트 그룹** (`uvm_component`) | **시퀀스 그룹** (`uvm_object`) |
|---|---|---|
| 무엇 | test, env, agent, sequencer, driver, monitor, scoreboard | sequence, sequence_item |
| 수명 | 시뮬레이션 **처음부터 끝까지** 존재 (고정된 TB **구조**) | 실행 중에 **만들고 버림** (흘러가는 **데이터·자극**) |
| phase | `build_phase`, `connect_phase`, `run_phase` … 있음 | 없음 (sequence는 `body()`가 실행 내용) |
| 분리해서 좋은 점 | **자극(시나리오)을 바꿔도 TB 구조는 그대로** → test에서 sequence만 바꿔 끼우면 새 시나리오 | |

### 18-5. 동작 흐름

> 메모: "test → sequence → sequencer → driver / monitor → scoreboard"
> → **정정** : monitor는 driver에게서 받는 게 아니라 **DUT 핀을 직접 관찰**한다. (driver가 보낸 값이 아니라 DUT가 실제로 한 일을 봐야 검증이 됨)

```
test ──start──▶ sequence ──item(randomize)──▶ sequencer ──▶ driver ──▶ DUT
                (= generator)                 (= 전달)                  │
                                                                         ▼
                                              scoreboard ◀── monitor ◀── (DUT 핀 관찰)
                                                         analysis port
```

| 단계 | 하는 일 |
|---|---|
| test | env 생성·설정, 어떤 sequence를 어느 sequencer에서 돌릴지 정해 `start` |
| sequence (`body()`) | item 생성 → `start_item` → **randomize** → `finish_item` 반복 |
| sequencer | item을 driver에게 넘김 (driver가 `get_next_item`으로 요청) |
| driver | item을 DUT 핀 신호로 구동 → `item_done` |
| monitor | DUT 핀을 보고 item으로 복원 → analysis port `write()` |
| scoreboard | 받은 item과 기대값 비교 (15번 `compare` / `$cast`) |

### 18-6. UVM을 쓰려면 라이브러리를 불러와야 함

```systemverilog
`include "uvm_macros.svh"   // `uvm_object_utils, `uvm_info, `uvm_error 같은 매크로
import uvm_pkg::*;          // uvm_driver, uvm_test … class 들이 들어있는 package
```

| 줄 | 왜 따로 필요한가 |
|---|---|
| `` `include "uvm_macros.svh" `` | **매크로(`` `define ``)는 package의 이름 공간에 속하지 않아서 `import`로 가져올 수 없다** (컴파일 전에 글자를 바꿔치기하는 것이라 — 1118 10번) → 파일로 직접 포함 |
| `import uvm_pkg::*;` | UVM class들은 `uvm_pkg` package 안에 있음 → wildcard import (1118 6-3) |
| 컴파일 옵션 | VCS : `vcs -sverilog -ntb_opts uvm-1.2 …` |

---

# 1120 (금) — struct · union · packed vs unpacked array · UVM phase · sequence-driver handshake · factory

> **핵심 한 줄** : **struct**는 멤버를 **나란히 묶고**, **union**은 같은 비트를 **여러 이름으로 겹쳐 본다**. tagged union은 지금 어떤 멤버가 들어있는지 **tag로 기억**해서 잘못 읽으면 에러를 낸다. **packed** 배열은 **한 덩어리 벡터**(통째로 연산·부분 선택), **unpacked** 배열은 **원소가 따로**(메모리). 합성은 **고정 크기 배열만** 되고, 동적 배열·연관 배열·queue는 검증(TB) 전용이다. UVM은 **phase**(build → connect → end_of_elaboration → run → report)로 진행되고, run_phase는 **objection**이 다 내려가면 끝난다. sequence와 driver는 `start_item`/`finish_item` ↔ `get_next_item`/`item_done`으로 **handshake** 하며, 부품·item은 `new` 대신 **factory(`type_id::create`)**로 만들어 override 할 수 있게 한다.

| # | 목차 |
|---|------|
| 8 | UVM phase — 작업 단위 |
| 9 | objection — run_phase는 언제 끝나나 |
| 10 | `uvm_object` vs `uvm_component` 계열 |
| 11 | sequence ↔ driver handshake |
| 12 | factory — `type_id::create` · `this` · override |
| 13 | `uvm_config_db` — set / get 인자 해석 |

> 이 날 예시 출력은 전부 **서버 VCS (W-2024.09)**로 직접 돌려서 확인한 값.

---

## 8. UVM phase — UVM의 작업 단위

> UVM은 **phase**라는 단계로 일을 나눠서, 모든 컴포넌트가 **같은 단계를 같이** 진행한다. 직접 `initial`/task 순서를 짜던 SV TB와 달리 **실행 순서를 UVM이 관리**한다. phase는 더 잘게 세분화되어 있지만, 자주 쓰는 건 아래 5개.

| 순서 | phase | 종류 | 실행 방향 | 하는 일 |
|---|---|---|---|---|
| 1 | **`build_phase`** | function (시간 0) | **위 → 아래** (부모 먼저) | 부품(하위 컴포넌트)을 **만든다** (`type_id::create`) — 부모가 있어야 자식을 만들 수 있으니 위에서부터 |
| 2 | **`connect_phase`** | function (시간 0) | 아래 → 위 | **포트를 연결**한다 (`drv.seq_item_port.connect(sqr.seq_item_export)`) |
| 3 | **`end_of_elaboration_phase`** | function (시간 0) | 아래 → 위 | **구조 확인** (트리 출력 `uvm_top.print_topology()` 등) |
| 4 | **`run_phase`** | **task** (시간이 흐름) | **모든 컴포넌트가 동시에** | 실제 시뮬레이션. driver 구동, monitor 관찰 — "run task"라고 생각하면 되는데 **시작·끝을 UVM이 관리** |
| 5 | **`report_phase`** | function | **아래 → 위** | **결과 요약** (scoreboard 통과/실패 수 출력 등) |

**실행 순서 (서버 VCS + UVM 1.2로 직접 확인, test → e(env) → a(agent))**

```
[build]   uvm_test_top          ← 위에서
[build]   uvm_test_top.e
[build]   uvm_test_top.e.a      ← 아래로
[connect] uvm_test_top.e.a      ← 아래에서
[connect] uvm_test_top.e
[connect] uvm_test_top          ← 위로
   … run_phase (0 ~ 20ns) …
[report]  uvm_test_top.e.a      ← 아래에서
[report]  uvm_test_top.e
[report]  uvm_test_top          ← 위로
```

> 메모: "시퀀스는 run_phase가 없음" → 맞음. sequence는 컴포넌트가 아니라 `uvm_object`라서 phase가 없고, 실행 내용은 **`body()` task**에 쓴다. sequence는 test(또는 env)의 run_phase 안에서 `seq.start(sequencer)`로 실행된다.

---

> **Q. `build_phase(uvm_phase phase)` 에서 `uvm_phase` 는 어떤 타입?**
> **A. UVM 라이브러리에 있는 class.** `phase` = **"지금 실행 중인 phase" 객체를 가리키는 핸들**. UVM이 각 컴포넌트의 `build_phase` 를 부를 때 이 핸들을 넘겨줌
> - `int a` 처럼 `uvm_phase phase` = **타입 + 변수 이름**. 타입이 class라서 `phase` 는 객체 핸들
> - 출처 : Accellera UVM 원본 `src/base/uvm_phase.svh`, `uvm_common_phases.svh`, `uvm_component.svh`
>
> **상속 구조**
> ```
> uvm_object
>   └─ uvm_phase                         ← 모든 phase의 공통 부모 (raise/drop_objection 등)
>        ├─ uvm_topdown_phase            ← 위 → 아래 실행
>        │    └─ uvm_build_phase         ← 이름 "build"
>        ├─ uvm_bottomup_phase           ← 아래 → 위 실행 (connect, report …)
>        └─ uvm_task_phase               ← 시간이 흐르는 phase (run …)
> ```
>
> **누가 `phase` 를 넘겨주나** (UVM 원본 코드)
> ```systemverilog
> // uvm_component.svh : 부모 class에 virtual 로 미리 선언되어 있음
> virtual function void build_phase(uvm_phase phase);
> virtual task          run_phase  (uvm_phase phase);
>
> // uvm_common_phases.svh : build 차례가 오면 UVM이 컴포넌트마다 호출
> class uvm_build_phase extends uvm_topdown_phase;
>    virtual function void exec_func(uvm_component comp, uvm_phase phase);
>       comp.build_phase(phase);      // ← 여기서 내 build_phase 가 불림
>    endfunction
> endclass
> ```
> - 우리가 쓰는 `function void build_phase(uvm_phase phase);` = 부모(`uvm_component`)의 **virtual method 재정의** → 1118 12번 Q처럼 **인자 모양을 부모와 똑같이** 써야 함 (`phase` 안 써도 지우면 안 됨)
> - 그래서 첫 줄 `super.build_phase(phase);` 도 받은 핸들을 그대로 부모에 넘기는 것
>
> | `phase` 로 하는 일 | 어디서 | 예 |
> |---|---|---|
> | **objection 걸기/풀기** | `run_phase` (가장 많이 씀) | `phase.raise_objection(this);` / `phase.drop_objection(this);` (9번) |
> | phase 이름 확인 | 디버그 출력 | `phase.get_name()` → `"build"` |
> | 아무것도 안 함 | `build_phase` · `connect_phase` 대부분 | 받기만 하고 `super.build_phase(phase)` 에 넘김 |
>
> - 정리 : `build_phase` 에서는 형식상 받는 인자, **`run_phase` 에서는 objection 때문에 꼭 쓰는 인자**

---

## 9. objection — run_phase는 언제 끝나나

> 메모: "sv generator는 run task 횟수로 끝냄 → uvm에서는 `phase.raise_object` → drop → 이걸 env에서 하면 됨"
> → **정정** : 정확한 이름은 **`raise_objection` / `drop_objection`**. 보통 **test의 run_phase**에서 sequence 시작 전후로 건다 (env에서도 걸 수는 있지만 일반적인 위치는 test).

| SV TB | UVM |
|---|---|
| generator가 `repeat(N)` 다 돌면 끝, 또는 `#시간` 후 `$finish` | run_phase는 **"아직 할 일 있음(objection)"이 하나라도 걸려 있는 동안만** 진행 → 모두 drop 되면 다음 phase로 |

```systemverilog
task run_phase(uvm_phase phase);
    phase.raise_objection(this);   // "나 아직 일하는 중" → run_phase 안 끝남
    sq.start(env.agt.sqr);         // sequence 다 끝날 때까지 기다림
    phase.drop_objection(this);    // "끝났음" → 모두 drop 되면 run_phase 종료
endtask
```

| 실험 (VCS 확인) | 결과 |
|---|---|
| objection 걸고 실행 | item 2개 전송 → **20ns**에 run_phase 종료 → report |
| objection **안 걸고** 실행 | driver가 첫 item을 받자마자 **0ns에 바로 종료** (report time=0) → item_done도 못 함 ⚠️ |

---

## 10. `uvm_object` 계열 vs `uvm_component` 계열

> 메모의 빈 표 채움 (1119 18-4와 같은 내용을 더 자세히)

| 비교 | **`uvm_object` 계열 (데이터)** | **`uvm_component` 계열 (부품)** |
|---|---|---|
| 예 | transaction(`uvm_sequence_item`), sequence(`uvm_sequence`), config 객체 | test, env, agent, sequencer, driver, monitor, scoreboard |
| 수명 | **필요할 때 만들고 쓰고 버림** (실행 중 계속 생성) | 시뮬레이션 **처음(build)부터 끝까지** 존재 |
| 트리(계층) | ❌ 부모 없음 — 트리에 안 붙음 | ✅ **부모가 있음** → `uvm_test_top.e.a.d` 같은 경로 |
| phase | ❌ 없음 (sequence는 `body()`) | ✅ build / connect / run / report … |
| 생성자 | `new(string name = "…")` — **이름만** | `new(string name, uvm_component parent)` — **이름 + 부모** |
| factory 생성 | `item::type_id::create("it")` | `drv::type_id::create("d", this)` |
| 등록 매크로 | **`` `uvm_object_utils(클래스) ``** | **`` `uvm_component_utils(클래스) ``** |
| SV TB 대응 | transaction, generator | driver, monitor, scoreboard, environment |

| SV TB | UVM |
|---|---|
| transaction | `uvm_sequence_item` (item) |
| generator | `uvm_sequence` |

---

> **Q. `uvm_component` 에는 어떤 기능이 있나?**
> **A. "TB 부품이 되는 데 필요한 공통 기능 묶음".** driver·monitor·env·test가 전부 이걸 상속받아서, 아래 기능을 **직접 안 짜고 그냥 씀**
> - 출처 : Accellera UVM 원본 `src/base/uvm_component.svh` (method 선언 목록에서 정리)
>
> **상속 구조**
> ```
> uvm_object                 ← 이름, print / copy / compare, factory create
>   └─ uvm_report_object     ← 로그 출력 (`uvm_info / `uvm_error), verbosity 조절
>        └─ uvm_component    ← 여기서 추가 : 트리 · phase · config · factory override · objection 콜백
>             ├─ uvm_driver #(REQ)   ← + seq_item_port (sequencer에서 item 받는 포트)
>             ├─ uvm_monitor / uvm_scoreboard / uvm_agent / uvm_env / uvm_test
>             └─ uvm_sequencer #(REQ)
> ```
> - `virtual class uvm_component` = **추상 class** (1119 추상 class 참고) → `new` 로 직접 못 만들고 **상속해서만** 씀
>
> | 기능 | 대표 method | 하는 일 | 자주 씀? |
> |---|---|---|---|
> | **① 트리(계층)** | `new(name, parent)`, `get_parent()`, `get_full_name()`, `get_children()`, `get_child("d")`, `lookup("e.a.d")` | 부모를 받아 **트리에 붙음** → `uvm_test_top.e.a.d` 같은 경로가 생김 | ★★★ (`new`, `get_full_name`) |
> | **② phase** | `build_phase`, `connect_phase`, `end_of_elaboration_phase`, `start_of_simulation_phase`, `run_phase`, `extract/check/report/final_phase` | 전부 **빈 virtual method** 로 준비돼 있음 → 필요한 것만 재정의하면 UVM이 순서대로 불러줌 | ★★★ |
> | ②-1 세부 run phase | `reset_phase`, `configure_phase`, `main_phase`, `shutdown_phase` (+ `pre_`/`post_`) | `run_phase` 와 **동시에** 도는 세분화 phase | ★ (보통 `run_phase` 하나로) |
> | **③ 로그(report)** | `` `uvm_info(ID, MSG, UVM_LOW) `` → 내부 `uvm_report_info()`, `set_report_verbosity_level()`, `set_report_verbosity_level_hier()` | 메시지에 **시간·컴포넌트 경로**가 자동으로 붙음, verbosity로 출력량 조절, `_hier` = 내 아래 트리 전체에 적용 | ★★★ |
> | **④ factory** | `set_type_override_by_type()`, `set_inst_override_by_type()`, `create_component()`, `print_override_info()` | "driver 자리에 my_driver를 대신 만들어라" 교체 | ★★ (test에서) |
> | **⑤ config** | `apply_config_settings()`, `print_config()` (+ 옛날 `set_config_int` 등) | 설정값 받기. 요즘은 **`uvm_config_db#(T)::get(this, …)`** 로 직접 받음 (13번) | ★★ (`config_db`) |
> | **⑥ objection 관련** | `raised()`, `dropped()`, `all_dropped()`, `phase_ready_to_end()` | objection 올라가고 내려갈 때 불리는 **콜백** (실제 raise/drop은 `phase.raise_objection(this)`) | ★ |
> | ⑦ 트랜잭션 기록 | `begin_tr()`, `end_tr()`, `accept_tr()` | 파형 툴(Verdi)에 transaction 기록 | ★ |
>
> - 우리 코드(`uvm/01_uvm_hello/uvm_base.sv`)에서 쓰는 것 : `new(name, parent)` + `super.new` (①), `build_phase` 안 `type_id::create("drv", this)` (①②), `run_phase` (②), `` `uvm_info `` (③) → **4가지가 핵심**
> - `this` 를 `create` 의 parent로 넘기는 이유 = ① 트리 기능 → "내가 부모" 로 등록
> - 정리 : SV TB에서는 driver·monitor를 **맨 class로 처음부터** 짰다면, UVM은 **트리·phase·로그·교체 기능이 이미 들어 있는 부모를 상속**해서 내 동작만 채움

---

## 11. sequence ↔ driver — handshake 방식 전달

```
  sequence ──item──▶ sequencer ──item──▶ driver ──▶ DUT
  (item 생성·random)  (전달 담당)          (구동)
     start_item / finish_item      get_next_item / item_done
```

| 구간 | 연결 방법 | 누가 연결 |
|---|---|---|
| sequence ↔ sequencer | `seq.start(sqr)`로 실행 → 그 안에서 `start_item` / `finish_item` 호출 | test (sequence 시작할 때) |
| sequencer ↔ driver | **TLM 포트** : `drv.seq_item_port.connect(sqr.seq_item_export)` | **agent의 `connect_phase`** (메모의 "에이전트가 드라이버와 커넥션을 연결") |

> 메모: "1 TLM — 시퀀스와 드라이버 사이에 start_item, finish_item"
> → **정리** : TLM **포트로 연결된 건 sequencer ↔ driver**. sequence는 포트가 아니라 sequencer 위에서 실행되면서 `start_item`/`finish_item`으로 sequencer에 item을 맡긴다. 결과적으로 item은 sequence → sequencer → driver로 간다.
>
> 메모: "시퀀서는 굳이 설계하지 않아도 존재"
> → **정리** : sequencer는 **코드를 직접 짤 필요가 없다** (`uvm_sequencer #(item)`을 그대로 씀). 단, agent의 build_phase에서 **생성(create)은 해야** 한다.
>
> 메모: "TLM은 기존 SV에서 port 개념으로 바뀜" → SV의 **mailbox 자리**에 UVM은 **port ↔ export** 연결을 쓴다는 뜻. 메모의 "shared method 방식"은 **포트를 통해 상대 컴포넌트의 method(함수)를 호출해서 전달**하는 방식이라는 뜻 (1118 17-2).

**handshake 순서 (메모의 빈 표 채움 — VCS 실행 로그 그대로, driver 구동 10ns, item 2개)**

| 순서 | 시각 | 누가 | 일어나는 일 |
|---|---|---|---|
| 1 | 0 | driver | **`get_next_item`** 호출 → item이 올 때까지 **기다림** |
| 2 | 0 | sequence | **`start_item(it)`** 호출 → driver가 요청할 때까지 대기 (sequencer가 허락) |
| 3 | 0 | sequence | `start_item` 리턴 → 이제 **randomize** (보내기 직전에 값 결정) |
| 4 | 0 | sequence | **`finish_item(it)`** 호출 → item을 driver에게 넘기고 **driver가 끝낼 때까지 대기** |
| 5 | 0 | driver | `get_next_item` 리턴 → **item 받음** (data=6f) → DUT 구동 시작 |
| 6 | 10 | driver | 구동 끝 → **`item_done`** → "처리 완료" 알림 |
| 7 | 10 | driver | 다음 item을 위해 다시 `get_next_item` (1번으로) |
| 8 | 10 | sequence | `finish_item` 리턴 → 다음 item 만들러 (2번으로) |
| 9 | 20 | — | 2번째 item도 같은 순서로 끝남 → sequence 종료 → objection drop → run_phase 종료 |

> 핵심 : sequence와 driver가 서로 **기다려 주며(handshake)** 한 개씩 주고받는다 → driver가 바쁜 동안 sequence가 item을 마구 쌓지 않음 (mailbox와 다른 점).

| 메모 | 정리 |
|---|---|
| "test에서도, env에서도 시퀀스를 만들 수 있다" | 맞음. 보통은 **test**의 run_phase에서 만들고 `start` (어떤 시나리오를 돌릴지가 test의 역할이라서) |
| driver / monitor → scb / cov | ⚠️ 정정 : scoreboard·coverage로 보내는 건 **monitor** (analysis port). driver는 DUT 구동만 함 (1119 18-5) |

---

> **Q. `uvm_driver #(base_item)` 처럼 item 타입을 파라미터로 주는 이유는? 어차피 안에서 `base_item seq_item;` 핸들로 선언하는데**
> **A. 내 핸들이 아니라, 부모가 만들어 둔 `seq_item_port` 의 타입을 정하려고.** 파라미터가 없으면 port는 `uvm_sequence_item` 타입으로 꺼내 줌 → 내 `base_item` 핸들에 바로 못 받음
> - `base_item seq_item;` = item을 **담을 그릇**. 파라미터 `#(base_item)` = 그 그릇에 넣어 줄 **배달 통로(port)의 규격**
>
> **`uvm_driver` 원본** (Accellera `src/comps/uvm_driver.svh`, 주석 제거)
> ```systemverilog
> class uvm_driver #(type REQ = uvm_sequence_item, type RSP = REQ) extends uvm_component;
>   uvm_seq_item_pull_port #(REQ, RSP) seq_item_port;   // ← REQ 타입으로 item을 꺼내 주는 port
>   uvm_analysis_port #(RSP)           rsp_port;
>   REQ req;                                            // ← 미리 만들어 둔 핸들도 REQ 타입
>   RSP rsp;
>   ...
> endclass
> ```
> - `#(base_item)` 을 주면 `REQ` = `base_item` → `seq_item_port.get_next_item(output REQ t)` 가 **`base_item` 으로 꺼내 줌**
> - 안 주면 `REQ` = 기본값 `uvm_sequence_item` (부모 타입) → 꺼낸 것을 자식 핸들(`base_item`)에 넣으려면 **downcasting** 필요 (1119 casting 참고)
>
> **확인** (Verilator 5.051, `uvm_driver` / `seq_item_port` 를 같은 구조로 축소한 모델)
>
> | 경우 | 코드 | 결과 |
> |---|---|---|
> | 파라미터 줌 | `class my_drv extends drv #(base_item);` → `get_next_item(seq_item)` | ✅ `addr=5` |
> | 파라미터 없음 | `class my_drv extends drv;` → `get_next_item(seq_item)` | ❌ `Function Argument expects a CLASSREFDTYPE 'seq_item_base', got CLASSREFDTYPE 'base_item'` |
> | 파라미터 없음 + cast | 부모 타입 `tmp` 로 받고 `$cast(seq_item, tmp)` | ✅ `addr=5` (매번 cast 해야 해서 번거로움) |
>
> - 파라미터로 얻는 것
>   - **cast 없이** 바로 `seq_item.t_addr` 처럼 자식 멤버 사용
>   - sequencer와 **타입 맞춤** : `uvm_sequencer #(base_item)` 과 connect → 타입이 다르면 **컴파일 단계에서 에러** (엉뚱한 item 연결 방지)
>   - 부모가 준 `req` 핸들도 `base_item` 타입 → `seq_item` 을 따로 선언하지 않고 `seq_item_port.get_next_item(req);` 로 써도 됨 (UVM 예제에서 흔한 모양)
> - 1118 16번 파라미터화 class(`#(type T)`)를 UVM이 실제로 쓰는 예 → **"부모 class 안의 타입을 자식이 정해 주는 것"**

---

## 12. factory — 객체 생성을 factory에 부탁

> **직접 `new` 하지 않고 factory에게 "이 타입 만들어 줘"라고 부탁하는 간접 생성 방식.** 그래서 나중에 **override**로 다른 타입(자식 class)을 대신 만들게 할 수 있다.

| 방식 | 코드 | 특징 |
|---|---|---|
| 직접 생성 | `agt = new("agt", this);` | 항상 **그 class** 객체 |
| **factory 생성** | `agt = my_agent::type_id::create("agt", this);` | factory가 만들어 줌 → **override 설정이 있으면 자식 class로 바꿔서** 만들어 줌 |

### 12-1. Q. 여기서 `this`는 뭐야?

| 인자 | 의미 |
|---|---|
| `"agt"` | 만들 객체의 **이름** → 트리 경로의 한 칸이 됨 (`uvm_test_top.e.agt`) |
| **`this`** | **부모 컴포넌트** = 지금 이 코드를 실행 중인 컴포넌트 자신. env의 build_phase에서 `this`라고 쓰면 **"이 env가 부모"** → 만든 agent가 env 아래에 붙는다 |

> VCS 확인 : agent의 build_phase에서 `create("d", this)` → driver 경로 `uvm_test_top.e.a.d`, `get_parent()` = `a`.
> object(item, sequence)는 트리에 안 붙으므로 **부모 인자 없이** `create("it")`만 쓴다.

### 12-2. Q. `create`는 `uvm_component` 부모 class의 함수인가?

**아니다.** `create`는 **`type_id`라는 별도 class의 static 함수**다.

| 단계 | 내용 (UVM 1.2 소스에서 확인) |
|---|---|
| ① | `` `uvm_component_utils(my_agent) `` 매크로가 class 안에 **`typedef uvm_component_registry #(my_agent, "my_agent") type_id;`** 를 만들어 넣음 |
| ② | `uvm_component_registry` class에 **`static function T create(string name, uvm_component parent, …)`** 가 있음 (`uvm_registry.svh` 109번째 줄) |
| ③ | 그래서 `my_agent::type_id::create(…)` = "my_agent의 등록 정보(type_id)에게 create 부탁" → factory가 override를 확인하고 객체를 `new` 해서 돌려줌 |
| object 쪽 | `` `uvm_object_utils `` → `uvm_object_registry` 의 `static function T create(string name = "", …)` |

> `::`는 1118 14번의 **class :: static 멤버** 사용법 → static 함수라서 객체 없이 부를 수 있다.

### 12-3. override 예

```systemverilog
// test 의 build_phase 에서, env 를 만들기 전에
drv::type_id::set_type_override(drv2::get_type());   // "drv 를 만들 땐 drv2 로"
e = env::type_id::create("e", this);
```

| 실험 (VCS 확인) | agent 안의 `drv::type_id::create("d", this)` 결과 |
|---|---|
| override 없음 | 타입 `drv` |
| override 있음 | 타입 **`drv2`** — agent 코드는 **한 줄도 안 고쳤는데** 다른 driver로 바뀜 |

> 그래서 UVM에서는 `new` 대신 **항상 `type_id::create`**로 만든다 → 나중에 test에서 원하는 부품·item으로 바꿔 끼울 수 있게 (1119 15번의 factory override + 다형성).

---

## 13. `uvm_config_db` — 컴포넌트에 설정값·인터페이스 전달

> **왜 필요한가** : interface는 **module(top) 쪽**에 실제로 있고, driver·monitor는 **class**라서 port로 연결할 수 없다. 그래서 **전역 설정 게시판(config_db)**에 interface 핸들을 **올려두고(set)**, 필요한 컴포넌트가 **꺼내 가는(get)** 방식으로 전달한다. SV TB에서 `new(vif)`로 넘겨주던 걸 대신하는 것.

```systemverilog
// top 모듈 (run_test 전에)
uvm_config_db #(virtual base_if)::set(null, "*", "base_vif", base_if);

// driver / monitor 의 build_phase
if (!uvm_config_db #(virtual base_if)::get(this, "", "base_vif", vif))
    `uvm_fatal("NOVIF", "base_vif 를 못 찾음")
```

### 13-1. `set` 인자 해석

| 부분 | 이 예에서 | 의미 |
|---|---|---|
| `#(virtual base_if)` | 저장할 값의 **타입** | interface **핸들** 타입. **set과 get의 타입이 정확히 같아야** 찾을 수 있음 |
| ① `cntxt` | `null` | 경로의 **기준점**. `null` = 최상위(uvm_root)부터 = **절대 경로**. 컴포넌트 안에서 쓸 땐 보통 `this` |
| ② `inst_name` | `"*"` | **누가 받을 수 있나** (경로 패턴). `"*"` = **모든 컴포넌트** |
| ③ `field_name` | `"base_vif"` | 게시판의 **이름표(key)**. get에서도 같은 문자열로 찾음 |
| ④ `value` | `base_if` | 올릴 **값** = top 모듈에 만든 **interface 인스턴스** |

### 13-2. `get` 인자 해석

| 부분 | 이 예에서 | 의미 |
|---|---|---|
| ① `cntxt` | `this` | **내 위치**(나 자신)를 기준으로 찾음 |
| ② `inst_name` | `""` | 기준(나)에서 더 내려가지 않음 = **나 자신 앞으로 온 값** |
| ③ `field_name` | `"base_vif"` | set 때 쓴 **이름표와 같아야** 함 |
| ④ 변수 | `vif` | 찾은 값을 **담을 변수** |
| 반환값 | `bit` | 찾으면 1, 못 찾으면 0 → **반드시 검사**하고 실패 시 `uvm_fatal` (안 하면 null 핸들로 진행하다 엉뚱한 곳에서 에러) |

### 13-3. 실험 (서버 VCS + UVM 1.2로 직접 확인)

| set 방법 | driver (`uvm_test_top.d`) | monitor (`uvm_test_top.m`) |
|---|---|---|
| `set(null, "*", "base_vif", base_if)` | ✅ OK | ✅ OK — **모두** 받음 |
| `set(null, "uvm_test_top.d", "base_vif", base_if)` | ✅ OK | ❌ FAIL — **경로가 맞는 컴포넌트만** 받음 |
| test에서 `set(this, "d", "depth", 16)` (int 값) | ✅ (d에게만) | ❌ FAIL |
| driver가 받은 vif로 `vif.data = 8'h5A` | top의 interface 신호가 실제로 `5a`로 바뀜 → **같은 interface를 가리키는 핸들** | |

### 13-4. 주의할 점

| 주의 | 이유 |
|---|---|
| **set은 get보다 먼저** | top에서는 `run_test()` **전에** set (get은 build_phase에서 일어나므로) |
| 타입·이름표가 정확히 같아야 | `#(virtual base_if)` ↔ `#(virtual base_if)`, `"base_vif"` ↔ `"base_vif"` — 하나라도 다르면 **못 찾음** (에러가 아니라 get이 0 반환) |
| `"*"`는 편하지만 범위가 넓음 | interface가 여러 개(multi-agent)면 `"uvm_test_top.env.agt0*"`처럼 **경로를 좁혀서** 각 agent에 맞는 vif를 줌 (1119 17번) |
| interface 말고도 전달 가능 | `int`(반복 횟수), `uvm_active_passive_enum`(active/passive), **config 객체** 등 아무 타입이나 |

---

# 1123 (월) — TLM 통로 3가지 · port / export / imp · analysis port · uvm_subscriber

> **핵심 한 줄** : UVM 컴포넌트는 **TLM 포트**로 transaction을 주고받는다. 통로는 3가지 — driver↔sequencer의 **`seq_item_port`**, monitor가 여러 곳에 **방송**하는 **`analysis_port`**, 기다리며 주고받는 **put/get port**. 보내는 쪽은 **port**, 받는 쪽은 `write()` 구현을 가진 **imp**이고, 둘을 동시에 볼 수 있는 **부모(env)가 `connect_phase`에서 연결**한다. coverage는 imp가 이미 달려 있는 **`uvm_subscriber`**를 상속해서 `write()`만 구현하면 된다.

| # | 목차 |
|---|------|
| 1 | TLM — 컴포넌트 사이의 통로 3가지 |
| 2 | port · export · imp 용어 |
| 3 | analysis port 동작 (VCS 확인) |
| 4 | coverage — `uvm_subscriber` |
| 5 | 계층 구조로 보는 연결 (질문 답변) |

> 이 날 예시 출력은 **서버 VCS + UVM 1.2**로 직접 돌려서 확인한 값.

---

## 1. TLM — 컴포넌트 사이의 통로 3가지

| 통로 | 어디서 어디로 | 방식 | 기다림 | 1 : N |
|---|---|---|---|---|
| **`seq_item_port`** | driver ↔ sequencer | driver가 **달라고 요청** (`get_next_item` / `item_done`) — 1120 11번 handshake | ✅ item 올 때까지 기다림 | 1 : 1 |
| **`analysis_port`** | **monitor → scoreboard, coverage …** | monitor가 **일방적으로 보냄** (`write()`) — 방송 | ❌ **안 기다림** (바로 리턴) | **1 : N** (0개여도 OK) |
| **put / get port** | 일반 컴포넌트 ↔ 컴포넌트 | `put()` / `get()` — **mailbox와 비슷** (보통 중간에 `uvm_tlm_fifo`) | ✅ 상대가 받을/줄 때까지 기다림 | 1 : 1 |

> 메모: "analysis_port : 모니터에서 일방적으로 가능 포트이며, scb로 커버리지로" → 맞음. **받는 쪽이 몇 개든(0개여도) monitor는 신경 쓰지 않고 보낸다.**
> 메모: "put / get port : 기다림 → 컴포넌트 사이의 일반 통신" → 맞음. SV의 mailbox `put`/`get`과 같은 성격.

---

## 2. port · export · imp 용어

> 메모: "TLM — uvm_analysis_imp, port에 대한 설명" 정리

| 용어 | 비유 | 역할 | 예 |
|---|---|---|---|
| **port** | 송신기 (보내는 구멍) | **호출하는 쪽**. `ap.write(tr)`처럼 함수를 부름 | monitor의 `uvm_analysis_port #(item) ap` |
| **imp** (implementation) | 수신기 + 스피커 | **받는 끝점**. 실제 동작(`write()` 함수)을 가진 컴포넌트에 달림 | scoreboard의 `uvm_analysis_imp #(item, scb) imp` |
| **export** | 중계 단자 | 중간에서 **안쪽 imp로 넘겨주기만** 함 (계층을 건너갈 때) | 부모가 자식의 imp를 바깥에 보여줄 때 |

| `uvm_analysis_imp #(item, scb)` | 의미 |
|---|---|
| 첫 번째 `item` | 받을 transaction 타입 |
| 두 번째 `scb` | **`write()`를 가진 class** → 데이터가 오면 `scb`의 `write(item t)`가 불림. 그래서 imp를 가진 class는 **`write()` 함수를 반드시 구현** |
| 생성 | `imp = new("imp", this);` (build_phase) |

---

## 3. analysis port 동작 (VCS 확인)

monitor가 `ap.write(tr)`을 부르면 **연결된 imp들의 `write()`가 차례로 바로 호출**된다.

```
10 MON : ap.write(data=99) 호출 (연결된 곳 2개)
10   COV.write : data=99 handle=443
10   SCB.write : data=99 handle=443
10 MON : ap.write 리턴 (기다림 없음)
```

| 관찰 | 의미 |
|---|---|
| 같은 시각(10)에 COV·SCB 둘 다 받음 | `write()`는 **함수 호출** → 시간이 흐르지 않음 |
| `handle=443`이 같음 | **같은 객체 핸들**을 나눠 받음 (복사 X) → 받은 쪽에서 수정하면 다른 쪽에도 보임 → 고칠 거면 `clone()` 후 수정 (1118 17-2) |
| 받는 순서 (COV 먼저) | 연결 순서와 다를 수 있음 → **순서에 의존하는 코드는 쓰지 말 것** |
| 연결 0개일 때 | `연결된 곳 0개` → 에러 없이 그냥 리턴 (UVM_ERROR 0) |

---

## 4. coverage — `uvm_subscriber`

> 메모: "uvm_subscriber → 이미 안에 analysis_export가 있어서 객체 선언할 필요 없음. 대신 write(p)가 불리므로 부모의 write function을 오버라이딩한다." → **맞음**. UVM 소스로 확인한 내용으로 보충.

**UVM 1.2 소스 (`uvm_subscriber.svh`)** — 요약

```systemverilog
virtual class uvm_subscriber #(type T=int) extends uvm_component;   // 추상 class
    uvm_analysis_imp #(T, this_type) analysis_export;   // 받는 imp 가 이미 선언돼 있음
    function new(string name, uvm_component parent);
        super.new(name, parent);
        analysis_export = new("analysis_imp", this);    // 생성자에서 이미 만들어 둠
    endfunction
    pure virtual function void write(T t);              // 약속만 → 자식이 반드시 구현
endclass
```

| 직접 scoreboard에 imp 달기 | `uvm_subscriber` 상속 |
|---|---|
| `uvm_analysis_imp #(item, scb) imp;` **선언** | ❌ 필요 없음 (`analysis_export`가 이미 있음) |
| build_phase에서 `imp = new("imp", this);` | ❌ 필요 없음 (부모 생성자가 만들어 둠) |
| `function void write(item t)` 구현 | ✅ **이것만** 구현 (`pure virtual`이라 안 하면 컴파일 에러 — 1119 16번) |
| 입력이 여러 개 필요할 때 적합 (scoreboard: 기대값 + 실제값) | 입력이 **하나**인 곳에 적합 (coverage) |

```systemverilog
class my_cov extends uvm_subscriber #(item);
    `uvm_component_utils(my_cov)
    item tr;                                                   // covergroup 이 볼 값 (먼저 선언)
    covergroup cg;  cp_data : coverpoint tr.data;  endgroup
    function new(string name, uvm_component parent);
        super.new(name, parent);   // 여기서 analysis_export 생성됨
        cg = new();
    endfunction
    function void write(item t);   // monitor 가 ap.write() 하면 불림
        tr = t;
        cg.sample();
    endfunction
endclass
```

---

## 5. 계층 구조로 보는 연결 (질문 답변)

> **Q. "모니터에서 나오는 포트를 env에서 연결만 해주면 된다" — 잘 이해가 안 됨. 계층 구조로 설명해 줘.**

```
uvm_test_top                    (test)
└── e                           (env)          ← ③ 여기서 연결 : 아래 둘을 다 볼 수 있는 공통 부모
    ├── a                       (agent)
    │   ├── m                   (monitor)
    │   │    ap ●─────────────────────┐        ← ① 보내는 port (monitor 가 만듦)
    │   └── ap = m.ap  (위로 꺼내 줌)  │        ← ② agent 가 자기 이름으로 보여줌
    ├── s                       (scoreboard)   │
    │    imp ◀────────────────────────┤        ← 받는 imp, write() 구현 있음
    └── c                       (coverage : uvm_subscriber)
         analysis_export ◀────────────┘        ← 받는 imp (uvm_subscriber 에 원래 있음)
```

```systemverilog
// env 의 connect_phase
a.ap.connect(s.imp);               // monitor → scoreboard
a.ap.connect(c.analysis_export);   // monitor → coverage   (port 하나에 여러 개 연결 = 1:N)
```

**왜 env에서 연결하나**

| 단계 | 설명 |
|---|---|
| ① monitor(`m`)는 agent 안, scoreboard(`s`)·coverage(`c`)는 agent **밖** | monitor는 자기 바깥에 누가 있는지 **모른다** (몰라야 재사용 가능) |
| ② agent가 `ap = m.ap`로 monitor의 port를 **자기 이름으로 꺼내 줌** | env는 agent 내부 구조를 몰라도 `a.ap`만 쓰면 됨 |
| ③ **두 쪽을 동시에 볼 수 있는 가장 가까운 부모 = env** | 그래서 env의 `connect_phase`에서 `a.ap.connect(s.imp)` |
| 언제 | **connect_phase** — build_phase에서 모든 컴포넌트·port가 다 만들어진 **뒤**라야 연결할 수 있음 (1120 8번) |

**데이터가 실제로 흐르는 순서**

| 순서 | 일어나는 일 |
|---|---|
| 1 | monitor가 DUT 핀을 보고 `tr`을 만듦 |
| 2 | `ap.write(tr)` 호출 |
| 3 | port가 연결된 imp 목록을 돌면서 → `s.write(tr)`, `c.write(tr)` **호출** (같은 시각, 같은 핸들) |
| 4 | scoreboard는 비교, coverage는 `cg.sample()` |
| 5 | `ap.write` 리턴 → monitor는 다음 관찰로 (기다리지 않음) |

| VCS로 확인한 실제 경로 | |
|---|---|
| monitor port | `uvm_test_top.e.a.m.ap` |
| scoreboard imp | `uvm_test_top.e.s.imp` |
| coverage imp | `uvm_test_top.e.c.analysis_imp` (`uvm_subscriber`가 생성자에서 붙인 이름) |

> 한 줄 정리 : **monitor는 "보내기만", scoreboard·coverage는 "write()로 받기만", 누가 누구에게 보내는지는 env가 정한다.** 그래서 각 컴포넌트를 다른 환경에서도 그대로 재사용할 수 있다.

---

# 1124 (화) — UART top 검증 계획 · seq_item 설계 · multi-agent · 입력 2개 scoreboard

> **핵심 한 줄** : 모든 경우(full case)를 다 검증할 수는 없으므로, **스펙 → 테스트 계획(무엇을·왜·우선순위) → seq_item 필드 설계** 순서로 **계획부터** 세운다. 입력·출력을 각각 보는 **monitor 2개(multi-agent)**를 두고, scoreboard는 **입력 2개**를 `uvm_analysis_imp_decl`(write 함수 분리) 또는 **analysis FIFO**로 받아 비교한다.

| # | 목차 |
|---|------|
| 1 | 검증은 계획부터 |
| 2 | 모듈 스펙 (⚠️ 확인 필요한 값 포함) |
| 3 | 테스트 계획표 (빈칸 채움 — 제안) |
| 4 | seq_item 필드 설계 · driver 역할 |
| 5 | multi-agent 구조 — mon_in / mon_out |
| 6 | 입력 2개 scoreboard — 방법 2가지 (VCS 확인) |
| 7 | sequence 목록 |

> 예시 출력은 **서버 VCS + UVM 1.2**로 직접 돌려서 확인한 값.

---

## 1. 검증은 계획부터

| 수업 내용 | 정리 |
|---|---|
| 뭘 검사할지 **계획부터** 세워야 한다 | 스펙 → 테스트 계획 → 커버리지 목표 → 그다음에 코드 (sv.md 1123 1번 명세서, 1112 검증 플랜과 같은 흐름) |
| 복잡한 시나리오를 **실제 상황에 맞게** 구현 | 실제로 일어날 일(속도 오차, 연속 수신, 동작 중 리셋 …)을 sequence로 만든다 |
| **full case 검증은 힘들다** | 8비트 데이터 × interval × 속도 × 리셋 시점 … 조합이 너무 많음 → **우선순위**를 정하고 **경계값 + 랜덤 + 커버리지**로 채운다 |

---

## 2. 모듈 스펙

| 스펙 항목 | 값 | 메모 |
|---|---|---|
| data bit | 8 bit | LSB 먼저 |
| baud rate | 9600 bps | 1 bit = **104.17 µs** |
| parity bit | 없음 | |
| sampling rate | ×16 (oversampling) | 1 tick = 1 bit / 16 = **6.51 µs** = 100 MHz 기준 **651 clk** |
| 속도 오차 (faster / slower frame) | ±10% | ⚠️ 아래 확인 필요 |

> ⚠️ **±10%는 ×16 샘플링 UART가 받을 수 있는 범위를 넘을 가능성이 크다 (계산).**
> RX는 start bit의 falling edge를 찾은 뒤 **각 비트 가운데(8/16 지점)**에서 샘플한다. 보내는 쪽 비트 길이가 e만큼 다르면 오차가 **비트마다 쌓여서**, 마지막 stop bit(start부터 9.5비트 지점)에서는 9.5 × e만큼 밀린다. 이게 **반 비트(0.5)**를 넘으면 옆 비트를 샘플하게 된다.
>
> | 보내는 쪽이 | 한계 (stop bit 기준) | 10%일 때 밀림 |
> |---|---|---|
> | 빠름 (비트가 짧음) | 약 **4.4%** (start edge 검출 오차 1/16 bit 포함) | 9.5 × 0.1 = **0.95 bit** → ❌ |
> | 느림 (비트가 김) | 약 **5.6%** | ❌ |
>
> → **10%면 정상 수신이 안 되는 게 맞는 동작**일 수 있다. 테스트 목적을 정해야 함 : ① 허용 범위 안(예 ±3%)에서 **정상 수신 확인**, ② ±10%에서 **에러(frame error 등)로 걸러내는지 확인**. 수업에서 정한 의도를 교수님께 확인 권장.

---

## 3. 테스트 계획표

> 메모의 표에서 빈칸을 채움. **채운 값은 제안**이므로 수업에서 정한 내용과 다르면 수정.

| 테스트명 | 목적 / 확인 항목 | 기대 결과 | 우선순위 |
|---|---|---|---|
| **reset_test** | 리셋 시 `rx_done`, `rx_data`, `state`가 초기값으로 가는지 — **① 초기 상태에서 리셋 ② 수신 동작 중 리셋** | 초기값 복귀, 리셋 후 다음 프레임 정상 수신 | 1 |
| **normal_test** | 9600 bps 정확한 속도로 랜덤 데이터 수신 | `rx_data` = 보낸 데이터, `rx_done` 1 cycle | 1 |
| **edge_data_test** | 0x00, 0xFF, 0x55, 0xAA | 모두 정상 수신 (0x55/0xAA는 비트마다 0·1이 바뀜, 0x00/0xFF는 안 바뀜 — 1113 3번) | 1 |
| **interval_test** | 프레임 사이 간격 : **0(연속)**, 짧음, 랜덤 | 간격 0에서도 프레임을 놓치지 않음 | 2 |
| **baud_tolerance_test** | 속도 오차 fast / slow | 허용 범위 안 : 정상 / 밖 : 에러 처리 (2번 ⚠️ 참고) | 2 |
| **random_test** | 데이터·간격·속도 모두 랜덤, 많이 반복 | scoreboard 전부 PASS + 커버리지 목표 달성 | 3 |

---

## 4. seq_item 필드 설계 · driver 역할

| 필드 | rand | 범위 / 옵션 | 이유 |
|---|---|---|---|
| `data[7:0]` | ✅ | 랜덤 1~254 + **경계값 0x00, 0xFF, 0x55, 0xAA** | 경계값은 `dist` 제약이나 별도 sequence로 확실히 넣기 |
| `interval` | ✅ | 프레임 사이 대기 시간 | ⚠️ 단위 통일 필요 (아래) |
| `mode` | ✅ | `NORMAL`(0%) / `FAST`(+10%) / `SLOW`(-10%) → **enum**으로 (sv.md 1119 9번) | 비트 길이(bit per baud time) 조절 |
| `reset` | ❌ | — | 랜덤 필드가 아니라 **reset sequence / reset_test**로 따로 |
| `rx_data[7:0]` | ❌ | — | ⚠️ 정정 : 비교 대상(DUT **출력**)은 **랜덤 필드가 아니다**. 출력쪽 monitor가 관찰해서 채우는 값 |

> ⚠️ **interval 단위가 메모 안에서 섞여 있음** : 계획표에는 "0~baud tick, 단위 = 1clk × 10", seq_item에는 "`interval[9:0]` 0~651µs, 단위 1µs".
> 651은 **1 tick(1/16 bit)의 clock 수**(100 MHz ÷ 9600 ÷ 16 ≈ 651)라서 µs 값이 아니다. 또 `[9:0]`은 최대 1023. → **단위를 하나로 정할 것** (예 : "tick 단위, 0 ~ 16×N tick" 또는 "clock 단위"). driver가 그 단위로 기다리게 만들면 됨.

**driver 역할** (메모의 빈 driver 칸)

| 순서 | 하는 일 |
|---|---|
| 1 | `get_next_item(req)` |
| 2 | `interval`만큼 idle(1) 유지 |
| 3 | **비트 시간** = 104.17 µs × (1 + mode 오차)로 계산 |
| 4 | start bit(0) → data 8비트(**LSB 먼저**) → stop bit(1)을 `rx` 선에 차례로 구동 |
| 5 | `item_done()` |

---

## 5. multi-agent 구조 — mon_in / mon_out

> 메모: "monitor를 분담해서 멀티 에이전트를 쓸 수 있음" — uvm.md 1119 17번 multi-agent를 UART에 적용.

| agent | 구성 | 보는 것 | scoreboard로 |
|---|---|---|---|
| **agent1 (in)** — active | sequencer + driver + **mon_in** | DUT **입력** `rx` 선 → 받은 비트로 데이터 복원 | **기대값** (`write_in`) |
| **agent2 (out)** — passive | **mon_out**만 | DUT **출력** `rx_done`, `rx_data` | **실제값** (`write_out`) |

```
seq(reset / fast / slow / normal / random)
   │
   ▼
 sqr ──▶ drv ──▶ DUT(UART RX) ──▶ rx_data, rx_done
                  ▲  rx 선                  │
                  │                         ▼
          mon_in (agent1)             mon_out (agent2)
                  │ ap                       │ ap
                  ▼                          ▼
      scb : imp_in → write_in()     scb : imp_out → write_out()
            → 기대값 저장(queue)           → 꺼내서 비교 → PASS / FAIL
                  │                          │
                  └──────────▶ cov ◀─────────┘   (입력 2개 → 6번 방법으로)
```

| 메모 | 정정 / 보충 |
|---|---|
| mon_in은 DUT 뒤에 있음 | ✅ 맞음 — mon_in은 driver가 아니라 **DUT 입력 핀(`rx`)을 직접 관찰** (uvm.md 1119 18-5) |
| "scb에서 analysis_port(in_port / out_port)" | ⚠️ 용어 : 받는 쪽(scoreboard)에 다는 건 **port가 아니라 imp**. port는 보내는 monitor 쪽 (1123 2번) |
| cov ( export_in / export_out ) | ⚠️ `uvm_subscriber`는 입력(`analysis_export`)이 **하나뿐** → 입력 2개가 필요하면 6번처럼 `imp_decl`을 쓰거나, 출력쪽 하나만 받아 커버리지를 잡음 |

---

## 6. 입력 2개 scoreboard — 방법 2가지 (VCS 확인)

> 메모: "port 별로 write 함수를 부르는 방법(개별 write 함수)" / "FIFO 버퍼 컨트롤하는 방법"

### 6-1. 방법 ① `uvm_analysis_imp_decl` — write 함수를 이름별로

> imp가 2개면 둘 다 `write()`를 부르려고 해서 이름이 겹친다 → 매크로로 **`write_in()`, `write_out()`**처럼 **이름 붙은 imp 타입**을 만든다.

```systemverilog
`uvm_analysis_imp_decl(_in)      // → uvm_analysis_imp_in  타입, write_in()  을 부름
`uvm_analysis_imp_decl(_out)     // → uvm_analysis_imp_out 타입, write_out() 을 부름

class scb1 extends uvm_scoreboard;
    `uvm_component_utils(scb1)
    uvm_analysis_imp_in  #(rx_item, scb1) imp_in;
    uvm_analysis_imp_out #(rx_item, scb1) imp_out;
    bit [7:0] exp_q[$];                                  // 기대값 queue
    function new(string n, uvm_component p); super.new(n, p); endfunction
    function void build_phase(uvm_phase phase);
        imp_in  = new("imp_in",  this);
        imp_out = new("imp_out", this);
    endfunction
    function void write_in(rx_item t);                   // mon_in 이 보내면
        exp_q.push_back(t.data);
    endfunction
    function void write_out(rx_item t);                  // mon_out 이 보내면
        bit [7:0] e = exp_q.pop_front();
        if (t.data == e) `uvm_info("SCB", "PASS", UVM_LOW)
        else             `uvm_error("SCB", $sformatf("FAIL got %h exp %h", t.data, e))
    endfunction
endclass
// env connect_phase : agt_in.ap.connect(scb.imp_in);  agt_out.ap.connect(scb.imp_out);
```

### 6-2. 방법 ② `uvm_tlm_analysis_fifo` — 받아서 쌓아 두고 run_phase에서 비교

```systemverilog
class scb2 extends uvm_scoreboard;
    `uvm_component_utils(scb2)
    uvm_tlm_analysis_fifo #(rx_item) fifo_in, fifo_out;
    function new(string n, uvm_component p); super.new(n, p); endfunction
    function void build_phase(uvm_phase phase);
        fifo_in  = new("fifo_in",  this);
        fifo_out = new("fifo_out", this);
    endfunction
    task run_phase(uvm_phase phase);
        rx_item e, a;
        forever begin
            fifo_in.get(e);              // 기대값 들어올 때까지 기다림
            fifo_out.get(a);             // 실제값 들어올 때까지 기다림
            // e.data 와 a.data 비교 → PASS / FAIL
        end
    endtask
endclass
// env connect_phase : agt_in.ap.connect(scb.fifo_in.analysis_export);
//                     agt_out.ap.connect(scb.fifo_out.analysis_export);
```

**실행 결과 (VCS 확인)** — 위 두 scoreboard를 같은 env에 같이 붙이고, 0x55, 0xAA, 0x3C를 보낸 뒤 3번째 출력만 일부러 0xFF로 틀리게 (확인용으로 각 함수에 `$display`를 넣어 돌린 로그)

```
  0 [SCB1] write_in  : expect 55 저장 (q=1)
100 [SCB1] write_out : got 55 exp 55 -> PASS
100 [SCB2] got 55 exp 55 -> PASS
200 [SCB1] write_out : got aa exp aa -> PASS
200 [SCB2] got aa exp aa -> PASS
300 [SCB1] write_out : got ff exp 3c -> FAIL
300 [SCB2] got ff exp 3c -> FAIL
```

| 비교 | ① `imp_decl` (write 함수) | ② analysis FIFO |
|---|---|---|
| 받는 방식 | 들어오는 **즉시** `write_in` / `write_out` 함수 실행 (시간 X) | FIFO에 **쌓아 두고**, run_phase(task)에서 `get`으로 꺼냄 |
| 기대값 보관 | 내가 queue를 직접 관리 | FIFO가 보관 |
| 비교 시점 | 출력이 들어오는 순간 | **둘 다 들어왔을 때** (`get`이 기다려 줌) |
| 좋은 곳 | 간단한 1:1 비교 | 시간 차이가 크거나 순서 맞추기가 복잡할 때 |

> 메모: "FIFO 버퍼가 차면 pass / fail" → **정정** : 버퍼가 **찼을 때**가 아니라, **기대값과 실제값이 둘 다 하나씩 들어왔을 때** 꺼내서 비교한다. 끝났을 때 FIFO에 남은 게 있으면(`fifo_in.is_empty()`가 0) 출력이 **안 나온 데이터**가 있다는 뜻 → `check_phase`에서 검사하면 좋다.

---

## 7. sequence 목록

| sequence | 내용 | 3번 테스트와 연결 |
|---|---|---|
| `seq0 : reset` | 리셋 걸기 (초기 / 동작 중) | reset_test |
| `seq1 : fast` | `mode = FAST` | baud_tolerance_test |
| `seq2 : slow` | `mode = SLOW` | baud_tolerance_test |
| `seq3 : normal` | `mode = NORMAL`, 경계값 데이터 포함 | normal_test, edge_data_test |
| `seq4 : random` | 데이터·간격·mode 전부 랜덤 | random_test |

> test마다 어떤 sequence를 어떤 순서로 돌릴지 정한다 (uvm.md 1120 9번 — test의 run_phase에서 objection 걸고 `seq.start(sqr)`).

---

# 1125 (수) — UART RX 검증 : 기대값 수집(mon_in) · rx만 보고 속도 구분 · monitor ↔ scoreboard 연결 · 타이밍 순서

> **핵심 한 줄** : 기대값은 driver가 보낸 item이 아니라 **mon_in이 `rx` 핀을 직접 보고 복원**하는 것이 표준이다 (driver 버그까지 잡으려고). fast / slow / normal은 `rx` 선의 **edge 시각이 어떤 비트 길이의 정수배인지**로 구분할 수 있다. imp_decl + queue 방식이면 **mon_in의 `write_in`이 DUT의 `rx_done`(→ `write_out`)보다 먼저** 와야 하고, 순서를 신경 쓰기 싫으면 **analysis FIFO**를 쓴다.

| # | 목차 |
|---|------|
| 1 | 검증 계획 — fast / slow / normal 기대값을 어디서 얻나 |
| 2 | `rx` 선만 보고 fast / slow / normal 구분하기 |
| 3 | monitor → scoreboard · coverage 연결 |
| 4 | 타이밍 — mon_in이 `rx_done`보다 먼저 |
| 5 | 교수님 조언 |

> 이 날 내용은 `uvm/03_uart_rx`의 `tb_uart.sv` · `uart_rx.sv` 코드를 기준으로 정리. 2번 구분 방법은 **계산(Python)으로 확인**, 시뮬레이션은 아직 안 돌림.

---

## 1. 검증 계획 — fast / slow / normal 기대값을 어디서 얻나

> 메모: "monitor_in에서 dut에 drive 할텐데"
> → **정정** : DUT에 구동(drive)하는 건 **driver**. mon_in은 **`rx` 핀을 관찰만** 한다 (1119 18-5).

> **Q. fast, slow, normal에서 expect data를 어떻게 수집할 것인가?** (메모: "port로 연결할 수 있지만 표준적인 방법과 거리가 멀다")

| 방법 | 내용 | 판단 |
|---|---|---|
| driver(또는 sequence)가 보낸 item을 analysis port로 scoreboard에 **직접** 보냄 | `kind`, `rx_data`를 그대로 알 수 있어서 쉬움 | ⚠️ 비표준. driver가 **잘못 구동해도** 기대값은 "보내려던 값"이라 **driver 버그를 못 잡음** |
| **mon_in이 `rx` 핀을 보고 복원** | DUT에 **실제로 들어간 것**을 기준으로 기대값을 만듦 | ✅ 표준. driver 버그도 걸림. 대신 mon_in이 **비트 길이를 스스로 알아내야** 함 → 2번 |

| 지금 `tb_uart.sv`의 mon_in | 문제 |
|---|---|
| 항상 `BAUD_TIME`(normal 비트 길이)으로 샘플 | fast / slow 프레임에서는 샘플 지점이 비트마다 밀려서 (10%면 마지막 비트에서 약 0.85 bit) **기대값 자체가 틀림** |
| `kind = NORMAL`로 고정해서 보냄 | scoreboard가 이 프레임이 fast인지 slow인지 모름 → ±10%에서 "에러가 나야 맞는" 경우를 판단 못 함 (1124 2번 ⚠️) |

---

## 2. `rx` 선만 보고 fast / slow / normal 구분하기

> 메모: "rx만 관찰하고서 이게 fast인지 뭔지 구분하는 방법이 뭘까"

**단순한 방법이 안 되는 이유**

| 시도 | 안 되는 경우 |
|---|---|
| start bit 길이 재기 (falling edge → 첫 rising edge) | data bit0이 1일 때만 1비트. **0x00**이면 첫 rising edge가 stop bit라서 **9비트 뒤** |
| edge 사이 가장 짧은 간격 = 1비트 | 0x00, 0xFF처럼 비트가 안 바뀌는 데이터는 edge가 1~2개뿐이라 짧은 간격이 없음 |

**방법 : edge 시각이 "후보 비트 길이의 정수배"인지 확인**

| 단계 | 내용 |
|---|---|
| ① | start bit의 falling edge 시각을 **0**으로 잡음 |
| ② | 프레임 안(최대 약 10비트)에서 `rx`가 바뀌는 **edge 시각을 전부 기록** |
| ③ | 모든 edge는 비트 경계에서만 생기므로 **edge 시각 = k × (비트 길이)**, k = 1 ~ 9 정수 |
| ④ | 후보 비트 길이 3개(0.9T / T / 1.1T)로 나눠 봐서 **모든 edge가 정수배에 맞는 후보**(오차 1 clk 미만) = 그 프레임의 속도 |
| ⑤ | 알아낸 비트 길이로 각 비트 **가운데**((k + 0.5) × 비트 길이)를 다시 읽으면 → 정확한 기대 데이터 + `kind` |

| 왜 항상 구분되나 | |
|---|---|
| edge가 최소 1개는 있음 | stop bit는 항상 1, start bit는 0 → 프레임 안에 rising edge가 **반드시** 하나 이상 |
| 후보끼리 겹치지 않음 | 0.9 × k₁ = 1.0 × k₂ 가 되려면 k₂ = 9, k₁ = 10 → k ≤ 9 범위에선 불가능. 다른 조합도 마찬가지 |
| 예 : 0x00 | edge는 stop bit 시작 하나뿐 → FAST 8.1T / NORMAL 9.0T / SLOW 9.9T 로 **서로 다른 시각** |
| 계산 확인 | 데이터 256개 × 속도 3종 = **768 프레임 전부 하나의 후보로만** 맞음 (`BAUD_TIME` = 104160 ns, 오차 기준 10 ns) |

> 시뮬레이션에서는 시각이 정확하니 이 방법이 확실하게 동작한다. 실제 보드라면 지터 때문에 오차 기준을 넉넉히 잡아야 함.

---

## 3. monitor → scoreboard · coverage 연결

```
mon_in.in_port  (analysis_port) ──┬──▶ scb.imp_in  → write_in()   : 기대값 저장
                                  └──▶ cov.imp_in  → write_in()   : 입력 커버리지 (kind, data)
mon_out.ap      (analysis_port) ──┬──▶ scb.imp_out → write_out()  : 꺼내서 비교 → PASS / FAIL
                                  └──▶ cov.imp_out → write_out()  : 출력 커버리지
```

```systemverilog
// env 의 connect_phase
agt_in.mon_in.in_port.connect(scb.imp_in);   // 메모에 쓴 연결 — 동작은 함
```

| 메모 | 정정 / 보충 |
|---|---|
| `analalysis_port`, `wirte_in()` | 오타 → **`analysis_port`**, **`write_in()`** |
| `agt_in.mon_in.in_port.connect(...)` | ✅ 동작함. 다만 env가 agent **안쪽 이름(`mon_in`)**까지 알아야 함 → agent가 `ap = mon_in.in_port;`로 꺼내 주면 env는 `agt_in.ap.connect(scb.imp_in)`만 쓰면 됨 (1123 5번). agent의 connect_phase가 env보다 먼저 실행(아래 → 위)되니까 순서도 맞음 |
| cov도 `imp_in` / `imp_out` | ⚠️ `uvm_subscriber`는 입력이 **하나**라 안 됨 → cov를 `uvm_component`로 만들고 scoreboard와 **같은 `imp_decl` 타입**을 씀 |
| `` `uvm_analysis_imp_decl(_in) `` 을 cov용으로 또 써야 하나 | ❌ **한 번만** 선언. 매크로가 `uvm_analysis_imp_in #(T, IMP)` **파라미터 class**를 만드는 거라, `#(item, uart_cov)`로 cov에서도 그대로 씀. 두 번 선언하면 class 중복 에러 |

---

## 4. 타이밍 — mon_in이 `rx_done`보다 먼저

> 메모: "1. rx_done보다 mon_in이 빨라야 한다"
> → **맞음** (imp_decl + queue 방식일 때). `write_out`에서 queue를 `pop_front` 하는데 아직 `write_in`이 안 왔으면 **빈 queue**라 비교가 안 됨.

**`uart_rx.sv` 코드로 계산한 시각** (start bit falling edge = 0, 단위 = 비트)

| 누가 | 언제 | 근거 |
|---|---|---|
| DUT가 bit7 샘플 | 8.5 | START 8 tick + DATA 16 tick × 8 |
| **DUT `rx_done`** | **9.5 + (0 ~ 1 tick) + 1 clk** | STOP에서 16 tick 더 셈 → stop bit **가운데**에서 1. start 검출이 b_tick에 맞춰지니 최대 1 tick 늦음 |
| **지금 mon_in `write`** | **9.5** | `BAUD_TIME/2` + 8 × `BAUD_TIME` 샘플 후 `#(BAUD_TIME)` 한 번 더 기다리고 write |

| 결과 | |
|---|---|
| normal | mon_in이 **1 clk ~ 1 tick 차이로 간신히** 먼저 |
| fast | DUT는 짧아진 비트대로 일찍 끝나는데 mon_in은 고정 `BAUD_TIME`으로 기다림 → **순서가 뒤집힐 수 있음** |

| 해결 | 주의 |
|---|---|
| ① mon_in이 **bit7 샘플(8.5) 직후 바로 write** → DUT보다 약 1비트 먼저 | write 후 다음 `wait(!rx)` 전에 **`rx`가 1(stop bit)이 될 때까지 기다려야** 함. bit7이 0이면 `wait(!rx)`가 바로 통과해서 **가짜 프레임**을 잡음 |
| ② **analysis FIFO** 방식 (1124 6-2) | 둘 다 들어올 때까지 `get`이 기다려 주므로 **순서 상관없음** |

> 메모: "2. rx_done이 1일 때, mon_out의 write_out()"
> → **맞음**. `rx_done`은 STOP → IDLE로 가면서 바로 0이 되는 **1 clk 펄스**라서, mon_out은 **매 `posedge clk`마다 `rx_done`을 확인**하고 1이면 그때 `rx_data`를 읽어 write. (`wait(rx_done)`만 쓰면 같은 펄스에서 두 번 잡지 않도록 다시 0이 되는 것까지 기다려야 함)

---

## 5. 교수님 조언

| 조언 (메모) | 정리 |
|---|---|
| "검증 엔지니어 — 타이밍에 맞게 검증했는데, 통과한 데이터, DUT를 통과한 데이터 / 자기가 설계한 구동 시나리오가 맞게 잘됐는지 검증하는 것" | 검증 엔지니어는 ① DUT를 통과한 데이터가 **타이밍에 맞게** 나왔는지 ② **내가 짠 구동 시나리오**(fast / slow, interval …)가 **의도대로 실제로 들어갔는지**까지 확인한다 → 그래서 mon_in은 driver item이 아니라 **`rx` 핀을 직접** 본다 (1번) |
| "FPGA는 많이 해 둬라" | 시뮬레이션과 달리 **실제 보드 검증은 사람이 직접** 해야 하는 일 → 경험을 쌓아 둘 것 |
| "베릴로그 엔지니어 + 검증 엔지니어 + AI 에이전트" | 설계(Verilog) · 검증(UVM) · **AI 에이전트 활용**을 같이 할 수 있는 사람이 취업률이 높다 |
