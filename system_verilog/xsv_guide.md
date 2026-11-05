# xsv 사용법

Ubuntu(WSL) 터미널에서 Vivado xsim 시뮬레이션 실행

## 형식

```
xsv [-g|-s] <top_module> <파일들...>
```

## 명령

| 명령 | 역할 |
|---|---|
| `xsv tb_adder tb_adder_no_comment.sv ../adder.sv` | 시뮬레이션 실행, 결과 터미널 출력 (열린 파형 창 유지) |
| `xsv -g tb_adder tb_adder_no_comment.sv ../adder.sv` | 파형 창 띄우기 (기존 파형 창 닫고 새로, run all, top·interface·DUT 신호 자동 추가) |
| `xsv -s adder ../adder.sv` | RTL 회로도 창 띄우기 (Vivado 본체, 1분 정도 걸림, 합성 가능한 RTL만, TB 불가) |
| `rs` (Vivado Tcl 콘솔) | RTL 수정 후 회로도 다시 그리기 |
| `rl` (xsim 창 Tcl 콘솔) | 같은 창에서 다시 컴파일 + 파형 갱신 (신호 배치 유지) |
| `xsv-re` / `xsv -re` | 마지막 xsv 명령 다시 실행 (마지막이 `-g`면 파형 창 닫고 새로 띄움) |
| `xsv-kill` | xsv 파형 창 + 회로도 창 닫기 |
| `xsv-clean` | 파형 창 닫기 + `xsim_build/` 삭제 |
| `source ~/.bashrc` | 함수 수정 후 현재 터미널에 적용 |

## 작업 흐름

| 순서 | 입력 |
|---|---|
| 1 | `xsv -g tb_adder tb_adder_no_comment.sv ../adder.sv` |
| 2 | vim으로 TB 수정 → `:w` |
| 3 | xsim 창 Tcl 콘솔에 `rl` (또는 터미널에서 `xsv -re`) |
| 4 | 2~3 반복 |

## 규칙

| 항목 | 내용 |
|---|---|
| 첫 인자 | 파일명 아님, TB 안의 `module` 이름 |
| 실행 위치 | `/mnt/d/...` 또는 `~/System_Verilog/...` 아래 |
| 경로 | 실행 위치 기준 상대 경로 (`../adder.sv`) |
| 빌드 폴더 | 실행 위치에 `xsim_build/` 생성, 삭제해도 다시 생성됨 |
| 스냅샷 이름 | `xsv` → `sim_r`, `xsv -g` / `rl` → `sim` (이름이 달라서 파형 창 열린 채로 `xsv` 가능) |
| 함수 위치 | `~/.xsv.sh` (`~/.bashrc`에서 불러옴) |
