# WSL 터미널 환경 설정 가이드 (Gruvbox + tmux + vim)

> **Claude Code에게:** 이 문서는 다른 PC에서 만든 설정을 새 PC에 똑같이 재현하기 위한 작업 지시서다.
> 아래 순서대로 진행하되, 각 단계의 **사전 확인**으로 이미 적용된 부분은 건너뛰고(중복 추가 금지),
> 설정 파일을 수정하기 전에는 반드시 `.bak` 백업을 만든다. 모든 단계가 끝나면 **최종 검증**을 실행하고 결과를 사용자에게 보고한다.

## 업데이트 이력

### 2026-11-20 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| **삭제** | 4단계 | `Ctrl+w w`로 vim → tmux 창 순환하던 설정 삭제 (11-17): tmux `C-w` 바인딩·`ctrlw` 키 테이블, vim `s:CycleWindow()`/`s:CtrlW()`. vim·tmux 창 이동은 `Ctrl+h/j/k/l`만, 셸 `Ctrl+w`(단어 지우기)는 원래대로 | `~/.tmux.conf`, `~/.vimrc` |
| 변경 | 9단계 | `v` / `h` alias → 함수: `3v`, `4h`(또는 `v 3`)처럼 **n칸 같은 크기**로 분할 (2~9), 커서는 원래 pane에 남음 | `~/.bashrc` |
| 추가 | 17-1단계 | `md` 미리보기에서 **목차 링크(`#제목`) 클릭 시 그 제목으로 이동**: 제목에 GitHub 방식 id 부여 + `#` 링크 직접 처리 | `~/.mdview/mdview.py`(저장소 `ubuntu-terminal-setup/mdview.py`) |
| 변경 | 23단계 | vim md 인라인 `` `코드` `` 색 초록 → 연분홍(`#f5e0dc`, 코드 블록 초록과 구분) | `~/.vimrc` |
| 변경 | 24단계 | `:glow` 방식 변경: 새 탭 + less → **지금 창에서 렌더링** (`q`/`:glow`로 커서·스크롤 그대로 복귀, `j/k`·`gg/G`·`/` 등 vim 키로 읽기). 기본 테마 dracula → **vim**(지금 vim 색으로 glow 테마를 매번 생성, SV 코드 블록 색 포함) | `~/.vimrc` |
| 추가 | 34단계 | vim: 검색어 전부 색칠(`hlsearch`/`incsearch`) + 노랑/주황 검색 색, 구버전 vim tmux 트루컬러(`t_8f`/`t_8b`), `:Explore` 파일 청록, swap 폴더 자동 생성, Caps Lock `U P W Y` → 소문자 동작 | `~/.vimrc` |
| 추가 | 35단계 | vim UVM: `uvm_` 자동완성 목록에 **한글 설명** (`uvm.dict` 138개, `complete=FUvmComplete`), UVM 파일(`uvm_pkg`/`` `uvm_ ``)은 ALE(verilator) 가짜 오류 안 뜨게 그 버퍼만 검사 끔 | `~/.vim/dict/uvm.dict`(저장소 `ubuntu-terminal-setup/uvm.dict`), `~/.vimrc` |
| 추가 | 36단계 | tmux `Ctrl+Shift+화살표`: 그 방향 pane과 자리 바꾸기 (전부터 있던 설정, 문서에 누락) | `~/.tmux.conf` |
| 추가 | 37단계 | center 서버 VCS: `~/center` sshfs 자동 재연결, `srun`(서버 같은 폴더에서 실행), `run`/`sim [-n -l -s]`/`verdi`/`clean`/`smake`, `vcskill`. `sim`은 실제 시간 1h(`timeout`) + `+UVM_TIMEOUT` 1h 제한 | `~/.bashrc`, `~/.local/bin/srun`·`vcskill`(저장소 `ubuntu-terminal-setup/`) |

### 2026-11-18 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 33단계 | 배경색을 `#45475A`(Catppuccin surface1)로: Windows Terminal 배경, vim 배경, tmux 상태바를 같은 색으로. ANSI black은 배경과 겹치지 않게 `#313244`로 | `~/.theme/theme.py`(저장소 `ubuntu-terminal-setup/theme.py`), `~/.vimrc` |
| 추가 | 33단계 | vim 글자색 선명하게: 배경이 밝아져 흐려 보이던 글자색(guifg)을 색조는 그대로 밝기·채도만 올림 (모든 테마에 적용). `~`·Visual 선택색은 `#585b70` | `~/.vimrc` |
| 변경 | 33단계 | tmux: 상태바를 화면 위로, 왼쪽 위에 날짜+시계 (오른쪽 날짜·시계 삭제). pane 테두리를 굵은 선(`┃━`) + 전용 색 `#9399B2`(활성 pane은 파랑 그대로) | `~/.tmux.conf`, `~/.theme/theme.py` |

### 2026-11-11 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 31단계 | `exl` / `exl "파일명"` / `exl "폴더명"`: 엑셀 파일(`.xlsx` `.xlsm` `.xls` `.csv`)을 Windows Excel로 열기 (`pdf`와 같은 방식, 확장자 생략 가능, 잠금파일 `~$*` 건너뜀). vim `:!exl`도 되도록 30단계 링크 추가 | `~/.bashrc`, `~/.local/bin/exl` |
| 추가 | 32단계 | vim에서 SV `covergroup`에 뜨던 빨간 오류(`Unsupported: covergroup`, verilator 미지원이라 `-Wno`로도 못 끔) 없애기: ALE가 verilator를 부를 때 covergroup 블록과 사용처만 지운 임시 복사본으로 검사하는 래퍼. 줄 번호·다른 오류는 그대로 | `~/.local/bin/verilator-cgstrip`(저장소 `ubuntu-terminal-setup/verilator-cgstrip`), `~/.vimrc` |

### 2026-11-10 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 30단계 | vim `:!pdf`, `:!xsv` 등이 안 되던 것 (`:!`는 `.bashrc`를 안 읽는 `bash -c`라 셸 함수가 없음) → `.bashrc` / `.xsv.sh`의 함수를 불러와 실행하는 `~/.local/bin` 실행 파일 + 심볼릭 링크 (`pdf` `png` `ppt` `md` `wh` `xsv`). `:!` 뒤 `Tab` 자동완성도 됨 | `~/.local/bin/.bashrc-fn`, `~/.local/bin/{pdf,png,ppt,md,wh,xsv}` |

### 2026-11-09 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 변경 | 28단계 | tmux pane 돌리기를 `Ctrl+b Ctrl+o`에 더해 `Ctrl+b Alt+o`까지 끄기 (`rotate-window` 키 전부 해제). `Ctrl+b o`(다음 pane), `Ctrl+b {` / `}`(맞바꾸기)는 그대로 | `~/.tmux.conf` |
| 변경 | 28단계 | tmux `Ctrl+b Space`(레이아웃 순환)도 끄기. 실수로 눌리면 pane 배치가 바뀌던 것 | `~/.tmux.conf` |
| 추가 | 29단계 | tmux `Ctrl+b d`(detach) 끄기. 실수로 눌리면 확인 없이 바로 tmux에서 나가지던 것. 나갈 때는 셸에서 `tmux detach` | `~/.tmux.conf` |

### 2026-11-07 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 변경 | 26단계 | `xsv -g` 파형 창 **여러 개 유지**: top + 파일 조합마다 스냅샷(`sim_<첫파일>_<해시6>`)과 빌드 폴더(`xsim_build/<스냅샷>/`)를 분리, 같은 조합을 다시 띄울 때만 그 창 교체. 전에는 스냅샷이 `sim` 하나라 잠금 충돌을 피하려고 모든 파형 창을 닫았음 | `~/.xsv.sh`(저장소 `ubuntu-terminal-setup/xsv.sh`) |
| 변경 | 26단계 | `xsv-kill` / `xsv-clean`: 백그라운드에서 도는 Vivado 시뮬 **전부** 종료 (`xsim`·`xsimk`·`xelab`·`xvlog` + `xsv -s` 회로도 창), 끈 프로세스 이름·PID 출력. 전에는 `xsv -g` 파형 창과 회로도 창만 닫아서, 안 끝나거나 `Ctrl+C` 후 남은 `xsv` 시뮬(`sim_r`)이 `xsimk.exe`를 잠가 다음 빌드가 `XSIM 43-3345`/`43-3238`로 실패했음. alias → 함수 | `~/.xsv.sh`(저장소 `ubuntu-terminal-setup/xsv.sh`) |
| 추가 | 28단계 | tmux `Ctrl+b Ctrl+o`(pane 돌리기) 끄기. `Ctrl+b o`(다음 pane)를 누를 때 Ctrl을 늦게 떼면 좌우 pane 위치가 바뀌던 것 | `~/.tmux.conf` |
| 변경 | 26단계 | `xsv` 오류 표시: Windows 출력에 한글(cp949)이 섞이면 `grep`이 `binary file matches`만 찍고 실제 ERROR 줄을 숨기던 것 → `grep -a`. 실패 안내의 로그 이름을 실제 파일 `xelab.log`로, 같은 시뮬이 돌고 있으면 `simkill` 안내 | `~/.xsv.sh`(저장소 `ubuntu-terminal-setup/xsv.sh`) |
| 변경 | 26단계 | `xsv -g` / `rl` 파형 자동 추가를 **DUT 인스턴스만**으로 (top 바로 아래 이름에 `dut`가 들어간 인스턴스, 대소문자 무관: `DUT`, `u_dut` 등). DUT가 여러 개면 이름 구분선. DUT 인스턴스가 없으면 전처럼 top + interface 등 전부. 기록은 계속 `log_wave -recursive *`라 다른 신호는 Scope 창에서 끌어다 넣으면 됨 | `~/.xsv.sh`(저장소 `ubuntu-terminal-setup/xsv.sh`) |

### 2026-11-05 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 27단계 | vim: class 핸들 선언의 타입 이름(파일 안 `class X` / `interface X` 이름 + `mailbox` `semaphore`)을 초록 굵게 (`vlogClassName`). 예) `transaction tr;`, `virtual adder_interface vif;` | `~/.vimrc` |
| 변경 | 11-3단계 | TB 파일에서 Verilator `VARHIDDEN` 경고도 끔: `new()` 인자를 멤버와 같은 이름으로 짓고 `this.`로 구분하는 정상 코드에 "Declaration of signal hides declaration in upper scope"가 뜨던 것 | `~/.vimrc` |
| 추가 | 26단계 | `xsv -s <top> <RTL 파일들>`: Vivado 본체를 프로젝트 없이 띄워 RTL 회로도(Schematic) 열기 (`synth_design -rtl`). Vivado Tcl 콘솔 `rs`로 RTL 수정 후 회로도 갱신. `xsv-kill` / `xsv-clean`이 회로도 창도 닫음 | `~/.xsv.sh` |

### 2026-11-04 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 26단계 | `xsv`: Ubuntu(WSL) 터미널에서 Vivado xsim 시뮬레이션 실행 (`xvlog` → `xelab` → `xsim`). `xsv -g`로 파형 창, 창 Tcl 콘솔 `rl`로 다시 컴파일 + 파형 갱신, `xsv-re` / `xsv-kill` / `xsv-clean` | `~/.xsv.sh`(저장소 `ubuntu-terminal-setup/xsv.sh`), `~/.bashrc` |
| 추가 | 26-3단계 | `simkill`: 안 끝나는 시뮬(0ns 무한 루프 등) 강제 종료 → `xsim_build/` 파일 잠금 해제. `simkill -a`는 `vivado.exe`까지 | `~/.local/bin/simkill`(저장소 `ubuntu-terminal-setup/simkill`) |
| 추가 | 27단계 | vim Verilog/SV 키워드 역할별 색: `module`/`class`/`interface` 빨강, `task`/`function` 파랑, `initial`/`always` 주황, 타입 노랑, 포트 방향 청록, `//////` 구분선 주석 연보라 (전에는 전부 같은 색이라 경계가 안 보임) | `~/.vim/after/syntax/verilog.vim`, `~/.vim/after/syntax/systemverilog.vim`, `~/.vimrc` |
| 변경 | 26단계 | `xsv -g` 파형 창에 신호 자동 추가 (top + 바로 아래 interface·DUT, scope마다 구분선). 전에는 빈 창이라 class 기반 TB에서 파형이 안 보였음. `rl` 때 저장된 배치가 없으면 똑같이 자동 추가 | `~/.xsv.sh` |

### 2026-10-30 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 25단계 | vim: Caps Lock이 켜져 있으면 화면 **오른쪽 위에 `CAPS`**(주황), 한글 입력 상태면 그 왼쪽에 **`한`**(파랑) 표시. 끄면 사라짐. Windows `powershell.exe`가 0.2초마다 상태 확인, vim 닫으면 같이 꺼짐 | `~/.vim/keystate.ps1`(저장소 `ubuntu-terminal-setup/keystate.ps1`), `~/.vimrc` |

### 2026-10-24 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 변경 | 17단계 | `md`가 **실시간 미리보기**로 바뀜: 파일이 디스크에서 바뀌면(vim `:w`, Claude 수정 등) 브라우저에 바로 반영, 새로고침·재실행 필요 없음. 파일마다 localhost 서버(`mdview.py serve ... --idle-exit`)를 띄우고, 브라우저 탭을 닫으면 약 15~20초 뒤 서버가 스스로 종료 (탭이 60초 안에 안 붙어도 종료). Windows `%TEMP%\mdview` HTML은 더 이상 만들지 않음 | `~/.bashrc`, `~/.mdview/mdview.py` |
| 변경 | 17-3단계 | `mdview.py serve`: 2초마다 빈 메시지(ping)로 탭 닫힘 감지, `.pos` 파일이 없으면 스크롤 위치를 건드리지 않음. vim `:Md` 동작은 그대로 | `~/.mdview/mdview.py` |

### 2026-10-22 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 23단계 | vim에서 md 그대로 보기 좋게: 제목 단계별 색, `**` `` ` `` 링크 url 숨김(커서 줄은 원래대로), 코드 블록 언어 색, 표 `\|` 흐리게 (플러그인 없음) | `~/.vimrc`, `~/.vim/after/syntax/markdown.vim` |
| 추가 | 24단계 | glow(터미널 md 뷰어) 설치 + vim `:glow`로 화면 전체에 렌더링 보기 (`q`로 편집 화면 복귀), 기본 테마 dracula | `~/.local/bin/glow`, `~/.config/glow/`, `~/.vimrc` |
| 변경 | 19단계 | `s:CmdLower()`가 `:glow`도 `:Glow`로 바꿔 줌 | `~/.vimrc` |
| 변경 | 11-3단계 | ALE Verilator에 `--timing` 추가: TB의 `always #5 clk = ~clk;`에 뜨던 `NEEDTIMINGOPT` 오류 제거 (Verilator 5부터 지연 처리 방식을 꼭 지정해야 함). TB 파일(`tb_*.v`, `sim_file/`)은 `BLKSEQ` 경고도 끔 | `~/.vimrc` |

### 2026-10-16 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 변경 | 17-3단계 | vim `:MdLive` / `:MdLiveStop` 을 **`:md` / `:mdstop`** 으로 통합 (소문자·대문자 모두 가능, 실제 사용자 명령 이름은 `:Md` / `:MdStop`). 기능은 동일 | `~/.vimrc`, `~/.mdview/mdview.py` |
| 변경 | 19단계 | `s:CmdLower()`가 `:md` / `:mdstop` 을 `:Md` / `:MdStop` 으로 바꿔 줌 (`<CR>` 매핑이 abbreviation을 막아서 여기서 처리) | `~/.vimrc` |

### 2026-10-13 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 20단계 | tmux: `Ctrl+b` + 화살표 창 이동은 유지하고, 그 뒤에 **화살표만** 눌러도 창이 바뀌던 반복(`-r`)은 끄기 | `~/.tmux.conf` |
| 추가 | 21단계 | tmux: Caps Lock 켜진 채 `Ctrl+B`도 prefix로 인식(`prefix2`), `P`(이전 window) / `W`(window 목록)도 소문자처럼 동작. `~/.tmux.conf` |
| 추가 | 22단계 | vim 줄번호 색: 일반 줄번호는 회보라, 커서가 있는 줄 번호만 주황 (모든 테마에서 유지) | `~/.vimrc` |

### 2026-10-10 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 19단계 | vim 대문자 `:` 명령을 소문자처럼 (`:W` `:WQ` `:Q!` `:SET NU` `:%S/…`), Caps Lock 켜진 채 쳐도 E492 안 남. normal 모드 키는 그대로 | `~/.vimrc` |

### 2026-10-09 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 17단계 | `md` / `md "파일명"` / `md "폴더명"`: Markdown을 **VS Code 미리보기처럼** 브라우저로 보기 (GitHub 스타일 + 코드 색, 인터넷 없이 동작, `pdf`와 같은 방식) | `~/.mdview/`(저장소 `ubuntu-terminal-setup/mdview.py`), `~/.bashrc` |
| 추가 | 17-3단계 | vim `:Md`: 편집 중인 md를 브라우저에서 **실시간 미리보기** (`:w` 안 해도 입력하는 대로 바뀜, vim 커서 위치를 따라 스크롤), `:MdStop`으로 끄기 | `~/.vimrc`, `~/.mdview/mdview.py` |
| 추가 | 18단계 | `iv`: 면접 포트폴리오 토론 전용 Claude 세션 (`interview` 폴더). 처음이면 `interview` 이름으로 새 세션, 이후로는 마지막 대화 이어서 열기 | `~/.bashrc` |

### 2026-10-06 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 16단계 | `pdf` / `pdf "파일명"` / `pdf "폴더명"`: 현재 폴더 기준으로 PDF를 Windows 기본 PDF 뷰어로 열기 (확장자 생략 가능, `ppt`와 같은 방식) | `~/.bashrc` |

### 2026-10-03 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| **변경** | 11-3단계 | 자동완성: 단어를 끝까지 치면 후보 목록 자동으로 닫힘 (`s:VerilogCloseDone` + `TextChangedP`) | `~/.vimrc` |
| 추가 | 8-1단계 | vim끼리 `yy`→`p` 공유: `clipboard_provider` 없는 vim용 대체 블록 (`TextYankPost` + `p`/`P` 매핑, 같은 `~/.vim/.clipboard` 파일) | `~/.vimrc` |
| 추가 | 11-6단계 | vim 명령줄 Tab: `:%s/w<Tab>`, `/as<Tab>` 처럼 패턴·검색 안에서 파일 속 단어로 자동완성 (`^I` 들어가던 문제) | `~/.vimrc` |
| 추가 | 15단계 | 테마를 **Catppuccin Mocha**로 변경 + `theme` 명령(터미널·vim·tmux 동시 전환, 후보 8개). 1·2·3단계 Gruvbox 대체 | `~/.theme/theme.py`(저장소 `ubuntu-terminal-setup/theme.py`), `~/.vimrc`, `~/.tmux.conf`, `~/.bashrc`, `settings.json` |
| **변경** | 4-3단계 | `Ctrl+w w` 순환: vim 마지막 창에서 tmux로 나갈 때 첫 번째 vim 창으로 돌려놓음(`wincmd t`) → vsplit 후 다시 돌아와도 1 → 2 → tmux 순서 유지 | `~/.vimrc` |
| **변경** | 11-3단계 | 자동완성 키: `↑`/`↓`로 고르고 `Tab`으로 완성 → 목록 닫히고 같은 단어에서 다시 안 뜸 (`s:VerilogAccepted` + `CompleteDone`). 기존 `Tab`/`Shift+Tab` 이동 매핑 교체 | `~/.vimrc` |

### 2026-10-01 업데이트

> **Claude Code에게:** 2026-09-30까지의 설정(1~8단계)이 이미 적용된 PC라면 **아래 항목만** 적용하면 된다.
> 처음 설정하는 PC라면 이 목록은 무시하고 1단계부터 순서대로 진행한다.
> 항목마다 해당 단계의 **사전 확인**을 먼저 실행해서 이미 적용된 것은 건너뛴다.

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| **변경** | 5단계 | `ls` 폴더 색: Gruvbox 노랑(`250;189;47`) → **연한 하늘색**(`135;206;250`). `~/.bashrc`의 기존 `LS_COLORS` 줄에서 RGB 숫자만 바꾼다 (**새 줄 추가 금지**) | `~/.bashrc` |
| 추가 | 9단계 | tmux 분할 alias `t4` / `v` / `h` | `~/.bashrc` |
| 추가 | 9-1단계 | `tsv [프로젝트폴더]`: 4분할 작업 화면 (프로젝트 \| sources_1/new \| vivado / 저장소 루트). 저장소 경로 `B`는 PC마다 수정 | `~/.bashrc` |
| 추가 | 10단계 | 하위 폴더에서 `git status` 해도 폴더명이 보이게 (`status.relativePaths false`) | `~/.gitconfig` |
| 추가 | 11단계 | vim Verilog 자동완성 목록 + ALE/Verilator 문법 오류 표시 (**`:w` 저장할 때만** 검사) | `~/.vim/dict/`, `~/.vim/pack/`, `~/.vimrc` |
| 추가 | 12단계 | `watch_html "파일명"`: HTML 파일을 Windows 기본 브라우저로 열기 | `~/.bashrc` |
| 추가 | 13단계 | `viva`: System_Verilog 작업 폴더로 이동 (경로는 PC마다 확인) | `~/.bashrc` |
| 추가 | 14단계 | `ppt` / `ppt "파일명"` / `ppt "폴더명"`: 현재 폴더 기준으로 PPT를 Windows PowerPoint로 열기 (확장자 생략 가능, `~$` 잠금파일 제외) | `~/.bashrc` |
| 파일 | - | `ubuntu-terminal-setup/tmux-cheatsheet.html`: tmux 단축키 정리 (설치할 것 없음, `watch_html`로 열어 보는 용도) | - |

- 이날 시도했다가 **되돌린 것** (적용하지 말 것): glow / markdown-preview.nvim 마크다운 미리보기, vim Verilog filetype 감지 단계, 입력 중 실시간 lint.
- 적용 후: 열려 있는 터미널에서 `source ~/.bashrc`, tmux 안이면 `tmux source-file ~/.tmux.conf`. 마지막에 **최종 검증 체크리스트**를 실행하고 결과를 사용자에게 보고한다.

## 목표 요약

| # | 목표 | 수정 대상 |
|---|---|---|
| 1 | Windows Terminal 색 구성표를 **Gruvbox Dark**로, 글꼴을 **D2Coding**으로 변경 | Windows Terminal `settings.json`, Windows 글꼴 |
| 2 | vim 테마를 **Gruvbox**로 변경 | `~/.vimrc`, `~/.vim/pack/` |
| 3 | tmux 상태바/테두리를 **Gruvbox** 색으로, 트루컬러 활성화 | `~/.tmux.conf` |
| 4 | **`Ctrl+h/j/k/l`로 vim 창과 tmux 창(터미널)을 구분 없이 이동** (예전 `Ctrl+w w` 순환은 2026-11-17 삭제) | `~/.tmux.conf`, vim-tmux-navigator |
| 5 | `ls`의 **폴더 색**을 짙은 파랑 → 연한 하늘색(#87cefa)으로 변경 | `~/.bashrc` |
| 6 | **fzf**로 폴더 검색 이동 (`cd **<Tab>`) | `~/.fzf`, `~/.bashrc` |
| 7 | 프롬프트를 짧게: `사용자@컴퓨터:` 제거, 경로는 **마지막 폴더 2개**만 | `~/.bashrc` |
| 8 | vim swap 파일(`.swp`)을 작업 폴더가 아닌 `~/.vim/swap/`에 저장 | `~/.vimrc` |
| 9 | tmux 분할 alias: `t4`(한 번에 4분할), `v`(좌우 분할), `h`(상하 분할) | `~/.bashrc` |
| 10 | 하위 폴더에서 `git status` 해도 폴더명이 보이게 (`./` 대신 `project_0930/`) | `~/.gitconfig` |
| 11 | vim Verilog 편집: 입력 중 **자동완성 목록**(↑↓ 고르고 Tab 완성) + **문법 오류 표시**(ALE + Verilator) | `~/.vim/dict/`, `~/.vim/pack/`, `~/.vimrc` |
| 12 | `watch_html "파일명"`으로 HTML 파일을 Windows 기본 브라우저에서 열기 | `~/.bashrc` |
| 13 | `viva` 입력 시 System_Verilog 작업 폴더로 바로 이동 | `~/.bashrc` |
| 14 | `ppt` (현재 폴더 전부) / `ppt "파일명"` (확장자 생략 가능) / `ppt "폴더명"`으로 PPT를 Windows PowerPoint에서 열기 | `~/.bashrc` |
| 15 | **테마를 Catppuccin Mocha로** + `theme` 명령으로 터미널·vim·tmux 색을 한 번에 전환 (후보 8개) | `~/.theme/theme.py`, `~/.vim/pack/themes/`, `~/.vimrc`, `~/.tmux.conf`, `~/.bashrc`, Windows Terminal `settings.json` |
| 16 | `pdf` (현재 폴더 전부) / `pdf "파일명"` (확장자 생략 가능) / `pdf "폴더명"`으로 PDF를 Windows 기본 뷰어에서 열기 | `~/.bashrc` |
| 17 | `md` (현재 폴더 전부) / `md "파일명"` (확장자 생략 가능) / `md "폴더명"`으로 Markdown을 VS Code 미리보기처럼 브라우저에서 **실시간**으로 보기 (파일이 바뀌면 바로 반영) + vim `:Md`로 편집하면서 실시간 미리보기 | `~/.mdview/`, `~/.bashrc`, `~/.vimrc` |
| 18 | `iv` 입력 시 면접 포트폴리오 토론 전용 Claude 세션 열기 (`interview` 폴더, 두 번째부터 이어서) | `~/.bashrc` |
| 19 | vim에서 Caps Lock이 켜진 채 `:W` `:WQ` `:Q!` `:SET NU` 등을 쳐도 소문자 명령처럼 실행 | `~/.vimrc` |
| 20 | tmux에서 화살표만으로 창이 바뀌지 않게 (`Ctrl+b` + 화살표만 이동) | `~/.tmux.conf` |
| 21 | tmux에서 Caps Lock이 켜진 채 `Ctrl+B P` / `Ctrl+B W`를 눌러도 `Ctrl+b p` / `Ctrl+b w`처럼 동작 | `~/.tmux.conf` |
| 22 | vim 줄번호 색을 회보라(`#7f849c`), 커서 줄 번호는 주황(`#fab387`)으로. `theme`로 테마를 바꿔도 유지 | `~/.vimrc` |
| 23 | vim에서 md를 열면 제목·굵게·코드·표가 색으로 구분되고 `**` 같은 기호는 숨겨져서 읽기 좋게 | `~/.vimrc`, `~/.vim/after/syntax/markdown.vim` |
| 24 | vim에서 `:glow` → 지금 창이 md 렌더링 화면으로 바뀜 (`q`로 편집 화면 복귀, 기본 색 = vim 색) | `~/.local/bin/glow`, `~/.config/glow/`, `~/.vimrc` |
| 25 | vim에서 Caps Lock이 켜져 있으면 오른쪽 위에 `CAPS`, 한글 입력 상태면 그 옆에 `한` 표시 | `~/.vim/keystate.ps1`, `~/.vimrc` |
| 26 | `xsv`로 터미널에서 Vivado xsim 시뮬 실행 (`-g` 파형 창, `rl` 다시 컴파일) + `simkill`로 안 끝나는 시뮬 강제 종료 | `~/.xsv.sh`, `~/.bashrc`, `~/.local/bin/simkill` |
| 27 | vim에서 Verilog/SV 키워드를 역할별 색으로 (`module`/`class` 경계, `task`, `initial`, 타입, 포트 방향, 구분선 주석) | `~/.vim/after/syntax/`, `~/.vimrc` |
| 28 | tmux에서 `Ctrl+b Ctrl+o` / `Ctrl+b Alt+o` / `Ctrl+b Space`로 pane 배치가 바뀌지 않게 (pane 돌리기, 레이아웃 순환 끄기) | `~/.tmux.conf` |
| 29 | tmux에서 `Ctrl+b d`로 세션에서 나가지지 않게 (detach 키 끄기) | `~/.tmux.conf` |
| 30 | vim `:!`에서 셸 함수(`pdf`, `xsv` 등) 실행 + `Tab` 자동완성 | `~/.local/bin/.bashrc-fn` + 심볼릭 링크 |
| 31 | `exl` (현재 폴더 전부) / `exl "파일명"` (확장자 생략 가능) / `exl "폴더명"`으로 엑셀 파일을 Windows Excel에서 열기 | `~/.bashrc`, `~/.local/bin/exl` |
| 32 | vim ALE(verilator)에서 `covergroup` "Unsupported" 오류 표시 안 나게 | `~/.local/bin/verilator-cgstrip`, `~/.vimrc` |
| 33 | 배경색 `#45475A` 통일 (터미널·vim·tmux 상태바) + vim 글자 선명하게 + tmux 상태바 위로·굵은 pane 테두리 | `~/.theme/theme.py`, `~/.vimrc`, `~/.tmux.conf` |
| 34 | vim 검색어 색칠, 구버전 트루컬러, netrw 파일 색, swap 폴더 자동 생성, Caps Lock `U P W Y` 소문자처럼 | `~/.vimrc` |
| 35 | vim UVM 자동완성(설명 표시) + UVM 파일은 ALE 검사 끄기 | `~/.vim/dict/uvm.dict`, `~/.vimrc` |
| 36 | tmux `Ctrl+Shift+화살표`로 pane 자리 바꾸기 | `~/.tmux.conf` |
| 37 | center 서버 VCS/Verdi: `~/center` sshfs 자동 연결, `srun` / `run` / `sim` / `verdi` / `clean` / `vcskill` | `~/.bashrc`, `~/.local/bin/srun`, `~/.local/bin/vcskill` |

## 전제 환경

- Windows + **WSL2 (Ubuntu)** + **Windows Terminal** + **tmux 3.x** + **vim 9.x**
- 사전 확인: `vim --version | head -1`, `tmux -V`, `echo $TMUX`
- tmux가 없으면 `sudo apt install tmux` (sudo는 사용자에게 `! sudo apt install tmux`로 직접 실행하도록 안내)

### ⚠️ 중요 배경 (이전에 겪은 문제)

- **화면 분할은 반드시 tmux로 해야 한다.** Windows Terminal의 분할(`Alt+Shift+D` 등)로 나눈 창 사이는
  tmux/vim 단축키로 이동할 수 없다. 사용자에게 tmux 안에서 `Ctrl+b |` / `Ctrl+b -`로 분할하도록 안내한다.
- vim ↔ tmux 창 이동은 tmux와 vim **양쪽 모두** 설정해야 한다 (vim-tmux-navigator: vim 플러그인 + `~/.tmux.conf`의 `is_vim` 바인딩).
- (예전 기록) `Ctrl+w w`로 tmux 창까지 순환하던 설정은 2026-11-17에 삭제했다. 다시 만들 때 주의: vim에서 `<C-w>w` 형태로 매핑하면 `timeoutlen`(1초) 안에 `w`를 안 누를 때 동작하지 않으므로 `<C-w>` 하나만 매핑하고 `getcharstr()`로 다음 키를 기다려야 했다.

---

## 1단계. Windows Terminal: Gruvbox 색 구성표 + D2Coding 글꼴

### 1-1. settings.json 위치 찾기 (Windows 사용자명은 PC마다 다름)
```bash
ls -d /mnt/c/Users/*/AppData/Local/Packages/Microsoft.WindowsTerminal*/LocalState/settings.json \
      "/mnt/c/Users/"*"/AppData/Local/Microsoft/Windows Terminal/settings.json" 2>/dev/null
```
여러 개가 나오면 사용자에게 어느 것인지 확인한다.

### 1-2. 색 구성표 추가 + 기본값 지정 (백업 후 Python으로 JSON 수정)
```bash
F="<위에서 찾은 settings.json 경로>"
cp "$F" "$F.bak"
python3 - "$F" <<'EOF'
import json,sys
p=sys.argv[1]; d=json.load(open(p,encoding='utf-8'))
scheme={"name":"Gruvbox Dark","background":"#282828","foreground":"#EBDBB2","cursorColor":"#EBDBB2","selectionBackground":"#665C54",
"black":"#282828","red":"#CC241D","green":"#98971A","yellow":"#D79921","blue":"#458588","purple":"#B16286","cyan":"#689D6A","white":"#A89984",
"brightBlack":"#928374","brightRed":"#FB4934","brightGreen":"#B8BB26","brightYellow":"#FABD2F","brightBlue":"#83A598","brightPurple":"#D3869B","brightCyan":"#8EC07C","brightWhite":"#EBDBB2"}
d["schemes"]=[s for s in d.get("schemes",[]) if s.get("name")!="Gruvbox Dark"]+[scheme]
d.setdefault("profiles",{}).setdefault("defaults",{})
d["profiles"]["defaults"]["colorScheme"]="Gruvbox Dark"
d["profiles"]["defaults"]["font"]={"face":"D2Coding","size":12}
json.dump(d,open(p,'w',encoding='utf-8'),indent=4,ensure_ascii=False)
print(d["profiles"]["defaults"])
EOF
```
> 주의: settings.json에 `//` 주석이 있으면 `json.load`가 실패한다. 그 경우 주석을 보존하도록 직접 편집하거나 사용자에게 알린다.

### 1-3. D2Coding 글꼴 설치 (관리자 권한 불필요, 현재 사용자용)
먼저 설치 여부 확인:
```bash
ls /mnt/c/Windows/Fonts /mnt/c/Users/<윈도우사용자>/AppData/Local/Microsoft/Windows/Fonts 2>/dev/null | grep -i d2coding
```
없으면 설치:
```bash
SP=<스크래치패드 디렉터리>
cd "$SP"
URL=$(curl -sL https://api.github.com/repos/naver/d2codingfont/releases/latest | grep browser_download_url | grep -i '\.zip' | head -1 | cut -d'"' -f4)
curl -sL -o d2.zip "$URL"
python3 -m zipfile -e d2.zip d2          # unzip이 없을 수 있어서 python 사용
find d2 -iname '*.ttf'                   # D2Coding/ 폴더의 일반(Regular)·Bold 파일 사용 (Ligature 아님)

WINUSER=<윈도우사용자>
D=/mnt/c/Users/$WINUSER/AppData/Local/Microsoft/Windows/Fonts
mkdir -p "$D"
cp d2/D2Coding/D2Coding-Ver*.ttf     "$D/D2Coding.ttf"
cp d2/D2Coding/D2CodingBold-Ver*.ttf "$D/D2CodingBold.ttf"
W="C:\\Users\\$WINUSER\\AppData\\Local\\Microsoft\\Windows\\Fonts"
reg.exe add 'HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts' /v 'D2Coding (TrueType)'      /t REG_SZ /d "$W\\D2Coding.ttf" /f
reg.exe add 'HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts' /v 'D2Coding Bold (TrueType)' /t REG_SZ /d "$W\\D2CodingBold.ttf" /f
```
> - `api.github.com/repos/naver/d2codingfont`는 리다이렉트되므로 `curl -L` 필수.
> - `reg.exe` 출력의 한글이 깨져 보이는 것은 정상이다 ("작업을 완료했습니다").
> - 적용하려면 **Windows Terminal을 완전히 재시작**하도록 사용자에게 안내한다.

---

## 2단계. vim: Gruvbox 테마

```bash
cp ~/.vimrc ~/.vimrc.bak 2>/dev/null
[ -d ~/.vim/pack/themes/start/gruvbox ] || git clone --depth 1 https://github.com/morhetz/gruvbox ~/.vim/pack/themes/start/gruvbox
```

`~/.vimrc`의 테마 부분을 아래처럼 맞춘다 (기존 `colorscheme` 줄을 교체):
```vim
" .v 파일은 항상 Verilog로 인식 (안 그러면 새 파일/짧은 파일을 V 언어로 오인식)
let g:filetype_v = 'verilog'
syntax on
set background=dark
set termguicolors          " 트루컬러 사용 (Windows Terminal 지원)
let g:gruvbox_contrast_dark = 'medium'  " 대비: soft / medium / hard
colorscheme gruvbox
" vim 내장 터미널(:term)의 16색도 Gruvbox로 (Windows Terminal 색 구성표와 동일)
let g:terminal_ansi_colors = [
    \ '#282828', '#cc241d', '#98971a', '#d79921', '#458588', '#b16286', '#689d6a', '#a89984',
    \ '#928374', '#fb4934', '#b8bb26', '#fabd2f', '#83a598', '#d3869b', '#8ec07c', '#ebdbb2' ]
```
> - 기존 `.vimrc`에 `highlight Comment ...` 같은 **직접 색 지정 줄이 있으면 주석 처리**한다. 그대로 두면 Gruvbox 색을 덮어쓴다.
> - **`g:terminal_ansi_colors`는 필수.** `termguicolors`가 켜져 있으면 vim 내장 터미널(`:term`, `:vert term`)은
>   Windows Terminal 색이 아니라 vim 자체 팔레트를 쓴다. morhetz/gruvbox는 이 값을 설정하지 않으므로,
>   빠뜨리면 `:term` 안의 프롬프트 경로·`ls` 등이 vim 기본 **짙은 파란색**으로 나온다 (실제로 겪은 문제).

검증:
```bash
vim -Nu ~/.vimrc -es +'redir>>/dev/stdout|echo g:colors_name|redir END' +q   # → gruvbox
```
`:term` 팔레트 검증 (vim 안에서 `:vert term` 연 뒤 `Ctrl+w` 로 vim 창으로 나와서):
```vim
:echo term_getansicolors(term_list()[0])   " → ['#282828', '#cc241d', ...] 이면 성공, [] 이면 미적용
```

---

## 3단계. tmux: Gruvbox 테마 + 분할 편의 설정

`~/.tmux.conf`에 아래 내용이 없으면 추가한다 (이미 파일이 있으면 백업 후 병합):
```tmux
# 트루컬러 (vim Gruvbox 색이 tmux 안에서도 정확하게 나오도록)
set -g default-terminal "tmux-256color"
set -ga terminal-overrides ",*:RGB"

# Gruvbox 테마
set -g status-style "bg=#3c3836,fg=#ebdbb2"
set -g status-left "#[bg=#d79921,fg=#282828,bold] #S #[default] "
set -g status-right "#[fg=#a89984]%Y-%m-%d #[bg=#504945,fg=#ebdbb2] %H:%M "
set -g status-left-length 30
set -g window-status-format "#[fg=#a89984] #I:#W "
set -g window-status-current-format "#[bg=#fe8019,fg=#282828,bold] #I:#W "
set -g pane-border-style "fg=#504945"
set -g pane-active-border-style "fg=#fabd2f"
set -g message-style "bg=#504945,fg=#fabd2f"
set -g mode-style "bg=#665c54,fg=#ebdbb2"

# 분할: Ctrl+b | (좌우), Ctrl+b - (위아래), 현재 폴더 유지
bind-key | split-window -h -c "#{pane_current_path}"
bind-key - split-window -v -c "#{pane_current_path}"
bind-key % split-window -h -c "#{pane_current_path}"
bind-key '"' split-window -v -c "#{pane_current_path}"

set -g mouse on            # 마우스로 창 선택/크기 조절/스크롤
set -sg escape-time 10     # vim에서 Esc 지연 제거
```

---

## 4단계. `Ctrl+h/j/k/l`로 vim ↔ tmux 창 이동 (핵심)

> **2026-11-17 변경:** 예전에는 `Ctrl+w w`로도 vim 창 → tmux 창을 순환했지만 **삭제했다** (tmux `C-w` 바인딩 + `ctrlw` 키 테이블, `.vimrc`의 `s:CycleWindow()` / `s:CtrlW()`).
> 지금은 `Ctrl+h/j/k/l`(vim-tmux-navigator)로만 vim·tmux 창을 넘나든다. vim 안의 `Ctrl+w w` / `Ctrl+w h` 등은 vim 기본 동작(vim 창끼리만 이동)이고, 셸의 `Ctrl+w`(단어 지우기)도 원래대로 동작한다.
> 이미 예전 버전을 적용한 PC: `~/.tmux.conf`의 "Ctrl+w w 로 tmux 창 이동" 주석 ~ `bind-key -T ctrlw l ...` 블록, `~/.vimrc`의 "Ctrl+w w 로 tmux 창까지 이동" 섹션(`if exists('$TMUX')` ~ `endif`)을 지우고 `tmux unbind-key -n C-w`, vim 재시작.

### 4-1. vim-tmux-navigator 설치 (`Ctrl+h/j/k/l` 이동도 함께 제공)
```bash
[ -d ~/.vim/pack/plugins/start/vim-tmux-navigator ] || \
  git clone --depth 1 https://github.com/christoomey/vim-tmux-navigator ~/.vim/pack/plugins/start/vim-tmux-navigator
```

### 4-2. `~/.tmux.conf`에 추가
```tmux
# vim-tmux-navigator: Ctrl+h/j/k/l 로 vim 창과 tmux 창을 구분 없이 이동
is_vim="ps -o state= -o comm= -t '#{pane_tty}' \
    | grep -iqE '^[^TXZ ]+ +(\\S+\\/)?g?(view|l?n?vim?x?|fzf)(diff)?$'"
bind-key -n 'C-h' if-shell "$is_vim" 'send-keys C-h'  'select-pane -L'
bind-key -n 'C-j' if-shell "$is_vim" 'send-keys C-j'  'select-pane -D'
bind-key -n 'C-k' if-shell "$is_vim" 'send-keys C-k'  'select-pane -U'
bind-key -n 'C-l' if-shell "$is_vim" 'send-keys C-l'  'select-pane -R'
bind-key -T copy-mode-vi 'C-h' select-pane -L
bind-key -T copy-mode-vi 'C-j' select-pane -D
bind-key -T copy-mode-vi 'C-k' select-pane -U
bind-key -T copy-mode-vi 'C-l' select-pane -R
bind-key C-l send-keys 'C-l'   # 화면 지우기는 Ctrl+b 다음 Ctrl+l

```
> `is_vim` 정의가 `C-h/j/k/l` 바인딩보다 **위에** 있어야 한다.

적용: `tmux source-file ~/.tmux.conf` (트루컬러 설정은 `tmux kill-server` 후 재시작해야 완전히 적용)

### 4-3. (삭제됨) `Ctrl+w w` 순환
2026-11-17부터 쓰지 않는다 (위 4단계 머리말 참고). `~/.vimrc`에는 추가할 것이 없다 (vim-tmux-navigator 플러그인이 vim 쪽 `Ctrl+h/j/k/l`을 처리).

### 4-4. 동작 검증
```bash
tmux list-keys -T root | grep -E '^bind-key -T root +C-[hjklw] ' | awk '{print $4}'
# → C-h C-j C-k C-l 4줄만 나오고 C-w 는 없어야 함
tmux list-keys -T ctrlw 2>&1 | head -1
# → "table ctrlw doesn't exist" (또는 빈 출력)
```
실제 화면: tmux에서 `v`로 좌우 분할 → 왼쪽에서 vim 실행 → `Ctrl+l`로 오른쪽 셸, `Ctrl+h`로 다시 vim.

---

## 5단계. `ls` 폴더 색 변경 (짙은 파랑 → 연한 하늘색)

`~/.bashrc`에 없으면 맨 아래에 추가 (기본 `dircolors` 설정 줄보다 **뒤**에 있어야 함):
```bash
# ==========================================
#  ls 색상 (Gruvbox)
# ==========================================
# 폴더: 굵은 연한 하늘색 (#87cefa), /mnt/c 폴더의 초록 배경도 제거
export LS_COLORS="${LS_COLORS}:di=01;38;2;135;206;250:ow=01;38;2;135;206;250:tw=01;38;2;135;206;250"
```
- `di`=일반 폴더, `ow`=다른 사용자 쓰기 가능 폴더(`/mnt/c` 아래 Windows 폴더), `tw`=sticky+쓰기 가능 폴더
- 색 바꾸려면 RGB 3개 숫자만 교체: 연한 하늘색 `135;206;250`(현재) / 노랑 `250;189;47`(이전) / 주황 `254;128;25` / 연파랑 `131;165;152` / 청록 `142;192;124` / 연두 `184;187;38`

### 5-1. 굵은 색 → 밝은 색 코드로 통일 (Windows Terminal ↔ vim `:term` 색 일치)
Windows Terminal은 **굵은 글자(`01;3x`)를 밝은 색으로** 표시하지만, vim `:term`은 그렇지 않아서
같은 프롬프트/`ls`도 vim 터미널에서 더 진하게(특히 경로가 짙은 파랑) 보인다.
→ 처음부터 밝은 색 코드(`01;9x`)를 쓰도록 `~/.bashrc` 맨 아래(5단계 블록 **뒤**)에 추가:
```bash
# ==========================================
#  굵은 색 → 밝은 색 코드로 통일
# ==========================================
# Windows Terminal 은 굵은 글자를 밝은 색으로 보여주지만 vim :term 은 그렇지 않음.
# 처음부터 밝은 색 코드(9x)를 써서 두 곳의 색을 똑같이 맞춤.
for n in 0 1 2 3 4 5 6 7; do
    PS1="${PS1//01;3${n}m/01;9${n}m}"
    LS_COLORS="${LS_COLORS//01;3${n}/01;9${n}}"
done
unset n
export LS_COLORS
```
- 폴더색(`di=01;38;2;...` 트루컬러)은 `01;38`이라 영향 없음 (루프는 0~7만 변환)
- 검증: `bash -ic 'echo "$PS1" | cat -v'` → `01;92m`(user@host), `01;94m`(경로)가 보이면 성공
- 한계: git 등 **다른 프로그램이 직접 출력하는 굵은 색**은 여전히 vim `:term`에서 조금 진하게 보일 수 있음

검증:
```bash
bash -ic 'mkdir -p /tmp/lstest/dir; ls --color=always /tmp/lstest | cat -v; rm -rf /tmp/lstest'
# → ^[[01;38;2;135;206;250mdir 가 보이면 성공
```
적용: `source ~/.bashrc`

---

## 6단계. fzf: 폴더를 검색해서 이동 (`cd **<Tab>`)

GitHub에서 설치 (apt 버전은 오래돼서 사용하지 않음). 사용자가 **단축키는 원하지 않아서** 키 바인딩(Ctrl+T/Ctrl+R/Alt+C)은 끄고 자동완성만 켠다:
```bash
[ -d ~/.fzf ] || git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install --completion --no-key-bindings --update-rc --no-zsh --no-fish
```
→ `~/.fzf.bash`가 생기고 `~/.bashrc` 끝에 `[ -f ~/.fzf.bash ] && source ~/.fzf.bash`가 추가된다.

fzf 목록 화면 색을 Gruvbox로 (`~/.bashrc` 맨 아래에 추가):
```bash
# ==========================================
#  fzf 색상 (Gruvbox) - cd **<Tab> 등으로 뜨는 검색 목록
# ==========================================
export FZF_DEFAULT_OPTS="--height 40% --layout=reverse --border \
  --color=bg+:#3c3836,bg:#282828,spinner:#fb4934,hl:#928374,fg:#ebdbb2,header:#928374 \
  --color=info:#8ec07c,pointer:#fb4934,marker:#fb4934,fg+:#ebdbb2,prompt:#fabd2f,hl+:#fabd2f"
```

검증:
```bash
bash -ic 'complete -p cd; type fzf'
# → "complete -o nospace -F _fzf_dir_completion cd" 와 "fzf is ~/.fzf/bin/fzf" 가 나오면 성공
```

사용법 (사용자에게 안내):
| 입력 | 동작 |
|---|---|
| `cd **` 후 `Tab` | 현재 폴더 아래 모든 하위 폴더를 검색 목록으로 표시 |
| `cd ~/work/**` 후 `Tab` | 특정 경로 아래에서만 검색 |
| `cd proj**` 후 `Tab` | "proj"로 미리 거른 상태로 시작 |
| 목록에서 글자 입력 | 실시간 필터링 (띄어쓰기로 여러 단어 조건 가능) |
| `Enter` / `Esc` | 선택 / 취소 |
| `vim **` 후 `Tab` | 파일도 같은 방식으로 검색 가능 |

### 6-1. `Ctrl+q` 한 번으로 폴더 검색 → 바로 이동
사용자가 이 기능을 단축키로 원해서 **`Ctrl+q` 하나만** 설정한다 (fzf 기본 단축키 Ctrl+t / Ctrl+r / Alt+c 는 켜지 않음).
`~/.bashrc` 맨 아래(fzf 섹션 **뒤**)에 추가:
```bash
# ==========================================
#  Ctrl+q : fzf 로 폴더 검색 후 바로 이동
# ==========================================
if [[ $- == *i* ]]; then
    stty -ixon 2>/dev/null   # Ctrl+q/Ctrl+s 흐름제어(XON/XOFF) 끄기 → Ctrl+q 가 셸까지 전달되게
    # fzf 의 다른 단축키(Ctrl+t, Ctrl+r, Alt+c)는 켜지 않고 함수만 불러옴
    FZF_CTRL_T_COMMAND= FZF_CTRL_R_COMMAND= FZF_ALT_C_COMMAND= source ~/.fzf/shell/key-bindings.bash
    bind -m emacs-standard '"\C-q": " \C-b\C-k \C-u`__fzf_cd__`\e\C-e\C-\e(\C-m\C-y\C-h\e \C-y\ey\C-x\C-x\C-d\C-y\ey\C-_"'
fi
```
> - `stty -ixon`이 없으면 터미널이 Ctrl+q를 XON(출력 재개)으로 먹어버려서 동작하지 않는다.
> - bind 문자열은 fzf의 Alt+c 바인딩(`~/.fzf/shell/key-bindings.bash` 안의 `"\ec"` 줄)을 그대로 복사한 것이다.
>   fzf 버전이 달라 동작이 이상하면 해당 파일의 `"\ec"` 줄 문자열로 교체한다.
> - `__fzf_cd__` 함수가 있어야 하므로 `key-bindings.bash`를 source 한다. 이때 세 변수를 빈 값으로 주면 해당 기본 단축키가 등록되지 않는다.

검증:
```bash
bash -ic 'echo "C-q: $(bind -s | grep -c "\\\\C-q")  C-t: $(bind -X | grep -c fzf-file)  C-r: $(bind -X | grep -c __fzf_history)  Alt-c: $(bind -s | grep -c "\\\\ec")"'
# → C-q: 1  C-t: 0  C-r: 0  Alt-c: 0
```
실제 동작 테스트 (tmux 임시 세션의 bash에서 Ctrl+q → 목록 → 선택 → pwd 확인):
```bash
tmux new-session -d -s fzftest -x 150 -y 30 'bash -i'; sleep 1.5
tmux send-keys -t fzftest 'cd /usr' Enter; sleep 0.3
tmux send-keys -t fzftest C-q; sleep 1.2
tmux send-keys -t fzftest 'share/vim'; sleep 0.8; tmux send-keys -t fzftest Enter; sleep 0.8
tmux send-keys -t fzftest 'pwd' Enter; sleep 0.5; tmux capture-pane -p -t fzftest | grep -v '^\s*$' | tail -3
tmux kill-session -t fzftest
# → /usr/share/vim... 로 이동해 있으면 성공
```

제거: `~/.fzf/uninstall && rm -rf ~/.fzf`, `~/.bashrc`의 fzf 색상 섹션과 Ctrl+q 섹션 삭제

---

## 7단계. 프롬프트 짧게 (경로는 마지막 폴더 2개만)

```
전: ahn_sung@BOOK-54UP70ES1E:/mnt/c/26_AI_CAMP/System_Verilog/ubuntu-terminal-setup$
후: .../System_Verilog/ubuntu-terminal-setup$
```

`~/.bashrc`의 기본 `PS1` 정의(`if [ "$color_prompt" = yes ]; then` 블록)를 아래로 **교체**한다:
```bash
# 프롬프트 짧게: 사용자@컴퓨터 이름 빼고, 경로는 마지막 폴더 2개만 (앞부분은 ... 으로)
PROMPT_DIRTRIM=2
if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\w\$ '
fi
```
> - 파일 맨 아래에 PS1을 새로 추가하지 말고 **기존 블록을 교체**한다. 5-1의 "굵은 색 → 밝은 색" 루프가
>   이 PS1보다 **뒤에** 있어야 경로 색이 밝은 파랑(`01;94m`)으로 바뀐다.
> - 보이는 폴더 개수는 `PROMPT_DIRTRIM` 숫자로 조절 (1이면 마지막 폴더만).

검증:
```bash
cd /usr/share/vim && bash -ic 'echo "${PS1@P}"' | cat -v
# → ...[01;94m^B.../share/vim^A^[[00m^B$  처럼 사용자@컴퓨터 없이 .../share/vim 만 보이면 성공
```

---

## 8단계. vim swap 파일을 `~/.vim/swap/`에 저장

vim은 편집 중 같은 폴더에 `.파일명.swp`를 만든다. 그대로 두면 `git add -A` 때 저장소에 섞여 올라가고,
`/mnt/c` 아래(Windows 드라이브)에서는 swap 기록이 느려 타이핑이 끊기는 원인도 된다.

```bash
mkdir -p ~/.vim/swap
```
`~/.vimrc`의 "기타 편의 기능" 섹션에 추가:
```vim
set directory=~/.vim/swap// " swap 파일(.swp)을 작업 폴더 대신 ~/.vim/swap 에 저장
```
> - 끝의 `//`는 swap 파일 이름에 전체 경로를 넣으라는 뜻이다. 다른 폴더의 같은 이름 파일끼리 swap이 겹치지 않는다.
> - `~/.vim/swap` 폴더가 없으면 vim이 경고를 띄우므로 `mkdir`를 먼저 한다.

검증:
```bash
vim -Nu ~/.vimrc -es +'redir>>/dev/stdout|set directory?|redir END' +q
# → directory=~/.vim/swap//
```

### 8-1. 서로 다른 vim 창끼리 `yy` → `p` 공유
Ubuntu 기본 `vim` 패키지는 `-clipboard` 빌드라서 vim 프로세스마다 레지스터가 따로다 (tmux 왼쪽 vim에서 `yy` → 오른쪽 vim에서 `p` 안 됨).
vim 9.1의 `+clipboard_provider` 기능으로 **공용 파일(`~/.vim/.clipboard`)을 클립보드처럼** 쓰게 한다 (패키지 설치 불필요).
`~/.vimrc`의 "기타 편의 기능" 섹션에 추가:
```vim
if has('clipboard_provider')
    let s:clipfile = expand('~/.vim/.clipboard')
    function! s:ClipCopy(reg, type, lines)
        call writefile([a:type] + a:lines, s:clipfile)
    endfunction
    function! s:ClipPaste(reg)
        if !filereadable(s:clipfile)
            return ['', []]
        endif
        let l:data = readfile(s:clipfile)
        return [get(l:data, 0, ''), l:data[1:]]
    endfunction
    let v:clipproviders['shared'] = {
        \ 'copy':  {'+': function('s:ClipCopy'),  '*': function('s:ClipCopy')},
        \ 'paste': {'+': function('s:ClipPaste'), '*': function('s:ClipPaste')}
        \ }
    set clipmethod^=shared
    set clipboard=unnamedplus
endif
```
> - 파일 첫 줄에 레지스터 종류(줄 단위 `V` / 글자 단위 `v` / 블록 `^V`)를 저장해서 `p` 동작이 원래와 같다.
> - `dd`, `x`로 지운 내용도 공용 클립보드에 들어간다 (vim 기본 동작과 동일).
> - Windows 클립보드와는 연결되지 않는다 (vim ↔ vim 전용).

검증: tmux 2분할로 vim 두 개를 띄우고 한쪽에서 `yy`, 다른 쪽에서 `p` → 붙여넣어지면 성공.

**`clipboard_provider`가 없는 vim이면** (`vim -Nu NONE -es -c 'echo has("clipboard_provider")'` → 0, 예: Debian vim 9.1 패치 1-16) 위 블록은 아무 일도 안 한다 (2026-10-04 이 PC에서 확인).
→ 같은 파일·같은 형식으로 `TextYankPost` + `p`/`P` 매핑을 쓰는 대체 블록을 `~/.vimrc` 맨 아래에 추가 (두 블록이 함께 있어도 하나만 동작):
```vim
" ==========================================
"  서로 다른 vim 끼리 yy → p 공유 (공용 파일 ~/.vim/.clipboard)
" ==========================================
" clipboard_provider 가 없는 vim (이 PC의 vim 9.1 패치 1-16) 용 대체 방식
"  - y / d 로 기본 레지스터에 들어간 내용을 파일에 저장
"  - p / P 는 파일의 최신 내용을 기본 레지스터로 읽어 온 뒤 붙여넣기 ("ap 처럼 레지스터 지정 시엔 그대로)
if !has('clipboard_provider')
    let s:clipfile = expand('~/.vim/.clipboard')
    function! s:ClipSave()
        if v:event.regname ==# '' && v:event.operator =~# '^[yd]$'
            call writefile([v:event.regtype] + v:event.regcontents, s:clipfile)
        endif
    endfunction
    function! s:ClipLoad()
        if v:register ==# '"' && filereadable(s:clipfile)
            let l:data = readfile(s:clipfile)
            if len(l:data) > 1
                call setreg('"', l:data[1:], l:data[0])
            endif
        endif
        return ''
    endfunction
    augroup shared_clip
        autocmd!
        autocmd TextYankPost * call s:ClipSave()
    augroup END
    nnoremap <expr> p <SID>ClipLoad() . 'p'
    nnoremap <expr> P <SID>ClipLoad() . 'P'
    xnoremap <expr> p <SID>ClipLoad() . 'p'
    xnoremap <expr> P <SID>ClipLoad() . 'P'
endif
```
> - `"ap`처럼 레지스터를 지정한 붙여넣기와 `"ayy`는 공용 파일을 안 거친다 (vim 기본 동작 그대로).
> - 검증 (tmux 2분할): 왼쪽 `yy` → 오른쪽 `p` (줄 단위), 왼쪽 `3yy` → 오른쪽 `2p` (6줄), 오른쪽 `yiw` → 왼쪽 `p` (글자 단위로 줄 끝에) 모두 확인.

---

## 9단계. tmux 분할 alias (`t4` / `v` / `h`)

셸에서 짧은 명령으로 tmux 창을 나누기 위한 alias다.
사전 확인: `type t4 v h` → 모두 `not found`여야 한다 (다른 명령과 이름이 겹치면 사용자에게 알린다). `which tmux`로 tmux 설치 여부도 확인.

`~/.bashrc` 맨 아래에 없으면 추가 (예전 `alias v=...` / `alias h=...` 두 줄이 있으면 아래 `# v / h` 블록으로 교체, 2026-11-20 변경):
```bash
# tmux 4-pane layout
alias t4='tmux new-session \; split-window -h \; split-window -v \; select-pane -t 0 \; split-window -v \; select-layout tiled'
# v / h : 지금 pane 을 n칸으로 같은 크기로 나눔 (v 좌우, h 상하)
#   v, h   → 2칸 (예전과 같음)
#   3v, 4h → 3칸 좌우, 4칸 상하 (2~9)   v 3, h 4 처럼 써도 같음
#   나눈 뒤 커서는 원래 pane 에 남음, 새 pane 은 지금 폴더에서 시작
unalias v h 2>/dev/null
_tsplit() {
    local flag=$1 n=${2:-2} cur=$TMUX_PANE i
    if [ -z "$TMUX" ]; then
        echo "tmux 안에서만 사용 가능" >&2; return 1
    fi
    if ! [[ "$n" =~ ^[0-9]+$ ]] || [ "$n" -lt 2 ]; then
        echo "칸 수는 2 이상 숫자 (입력: $n)" >&2; return 1
    fi
    # 오른쪽(아래)에 나머지 칸 크기만큼 떼어내는 걸 반복 → 모든 칸이 같은 크기
    for ((i = n; i > 1; i--)); do
        cur=$(tmux split-window "$flag" -t "$cur" -l "$((100 * (i - 1) / i))%" -c "$PWD" -P -F '#{pane_id}') || return 1
    done
    tmux select-pane -t "$TMUX_PANE"
}
v() { _tsplit -h "$@"; }
h() { _tsplit -v "$@"; }
for n in 2 3 4 5 6 7 8 9; do
    eval "${n}v() { _tsplit -h $n; }; ${n}h() { _tsplit -v $n; }"
done
unset n
```
> - `t4`: tmux 세션을 새로 만들면서 2×2로 4분할한다. **tmux 밖에서** 실행한다.
> - `v` / `h`: 현재 pane을 분할한다. `3v`·`4h`(또는 `v 3`·`h 4`)처럼 숫자를 붙이면 그 칸 수로 **같은 크기**로 나눈다 (2~9). 새 pane은 현재 폴더에서 시작하고, 커서는 원래 pane에 남는다. **tmux 안에서만** 동작한다 (밖에서는 안내 메시지).
> - 같은 크기 원리: n칸이면 지금 pane에서 `(n-1)/n` 크기를 떼어내고, 떼어낸 pane에서 다시 `(n-2)/(n-1)`… 를 반복한다.
> - 이름 규칙은 vim의 `:vsplit`(좌우) / `:split`(상하)과 같다. tmux 옵션 이름(`-h`=좌우, `-v`=상하)과는 반대이니 헷갈리지 말 것.
> - `unalias v h`가 꼭 필요하다: 예전 alias가 남은 셸에서 `source ~/.bashrc`하면 alias가 먼저 펼쳐져서 `v() {` 함수 정의가 깨진다.

검증:
```bash
bash -ic 'alias t4; type -t v h 3v 4h _tsplit'
# → alias t4=... 와 function 5개가 나오면 성공
```
적용: `source ~/.bashrc`
> **alias 추가 전에 열려 있던 셸(tmux 창 포함)에는 적용되지 않는다.** 그 창에서 `v`/`h`가 `command not found`면
> 그 창에서 `source ~/.bashrc`를 실행하거나 새 창을 열도록 안내한다 (실제로 이 때문에 "갑자기 안 된다"는 문제가 있었음).

### 9-1. `tsv`: System_Verilog 작업 화면 한 번에 만들기
```
┌──────────────┬──────────────┬──────────┐
│ project_0930 │ sources_1/new│ vivado   │  ← 위 20%
│   (38%)      │   (37%)      ├──────────┤
│              │              │ 저장소    │  ← 아래 80%
│              │              │ 루트(25%) │
└──────────────┴──────────────┴──────────┘
```
`~/.bashrc`의 tmux alias 아래에 추가 (`B`는 **이 PC의 System_Verilog 저장소 경로**로 바꾼다. 예: `/mnt/c/26_AI_CAMP/System_Verilog`, `/mnt/d/26_AI_CAMP_2/System_Verilog`):
```bash
# tsv [프로젝트폴더] : System_Verilog 작업 화면 (왼쪽 프로젝트 | 가운데 sources_1/new | 오른쪽 위 vivado / 아래 저장소 루트)
#   프로젝트폴더 생략 시 vivado/ 안에서 가장 최근에 수정된 폴더
tsv() {
    local B=/mnt/c/26_AI_CAMP/System_Verilog
    local D0 D1 D2="$B/vivado" D3="$B" p0 p1 p2
    if [ -n "$1" ]; then D0="$D2/$1"; else D0=$(ls -dt "$D2"/*/ 2>/dev/null | head -1); D0="${D0%/}"; fi
    [ -d "$D0" ] || { echo "tsv: 프로젝트 폴더 없음: $D0  (vivado/ 안의 폴더: $(ls "$D2" | tr '\n' ' '))" >&2; return 1; }
    D1=$(ls -d "$D0"/*.srcs/sources_1/new 2>/dev/null | head -1); [ -n "$D1" ] || D1="$D0"
    if [ -n "$TMUX" ]; then
        p0=$(tmux new-window -P -F '#{pane_id}' -c "$D0")
    elif tmux has-session -t sv 2>/dev/null; then
        tmux attach -t sv; return
    else
        p0=$(tmux new-session -d -s sv -x "$(tput cols)" -y "$(tput lines)" -P -F '#{pane_id}' -c "$D0")
    fi
    p1=$(tmux split-window -h -l 62% -t "$p0" -P -F '#{pane_id}' -c "$D1")
    p2=$(tmux split-window -h -l 40% -t "$p1" -P -F '#{pane_id}' -c "$D2")
    tmux split-window -v -l 80% -t "$p2" -c "$D3"
    tmux select-pane -t "$p0"
    if [ -z "$TMUX" ]; then tmux attach -t sv; fi
}
```
> - 사용: `tsv` (vivado/ 안에서 **가장 최근에 수정된 프로젝트 폴더**) 또는 `tsv project_1001` (폴더 지정).
> - 가운데 창은 `<프로젝트>/*.srcs/sources_1/new`를 자동으로 찾는다 (`.srcs` 이름이 프로젝트 폴더명과 달라도 됨, 없으면 프로젝트 폴더).
> - tmux 밖: `sv` 세션을 만들어 접속. 이미 `sv` 세션이 있으면 새로 만들지 않고 **그 세션에 다시 접속**(열어둔 vim 그대로).
> - tmux 안: 현재 세션에 새 창(window)으로 같은 배치를 만든다 (`Ctrl+b n`/`p`로 창 전환).
> - 분할 순서를 고정하고 `pane_id`로 지정하므로 창 번호가 0(왼쪽) 1(가운데) 2(오른쪽 위) 3(오른쪽 아래)로 항상 같다.
> - 마지막 줄을 `[ -z "$TMUX" ] && ...`로 쓰면 tmux 안에서 종료 코드가 1이 되므로 `if`로 쓴다.

검증 (별도 tmux 서버 `-L tsvtest`에서 해서 사용 중인 세션을 건드리지 않는다. **Claude가 tmux 안에서 돌고 있으면 그냥 `tsv`를 실행하면 사용자 세션에 창이 생긴다**):
```bash
env -u TMUX bash -ic 'tput() { [ "$1" = cols ] && echo 200 || echo 50; }; tmux() { if [ "$1" = attach ]; then echo "(attach)"; else command tmux -L tsvtest "$@"; fi; }; tsv; echo "exit=$?"; command tmux -L tsvtest list-panes -t sv -F "#{pane_index} #{pane_width}x#{pane_height} #{pane_current_path}"; command tmux -L tsvtest kill-server'
# → exit=0, 창 4개: 0 프로젝트 / 1 sources_1/new / 2 vivado(낮음) / 3 저장소 루트(높음)
```

---

## 10단계. `git status`에서 폴더명이 `./`로 사라지는 문제

**겪은 문제:** 저장소 하위 폴더(예: `project_0930/`) 안에서 `git status`를 하면, 추적 안 된 그 폴더가
`project_0930/`가 아니라 `./`로 표시되어 어느 폴더인지 알 수 없다. git이 경로를 **현재 폴더 기준**으로 보여주기 때문이다.
→ 항상 **저장소 루트 기준** 경로로 보이게 설정한다.

```bash
git config --global status.relativePaths false
```

검증 (저장소의 하위 폴더 안에서):
```bash
git config --global --get status.relativePaths   # → false
git status --short                                # → ?? project_0930/  처럼 폴더명이 보이면 성공
```

---

## 11단계. vim Verilog 편집 보조: 자동완성 목록 + 문법 오류 표시

- **자동완성:** `.v`/`.sv` 파일에서 2글자 이상 입력하면 커서 아래에 후보 목록이 뜬다 (파일 안 단어 + Verilog/SystemVerilog 키워드). `↑`/`↓`로 고르고 `Tab`으로 완성하면 목록이 닫히고 다시 뜨지 않는다.
- **문법 오류:** **`:w` 저장할 때만** ALE 플러그인이 Verilator(`--lint-only`)로 검사해서 왼쪽에 `>>`(오류) / `--`(경고)를 표시하고, 해당 줄 끝에 `/* E: ... */` 주석처럼 메시지를 보여준다.
  사용자는 입력 중 실시간 검사를 **방해된다고 싫어한다** → 입력 중·파일 열 때 검사는 모두 끈다.

### 11-1. 사전 확인: Verilator
```bash
verilator --version     # 없으면 사용자에게 `! sudo apt install verilator` 실행 안내
```
> 원래 PC는 Verilator를 소스로 빌드해 `~/verilator/bin`에 두고 `~/.bashrc`에서 PATH에 추가했다 (`export PATH="$HOME/verilator/bin:$PATH"`).
> apt 버전(5.x)으로도 충분하다.

### 11-2. ALE 설치 + 키워드 사전 만들기
```bash
[ -d ~/.vim/pack/plugins/start/ale ] || git clone --depth 1 https://github.com/dense-analysis/ale ~/.vim/pack/plugins/start/ale
mkdir -p ~/.vim/dict
python3 - <<'EOF'
# vim 내장 verilog/systemverilog 문법 파일에서 키워드를 뽑아 자동완성 사전 생성
import re, glob, os
words = set()
for f in glob.glob('/usr/share/vim/vim9*/syntax/*verilog.vim'):
    if 'ams' in f: continue
    for line in open(f, encoding='utf-8', errors='ignore'):
        m = re.match(r'\s*syn(?:tax)?\s+keyword\s+\S+\s+(.*)', line)
        if m:
            for w in m.group(1).split():
                if w.startswith(('contained','nextgroup','skipwhite','transparent')) or '=' in w: continue
                w = w.strip('\\')
                if re.fullmatch(r'\$?[A-Za-z_][A-Za-z0-9_$]*', w): words.add(w)
words.update("always_ff always_comb always_latch logic bit byte int shortint longint unique priority typedef enum struct packed interface modport import package endpackage localparam parameter generate endgenerate genvar initial final assign posedge negedge begin end module endmodule input output inout wire reg integer case casez casex endcase default function endfunction task endtask $display $monitor $finish $stop $time $random $readmemh $readmemb $clog2 $fopen $fclose $fwrite".split())
open(os.path.expanduser('~/.vim/dict/verilog.dict'), 'w').write('\n'.join(sorted(words)) + '\n')
print(len(words), 'words')
EOF
```

### 11-3. `~/.vimrc` 맨 아래에 추가
```vim
" ==========================================
"  Verilog 편집 보조: 자동완성 목록 + 문법 오류 표시
" ==========================================
" 2글자 이상 입력하면 아래에 후보 목록 표시 (파일 안 단어 + Verilog 키워드 사전)
set completeopt=menuone,noinsert,noselect
function! s:VerilogAutoComplete()
    let l:word = matchstr(getline('.')[: col('.') - 2], '\k\+$')
    " Tab 으로 방금 완성한 단어면 목록 다시 띄우지 않음 (글자를 더 치거나 지우면 다시 동작)
    if exists('b:vac_done')
        if l:word ==# b:vac_done | return | endif
        unlet b:vac_done
    endif
    if !pumvisible() && strchars(l:word) >= 2
        call feedkeys("\<C-n>", 'n')
    endif
endfunction
" 목록에서 단어를 골라 완성했을 때 그 단어를 기억
function! s:VerilogAccepted()
    if !empty(v:completed_item)
        let b:vac_done = v:completed_item.word
    endif
endfunction
" 단어를 다 쳐서 더 길게 이어지는 후보가 없으면 목록 닫기 (예: module 까지 치면 닫힘, end 는 endmodule 이 남아 유지)
function! s:VerilogCloseDone()
    if !pumvisible() | return | endif
    let l:word = matchstr(getline('.')[: col('.') - 2], '\k\+$')
    if empty(l:word) | return | endif
    for l:it in get(complete_info(['items']), 'items', [])
        if l:it.word !=# l:word && stridx(l:it.word, l:word) == 0 | return | endif
    endfor
    call feedkeys("\<C-e>", 'n')
endfunction
augroup verilog_edit
    autocmd!
    autocmd FileType verilog,systemverilog setlocal dictionary=~/.vim/dict/verilog.dict complete=.,w,b,k iskeyword+=$
    autocmd FileType verilog,systemverilog autocmd! verilog_edit TextChangedI <buffer> call s:VerilogAutoComplete()
    " 목록이 떠 있는 동안의 입력은 TextChangedP 로 들어옴
    autocmd FileType verilog,systemverilog autocmd! verilog_edit TextChangedP <buffer> call s:VerilogCloseDone()
    autocmd FileType verilog,systemverilog autocmd! verilog_edit CompleteDone <buffer> call s:VerilogAccepted()
augroup END
" ↑ / ↓ : 목록에서 단어 고르기 (vim 기본 동작)
" Tab     : 고른 단어로 완성 + 목록 닫기 (아무것도 안 골랐으면 첫 번째 후보로 완성), 목록이 없으면 원래 Tab
inoremap <expr> <Tab> pumvisible() ? (complete_info(['selected']).selected == -1 ? "\<C-n>\<C-y>" : "\<C-y>") : "\<Tab>"

" 문법 오류 표시 (ALE + Verilator): :w 저장 시 검사, 왼쪽에 >> 오류 / -- 경고 + 줄 끝에 메시지
let g:ale_linters = {'verilog': ['verilator'], 'systemverilog': ['verilator']}
let g:ale_linters_explicit = 1          " Verilog 외 다른 파일은 검사 안 함
let g:ale_sign_error = '>>'
let g:ale_sign_warning = '--'
let g:ale_echo_msg_format = '[%linter%] %severity%: %s'
" 입력 중에는 검사 안 함 → :w 저장할 때만 한 번 검사, 결과는 줄 끝에 주석처럼 표시
let g:ale_lint_on_text_changed = 'never'
let g:ale_lint_on_insert_leave = 0
let g:ale_lint_on_enter = 0
let g:ale_lint_on_filetype_changed = 0
let g:ale_lint_on_save = 1
let g:ale_virtualtext_cursor = 'all'
" --timing : #5 / @(posedge clk) / wait 같은 지연 문법을 시뮬레이터처럼 이해 (Verilator 5 는 안 주면 NEEDTIMINGOPT 오류)
let g:ale_verilog_verilator_options = '--timing'
" TB 파일(tb_*.v, sim_file/ 안)은 always #5 clk = ~clk 같은 블로킹(=) 이 정상이라 BLKSEQ 경고 끔
" + new() 인자를 멤버와 같은 이름으로 짓고 this. 로 구분하는 것도 정상이라 VARHIDDEN 경고 끔 (RTL 은 그대로 검사)
augroup ale_tb
    autocmd!
    autocmd BufRead,BufNewFile tb_*.v,tb_*.sv,*/sim_file/*.v,*/sim_file/*.sv
        \ let b:ale_verilog_verilator_options = '--timing -Wno-BLKSEQ -Wno-VARHIDDEN'
augroup END
```
> 이미 11-3이 적용된 PC: `grep -c 'Wno-VARHIDDEN' ~/.vimrc` → `0`이면 `'--timing -Wno-BLKSEQ'`를 `'--timing -Wno-BLKSEQ -Wno-VARHIDDEN'`으로 바꾸고 위 주석 한 줄을 추가한다 (2026-11-05).
> - 자동완성은 Verilog 파일에서만 켜진다. 키워드 사전은 `iskeyword+=$`로 `$display` 같은 시스템 함수도 포함.
> - ALE는 Verilator를 `-Wall`로 돌리므로 오류뿐 아니라 "사용 안 한 신호" 같은 경고(`--`)도 나온다.
> - vim은 셸의 PATH를 물려받으므로, Verilator가 PATH에 있는 셸에서 vim을 실행해야 한다.
> - **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열도록 안내한다.

> - **단어를 끝까지 치면 목록이 닫혀야 한다** (사용자 요청 2026-10-03). `menuone` 때문에 후보가 자기 자신 하나만 남아도 목록이 계속 떠 있었음 → 목록이 떠 있을 때의 입력은 `TextChangedI`가 아니라 `TextChangedP`로 들어오므로 거기서 `s:VerilogCloseDone()`으로 닫는다. 확인: `modu` → 목록, `module` → 닫힘, `end` → `endcase`·`endmodule` 후보가 있어 유지. `en` → `↓↓` → `Tab` → `endcase`로 완성되고 목록이 다시 뜨지 않음.

### 11-4. 검증 (tmux 임시 세션에서 실제 화면 확인)
```bash
SP=<스크래치패드>; cd "$SP"
printf 'module(\n  input clk\n);\nendmodule\n' > bad.v
tmux new-session -d -s vt -x 110 -y 20 "bash -ic 'vim $SP/bad.v'"; sleep 4
tmux capture-pane -p -t vt | head -2          # → 파일만 열었을 땐 >> 표시가 없어야 함 (저장 시에만 검사)
tmux send-keys -t vt ':w' Enter; sleep 3
tmux capture-pane -p -t vt | head -2          # → ">>  1 module(  /* E: syntax error ..." 가 보이면 문법 검사 성공
tmux send-keys -t vt G o 'alw'; sleep 1
tmux capture-pane -p -t vt | grep always      # → always / always_comb ... 후보 목록이 보이면 자동완성 성공
tmux send-keys -t vt Down Down Tab; sleep 1
tmux capture-pane -p -t vt | grep -c always   # → 1 (고른 단어로 완성되고 목록은 닫힘)
tmux send-keys -t vt Escape ':q!' Enter; tmux kill-session -t vt 2>/dev/null
```

### 11-5. 새 `.v` / `.sv` 파일 기본 틀 자동 삽입
`vim 새파일.v`처럼 **없는 파일**을 만들 때만 timescale + `module 파일이름(); endmodule` 틀을 넣는다 (기존 파일은 그대로).
`~/.vimrc`에 추가:
```vim
function! s:VerilogTemplate()
    let l:name = expand('<afile>:t:r')
    call setline(1, ['`timescale 1ns / 1ps', '', '', 'module ' . l:name . '(', '', '', ');', '', '', 'endmodule'])
    call cursor(5, 1)   " 포트 목록 안에서 시작
endfunction
augroup verilog_template
    autocmd!
    autocmd BufNewFile *.v,*.sv call s:VerilogTemplate()
augroup END
```
검증: `vim -es -u ~/.vimrc -c wq "$SP/My_Mux.v"; cat "$SP/My_Mux.v"` → `module My_Mux(` 가 들어 있으면 성공.

---

### 11-6. 명령줄 Tab: `:s` / `:g` 패턴과 `/` 검색에서 파일 속 단어로 자동완성
vim 9.1(패치 1-16) 기본 기능으로는 `:%s/w<Tab>`의 패턴 자리에서 Tab이 자동완성되지 않고 `^I`가 그대로 들어간다 (사용자 요청 2026-10-03).
→ 패턴·바꿀 말 자리와 `/` `?` 검색에서만 Tab을 가로채서 **현재 파일의 단어**로 완성, 계속 누르면 다음 후보 (한 바퀴 돌면 원래 글자). 그 밖의 명령줄은 `wildcharm`으로 원래 Tab 완성을 그대로 쓴다.
`~/.vimrc` 맨 아래에 추가:
```vim
" ==========================================
"  명령줄 Tab : :s / :g 패턴, / ? 검색 안에서 파일 속 단어로 자동완성
" ==========================================
" 예) :%s/w<Tab> → w_sum, <Tab> → w_cout ... (계속 누르면 다음 후보, 한 바퀴 돌면 원래 글자)
" 그 밖의 명령줄(:e 파일 등)은 원래 Tab 자동완성 그대로
set wildcharm=<C-z>
function! s:CmdTab()
    let l:type = getcmdtype()
    let l:before = getcmdline()[: getcmdpos() - 2]
    let l:in_pat = l:type =~# '[/?]' ||
        \ (l:type ==# ':' && l:before =~# '\v^\s*[%.,$0-9'']*(s%[ubstitute]|g%[lobal]|v%[global])/[^/]*(/[^/]*)?$')
    if !l:in_pat
        return "\<C-z>"
    endif
    let l:word = matchstr(l:before, '\k*$')
    " 방금 Tab 으로 넣은 단어 뒤라면 다음 후보로 교체
    if exists('s:ct') && l:word ==# s:ct.list[s:ct.idx]
        let s:ct.idx = (s:ct.idx + 1) % len(s:ct.list)
        return repeat("\<BS>", strchars(l:word)) . s:ct.list[s:ct.idx]
    endif
    if empty(l:word) | return '' | endif
    let l:words = split(join(getline(1, '$'), ' '), '\k\@!.')
    let l:cands = uniq(sort(filter(l:words, 'v:val =~# "^" . l:word && v:val !=# l:word')))
    if empty(l:cands) | return '' | endif
    let s:ct = {'list': [l:word] + l:cands, 'idx': 1}
    return repeat("\<BS>", strchars(l:word)) . s:ct.list[1]
endfunction
cnoremap <expr> <Tab> <SID>CmdTab()
```
검증 (tmux 임시 세션, `wire w_sum; wire w_cout;` 가 있는 파일): `:%s/w` + Tab → `:%s/w_cout` → Tab → `w_sum` → `wire` → `w` / `:%s/w_sum/w_c` + Tab → `w_cout` / `/as` + Tab → `/assign` / `:colo` + Tab → `:colorscheme` (원래 동작).

---

## 12단계. `watch_html "파일명"`: HTML 파일을 Windows 브라우저로 열기

WSL에서 `explorer.exe 파일.html`처럼 **리눅스 상대 경로**를 넘기면 브라우저가 열리지 않는다 (실제로 겪은 문제).
Windows 경로(`C:\...`)로 바꿔서 `cmd.exe /c start`로 열어야 한다.
사전 확인: `type -t watch_html` → 출력이 없어야 한다 (이름 충돌 없음). `open`은 리눅스 기본 명령(`xdg-open`으로 연결됨)이라 쓰지 않는다.

`~/.bashrc` 맨 아래에 없으면 추가:
```bash
# ==========================================
#  watch_html "파일명" : HTML 파일을 Windows 기본 브라우저로 열기
# ==========================================
watch_html() {
    if [ $# -ne 1 ] || [ ! -f "$1" ]; then
        echo "사용법: watch_html \"파일명.html\"  (파일이 없거나 인자가 잘못됨: $1)" >&2
        return 1
    fi
    local win
    win=$(wslpath -w "$(realpath "$1")") || return 1
    (cd /mnt/c && cmd.exe /c start "" "$win")
}
```
> - `cd /mnt/c`: 리눅스 폴더에서 `cmd.exe`를 실행하면 UNC 경로 경고가 나와서 Windows 폴더로 옮겨서 실행한다.
> - `start` 다음의 `""`는 창 제목 자리다. 빠뜨리면 경로를 제목으로 착각해서 열리지 않는다.
> - `explorer.exe`는 성공해도 종료 코드 1을 돌려주므로 성공 여부 판단에 쓰지 않는다.

검증:
```bash
bash -ic 'type -t watch_html; watch_html 없는파일.html; echo "exit=$?"'
# → function, 사용법 안내 메시지, exit=1
```
실제 사용: `watch_html tmux-cheatsheet.html` → 브라우저가 열리는지 사용자에게 확인받는다.
적용: `source ~/.bashrc` (이미 열린 창에서는 이걸 실행해야 함)

---

## 13단계. `viva`: System_Verilog 작업 폴더로 바로 이동

사전 확인: `type -t viva` → 출력이 없어야 한다 (이름 충돌 없음).
경로는 PC마다 다를 수 있으니, 다른 PC에서는 실제 작업 폴더 경로로 바꿔서 넣는다.

`~/.bashrc` 맨 아래에 없으면 추가:
```bash
# viva : System_Verilog 작업 폴더로 바로 이동
alias viva='cd /mnt/c/26_AI_CAMP/System_Verilog'
```

검증:
```bash
bash -ic 'viva && pwd'
# → /mnt/c/26_AI_CAMP/System_Verilog
```
적용: `source ~/.bashrc` (이미 열린 창에서는 이걸 실행해야 함)

---

## 14단계. `ppt [파일명|폴더명]`: PPT 파일을 Windows PowerPoint로 열기

12단계 `watch_html`과 같은 방식(Windows 경로로 바꿔서 `cmd.exe /c start`)이다. PPT가 있는 폴더로 `cd` 한 뒤 쓰는 것을 기준으로 한다: 인자 없이 `ppt`면 현재 폴더의 `.ppt`/`.pptx` 전부, `ppt 이름`이면 현재 폴더의 그 파일(확장자 생략 가능), 폴더를 주면 그 안의 PPT 전부를 연다 (하위 폴더는 안 봄, 대소문자 무시, PowerPoint가 만드는 `~$` 잠금파일은 제외).
사전 확인: `type -t ppt` → 출력이 없어야 한다 (이름 충돌 없음).
> `function`이 나오고 `~/.bashrc`에 예전 버전(`ppt "파일명|폴더명"` 주석, 인자 없으면 사용법 오류)이 있으면 그 `ppt()` 블록을 아래 것으로 **교체**한다 (새로 추가 금지).

`~/.bashrc` 맨 아래에 없으면 추가:
```bash
# ==========================================
#  ppt [이름] : 현재 폴더의 PPT를 Windows PowerPoint로 열기
#   - ppt            → 현재 폴더의 .ppt/.pptx 전부
#   - ppt 이름       → 현재 폴더의 "이름" / "이름.pptx" / "이름.ppt" (확장자 생략 가능)
#   - ppt 폴더명     → 그 폴더 안의 .ppt/.pptx 전부
#   - PowerPoint 잠금파일(~$*.pptx)은 건너뜀
# ==========================================
ppt() {
    local target="${1:-.}" files=() f c
    if [ $# -gt 1 ]; then
        echo "사용법: ppt  |  ppt \"파일명\"  |  ppt \"폴더명\"" >&2
        return 1
    fi
    if [ -d "$target" ]; then
        shopt -s nullglob nocaseglob
        for f in "$target"/*.ppt "$target"/*.pptx; do
            [[ "$(basename "$f")" == '~$'* ]] || files+=("$f")
        done
        shopt -u nullglob nocaseglob
        if [ ${#files[@]} -eq 0 ]; then
            echo "ppt: '$(realpath "$target")' 폴더에 .ppt/.pptx 파일이 없음" >&2
            return 1
        fi
    else
        for c in "$target" "$target.pptx" "$target.ppt"; do
            [ -f "$c" ] && { files=("$c"); break; }
        done
        if [ ${#files[@]} -eq 0 ]; then
            echo "ppt: '$PWD'에 '$target'(.pptx/.ppt) 없음" >&2
            return 1
        fi
    fi
    for f in "${files[@]}"; do
        f=$(realpath "$f")
        echo "열기: $f"
        (cd /mnt/c && cmd.exe /c start "" "$(wslpath -w "$f")")
    done
}
```
> - 파일 이름에 공백이 있으면 따옴표로 감싼다: `ppt "파이썬 프로젝트 발표자료.pptx"`

검증:
```bash
bash -ic 'type -t ppt; ppt 없는파일; echo "exit=$?"'
# → function, "없음" 안내 메시지, exit=1
```
실제 사용: PPT 파일 하나로 `ppt "파일.pptx"` → PowerPoint 창이 뜨는지 확인 (`powershell.exe -c "(Get-Process POWERPNT).MainWindowTitle"`).
적용: `source ~/.bashrc` (이미 열린 창에서는 이걸 실행해야 함)

---

## 15단계. 테마: Catppuccin Mocha + `theme` 명령으로 한 번에 전환

사용자가 Gruvbox가 "구리다"고 해서 후보 7개를 하나씩 적용해 보고 **Catppuccin Mocha**로 정했다 (2026-10-03, 최종 후보: Catppuccin / One Dark / Everforest).
터미널(Windows Terminal) 색 구성표, vim colorscheme, tmux 상태바를 **`theme` 명령 하나로 같이** 바꾼다. 1·2·3단계의 Gruvbox 설정은 이 단계로 대체된다.

### 15-1. vim 테마 플러그인 설치
```bash
cd ~/.vim/pack/themes/start
for r in catppuccin/vim:catppuccin ghifarit53/tokyonight-vim:tokyonight joshdick/onedark.vim:onedark nordtheme/vim:nord \
         dracula/vim:dracula sainnhe/everforest:everforest rose-pine/vim:rose-pine; do
  [ -d "${r##*:}" ] || git clone -q --depth 1 "https://github.com/${r%%:*}" "${r##*:}"
done
```

### 15-2. 전환 스크립트 설치
저장소의 `ubuntu-terminal-setup/theme.py`를 복사한다 (테마별 16색·vim·tmux 색이 모두 들어 있음, Windows Terminal 설정 파일 위치는 자동으로 찾음).
```bash
mkdir -p ~/.theme && cp <저장소>/ubuntu-terminal-setup/theme.py ~/.theme/theme.py
```
`~/.bashrc` 맨 아래에 추가:
```bash
# theme [이름|next|prev] : 터미널·vim·tmux 색 테마를 한 번에 바꾸기 (~/.theme/theme.py)
theme() { python3 ~/.theme/theme.py "$@"; }
```

### 15-3. vim / tmux 가 테마 파일을 읽도록 교체 (백업 먼저)
`~/.vimrc`: `let g:gruvbox_contrast_dark` ~ `augroup BlackBackground` ~ `colorscheme gruvbox` ~ `let g:terminal_ansi_colors = [...]` 블록을 **통째로** 아래로 교체:
```vim
" 테마 : 터미널·vim·tmux 색을 theme 명령으로 한 번에 바꿈 (~/.theme/theme.py)
" 실제 colorscheme 설정은 자동 생성 파일 ~/.vim/theme.vim 에 있음
if filereadable(expand('~/.vim/theme.vim'))
    source ~/.vim/theme.vim
else
    colorscheme gruvbox
endif
```
`~/.tmux.conf`: `#  Gruvbox 테마` 섹션(상태바 ~ `set -g mode-style ...`)을 통째로 아래로 교체:
```bash
# ==========================================
#  테마 : theme 명령이 만드는 파일 (~/.theme/theme.py)
# ==========================================
source-file -q ~/.tmux/theme.conf
```

### 15-4. 적용
```bash
source ~/.bashrc
theme catppuccin      # → ~/.vim/theme.vim, ~/.tmux/theme.conf 생성 + Windows Terminal 색 구성표 추가·기본값 지정
```
> - `theme.py`가 하는 일: ① `~/.vim/theme.vim` 생성 (colorscheme + `:term` 16색) ② `~/.tmux/theme.conf` 생성 후 `tmux source-file` ③ `settings.json`의 `schemes`에 색 구성표 추가하고 `profiles.defaults.colorScheme` 지정 (처음 한 번 `settings.json.bak_theme` 백업).
> - Windows Terminal·tmux는 바로 바뀐다. **열려 있는 vim은 `:so ~/.vim/theme.vim`** 또는 다시 열어야 바뀐다.
> - `settings.json`을 JSON으로 다시 쓰므로 그 안의 `//` 주석은 사라진다.
> - Dracula는 vim에서 배경이 투명하게 나와서 `highlight Normal guibg=#282A36`을 덧붙여 둠.

검증:
```bash
theme | head -2                                   # → "* catppuccin  Catppuccin Mocha"
vim -Nu ~/.vimrc -es -c 'redir! > /dev/stdout | echo g:colors_name synIDattr(hlID("Normal"),"bg#") | redir END | q'
# → catppuccin_mocha #1e1e2e
tmux show -g status-style                         # → bg=#181825,fg=#CDD6F4
# (33단계까지 적용했으면 → #45475a / bg=#45475A,fg=#CDD6F4)
```

---

## 16단계. `pdf [파일명|폴더명]`: PDF 파일을 Windows 기본 PDF 뷰어로 열기

14단계 `ppt`와 같은 방식이다 (Windows 경로로 바꿔서 `cmd.exe /c start`). 인자 없이 `pdf`면 현재 폴더의 `.pdf` 전부, `pdf 이름`이면 그 파일(확장자 생략 가능), 폴더를 주면 그 안의 PDF 전부를 연다 (하위 폴더는 안 봄, 대소문자 무시).
어떤 프로그램으로 열릴지는 Windows **기본 앱 설정**을 따른다 (이 PC는 Microsoft Edge). `assoc .pdf`에 연결이 안 나와도 설정 앱에서 정한 기본 앱으로 열린다.
사전 확인: `type -t pdf` → 출력이 없어야 한다 (이름 충돌 없음).

`~/.bashrc`의 `ppt()` 아래에 추가:
```bash
# ==========================================
#  pdf [이름] : 현재 폴더의 PDF를 Windows 기본 PDF 뷰어로 열기
#   - pdf            → 현재 폴더의 .pdf 전부
#   - pdf 이름       → 현재 폴더의 "이름" / "이름.pdf" (확장자 생략 가능)
#   - pdf 폴더명     → 그 폴더 안의 .pdf 전부
# ==========================================
pdf() {
    local target="${1:-.}" files=() f c
    if [ $# -gt 1 ]; then
        echo "사용법: pdf  |  pdf \"파일명\"  |  pdf \"폴더명\"" >&2
        return 1
    fi
    if [ -d "$target" ]; then
        shopt -s nullglob nocaseglob
        files=("$target"/*.pdf)
        shopt -u nullglob nocaseglob
        if [ ${#files[@]} -eq 0 ]; then
            echo "pdf: '$(realpath "$target")' 폴더에 .pdf 파일이 없음" >&2
            return 1
        fi
    else
        for c in "$target" "$target.pdf" "$target.PDF"; do
            [ -f "$c" ] && { files=("$c"); break; }
        done
        if [ ${#files[@]} -eq 0 ]; then
            echo "pdf: '$PWD'에 '$target'(.pdf) 없음" >&2
            return 1
        fi
    fi
    for f in "${files[@]}"; do
        f=$(realpath "$f")
        echo "열기: $f"
        (cd /mnt/c && cmd.exe /c start "" "$(wslpath -w "$f")")
    done
}
```
> - 파일 이름에 공백이 있으면 따옴표로 감싼다: `pdf "회로 설계 보고서"`

검증:
```bash
bash -ic 'type -t pdf; pdf 없는파일; echo "exit=$?"'
# → function, "없음" 안내 메시지, exit=1
```
실제 사용: PDF 하나로 `pdf "파일"` → 뷰어 창이 뜨는지 확인 (`powershell.exe -c "Get-Process | ? MainWindowTitle -like '*파일*'"`).
적용: `source ~/.bashrc` (이미 열린 창에서는 이걸 실행해야 함)

---

## 17단계. `md [파일명|폴더명]`: Markdown을 VS Code 미리보기처럼 보기

`.md`를 GitHub/VS Code 미리보기와 같은 모양(제목·표·코드 블록 색)으로 **Windows 기본 브라우저**에서 연다. 사용법은 16단계 `pdf`와 같다: 인자 없이 `md`면 현재 폴더의 `.md` 전부, `md 이름`이면 그 파일(확장자 생략 가능), 폴더를 주면 그 안의 `.md` 전부.
- 동작: `md`가 파일마다 `~/.mdview/mdview.py serve <원본.md> <md 폴더> <제목> --idle-exit`를 `setsid`로 띄운다. 서버는 `http://localhost:<빈 포트>/`를 Windows 기본 브라우저로 열고, 원본 파일이 바뀔 때마다(0.1초 간격 확인) 새 내용을 브라우저로 보낸다 (SSE) → **vim 저장, Claude 수정 등 무엇으로 고쳐도 바로 반영**, 새로고침이나 `md` 재실행 필요 없음.
- 렌더러(marked, github-markdown-css, highlight.js)는 `~/.mdview/assets/`에서 페이지에 그대로 넣음 → 인터넷 없이 동작, 저장소 폴더에 파일이 안 생김.
- 서버는 브라우저 탭을 닫으면 약 15~20초 뒤 스스로 꺼진다 (2초마다 빈 메시지로 탭 닫힘 확인). `md`만 치고 탭이 60초 안에 안 붙어도 꺼진다. 터미널을 닫아도 탭이 열려 있으면 계속 동작한다.
- (2026-10-24 이전에는 Windows `%TEMP%\mdview\이름.html` 한 번 만들고 끝이라 고칠 때마다 `md`를 다시 쳐야 했다.)
- 밝은/어두운 색은 Windows 테마를 따라간다. 코드 블록 ` ```verilog ` / ` ```v ` / ` ```sv `는 Verilog 색으로 나온다. md 안의 상대 경로 그림(SVG 포함)도 보인다 (서버가 md 폴더 아래 파일만 보내줌, `127.0.0.1`에서만 열림).
- 10/01에 되돌린 glow(터미널 안 표시)·markdown-preview.nvim(vim 플러그인)과는 다른 방식이다 (vim·터미널 설정은 건드리지 않음).

사전 확인: `type -t md` → 출력이 없어야 한다 (이름 충돌 없음). `python3`, `curl` 필요 (추가 패키지 설치 없음).

### 17-1. 렌더러 파일 받기 + 변환 스크립트 복사
```bash
mkdir -p ~/.mdview/assets && cd ~/.mdview/assets
J=https://cdn.jsdelivr.net/npm
curl -sfL -o marked.min.js       $J/marked@12.0.2/marked.min.js
curl -sfL -o github-markdown.css $J/github-markdown-css@5.5.1/github-markdown.css
curl -sfL -o highlight.min.js    $J/@highlightjs/cdn-assets@11.9.0/highlight.min.js
curl -sfL -o verilog.min.js      $J/@highlightjs/cdn-assets@11.9.0/languages/verilog.min.js
curl -sfL -o hl-light.css        $J/@highlightjs/cdn-assets@11.9.0/styles/github.min.css
curl -sfL -o hl-dark.css         $J/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css
ls -l                            # 6개 파일, 크기 0 인 것 없어야 함
cp <저장소>/ubuntu-terminal-setup/mdview.py ~/.mdview/mdview.py
```
> **목차 링크 이동** (2026-11-18 추가, 저장소 `mdview.py`에 포함): marked v12는 제목에 id를 안 붙여서 `[1118 (수)](#1118-수)` 같은 목차 링크를 눌러도 아무 데도 안 갔다.
> 렌더링 후 모든 제목(`h1`~`h6`)에 GitHub 방식 id(소문자, 기호 삭제, 공백 → `-`, 같은 제목은 `-1`, `-2` …)를 붙이고, `#...` 링크 클릭은 직접 처리해서 그 제목으로 스크롤한다 (HTML 파일 모드의 `<base href="file:///...">` 때문에 다른 주소로 넘어가는 것도 막음).
> 이미 17단계를 적용한 PC는 `cp ~/.mdview/mdview.py ~/.mdview/mdview.py.bak_anchor` 후 위 `cp`만 다시 하면 된다 (`md`로 이미 열린 탭은 닫았다가 다시 열기).

### 17-2. `~/.bashrc`의 `pdf()` 아래에 추가
```bash
# ==========================================
#  md [이름] : Markdown을 VS Code 미리보기처럼 브라우저에서 실시간으로 보기
#   - md            → 현재 폴더의 .md 전부
#   - md 이름       → 현재 폴더의 "이름" / "이름.md" (확장자 생략 가능)
#   - md 폴더명     → 그 폴더 안의 .md 전부
#   - 파일이 바뀌면(vim 저장, Claude 수정 등) 브라우저에 바로 반영, 새로고침 필요 없음
#   - ~/.mdview/mdview.py serve 가 파일마다 localhost 서버를 띄움, 브라우저 탭을 닫으면 15초 뒤 자동 종료
# ==========================================
md() {
    local target="${1:-.}" files=() f c log url i
    if [ $# -gt 1 ]; then
        echo "사용법: md  |  md \"파일명\"  |  md \"폴더명\"" >&2
        return 1
    fi
    if [ -d "$target" ]; then
        shopt -s nullglob nocaseglob
        files=("$target"/*.md)
        shopt -u nullglob nocaseglob
        if [ ${#files[@]} -eq 0 ]; then
            echo "md: '$(realpath "$target")' 폴더에 .md 파일이 없음" >&2
            return 1
        fi
    else
        for c in "$target" "$target.md" "$target.MD"; do
            [ -f "$c" ] && { files=("$c"); break; }
        done
        if [ ${#files[@]} -eq 0 ]; then
            echo "md: '$PWD'에 '$target'(.md) 없음" >&2
            return 1
        fi
    fi
    mkdir -p ~/.mdview/live || return 1
    for f in "${files[@]}"; do
        f=$(realpath "$f")
        log=$(mktemp ~/.mdview/live/md_XXXXXX.log) || return 1
        # 터미널을 닫아도 서버가 남도록 setsid 로 분리 (서버가 브라우저도 염)
        setsid -f python3 ~/.mdview/mdview.py serve "$f" "$(dirname "$f")" "$(basename "$f")" --idle-exit \
            >"$log" 2>&1 </dev/null
        url=
        for i in $(seq 30); do
            url=$(head -1 "$log" 2>/dev/null)
            [ -n "$url" ] && break
            sleep 0.1
        done
        if [ -z "$url" ]; then
            echo "md: 미리보기 서버 실행 실패: $f" >&2
            cat "$log" >&2; rm -f "$log"
            return 1
        fi
        rm -f "$log"
        echo "열기: $f → $url (실시간, 탭 닫으면 자동 종료)"
    done
}
```
> - 파일 이름에 공백이 있으면 따옴표로 감싼다: `md "회의 메모"`
> - 파일을 고치면 열린 탭이 바로 바뀐다 (다시 실행할 필요 없음). 같은 파일을 `md`로 또 열면 탭과 서버가 하나 더 생긴다 (각자 탭을 닫으면 꺼짐).
> - 17-1의 `mdview.py`가 `--idle-exit` 기능이 있는 최신 버전이어야 한다 (저장소 `ubuntu-terminal-setup/mdview.py`를 다시 복사).

검증:
```bash
bash -ic 'type -t md; md 없는파일; echo "exit=$?"'
# → function, "없음" 안내 메시지, exit=1

# 실시간 반영 + 자동 종료 (가짜 cmd.exe로 브라우저를 띄우지 않고 확인, SP/fakebin 은 17-3 검증과 같음)
printf '# v1\n' > $SP/a.md; cd $SP
URL=$(PATH=$SP/fakebin:$PATH bash -ic 'md a' 2>/dev/null | grep -o 'http://localhost:[0-9]*/')
(timeout 5 curl -sN "${URL}events" > $SP/ev.txt &); sleep 1
printf '# v2\n' > $SP/a.md; sleep 4.5; grep -c 'v2' $SP/ev.txt      # → 1 (디스크 수정이 전달됨)
sleep 25; ps -eo args | grep -c '[s]erve .*a.md'                    # → 0 (탭 닫힘 → 서버 종료)
```
실제 사용: `cd <저장소>/ubuntu-terminal-setup && md terminal-setup` → 브라우저에 제목·표·코드 블록이 VS Code 미리보기처럼 보이는지 사용자에게 확인받는다.
적용: `source ~/.bashrc` (이미 열린 창에서는 이걸 실행해야 함)

### 17-3. vim `:Md`: 편집하면서 실시간 미리보기
vim에서 md를 고치는 동안 브라우저 미리보기가 **입력하는 대로 바로** 바뀐다 (`:w` 저장 안 해도 됨). 브라우저는 vim 커서가 있는 줄을 따라 스크롤된다 (VS Code 미리보기처럼).
- 동작: vim이 입력·커서 이동 때마다 버퍼 내용을 `~/.mdview/live/<vim pid>_<버퍼번호>.md`(+ `.pos`에 커서 줄)에 쓰고, `mdview.py serve`가 `http://localhost:<빈 포트>/`로 브라우저에 바로 보낸다 (SSE). 원본 md 파일은 건드리지 않는다.
- 서버는 vim job이라 `:MdStop`, 버퍼 닫기, vim 종료 때 같이 꺼진다. 꺼지면 브라우저 탭 제목에 `(연결 끊김)`이 붙는다.
- md 안의 상대 경로 그림은 서버가 md 폴더 아래 파일만 보내준다 (`127.0.0.1`에서만 열림).
- 키 매핑은 추가하지 않는다 (명령만). 미리보기를 켠 버퍼에서만 동작하고, 다른 파일 편집에는 영향 없음.

`~/.vimrc` 맨 아래에 추가 (17-1의 `mdview.py`가 `serve` 기능이 있는 최신 버전이어야 함):
```vim
" ==========================================
"  :Md : 편집 중인 md 를 브라우저에서 실시간 미리보기 (VS Code 처럼)
" ==========================================
" 입력할 때마다 버퍼 내용을 ~/.mdview/live/ 에 쓰면 mdview.py 서버가 브라우저로 바로 보냄 (:w 안 해도 됨)
" 브라우저는 vim 커서 위치를 따라 스크롤. :MdStop 또는 버퍼/vim 을 닫으면 서버 종료
function! s:MdPush(force)
    if empty(get(b:, 'mdlive', {})) | return | endif
    if a:force || b:mdlive.tick != b:changedtick
        call writefile(getline(1, '$'), b:mdlive.file)
        let b:mdlive.tick = b:changedtick
    endif
    let l:line = line('.') - 1
    if a:force || l:line != b:mdlive.line
        call writefile([l:line], b:mdlive.file . '.pos')
        let b:mdlive.line = l:line
    endif
endfunction
function! s:MdUrl(d, ch, msg)
    let a:d.url = a:msg
    echo 'Md: ' . a:msg . ' (브라우저에서 열림, 끄기 :MdStop)'
endfunction
function! s:MdStop(buf)
    let l:d = getbufvar(a:buf, 'mdlive', {})
    if empty(l:d) | return | endif
    call job_stop(l:d.job)
    call delete(l:d.file) | call delete(l:d.file . '.pos')
    call setbufvar(a:buf, 'mdlive', {})
    execute 'autocmd! mdlive * <buffer=' . a:buf . '>'
endfunction
function! s:MdStart()
    if !empty(get(b:, 'mdlive', {})) && job_status(b:mdlive.job) ==# 'run'
        echo 'Md: 이미 실행 중 ' . b:mdlive.url | return
    endif
    call mkdir(expand('~/.mdview/live'), 'p')
    let b:mdlive = {'file': expand('~/.mdview/live/') . getpid() . '_' . bufnr() . '.md', 'tick': -1, 'line': -1, 'url': ''}
    call s:MdPush(1)
    let b:mdlive.job = job_start(['python3', expand('~/.mdview/mdview.py'), 'serve',
        \ b:mdlive.file, expand('%:p:h'), expand('%:t')],
        \ {'out_cb': function('s:MdUrl', [b:mdlive]), 'err_io': 'null'})
    augroup mdlive
        autocmd! * <buffer>
        autocmd TextChanged,TextChangedI,CursorMoved,CursorMovedI <buffer> call s:MdPush(0)
        autocmd BufUnload <buffer> call s:MdStop(str2nr(expand('<abuf>')))
    augroup END
endfunction
command! Md call s:MdStart()
command! MdStop call s:MdStop(bufnr())
" 소문자 :md / :mdstop 도 동작 → 아래 s:CmdLower() 가 Enter 때 :Md / :MdStop 으로 바꿔줌
" (vim 사용자 명령은 대문자로 시작해야 하고, <CR> 매핑이 abbreviation 을 막아서 여기서 처리)
```
> - 소문자 `:md` / `:mdstop` 은 19단계의 `s:CmdLower()`(`<CR>` 매핑)가 `:Md` / `:MdStop` 으로 바꿔서 동작한다. 19단계까지 적용해야 소문자로 쳐진다 (그 전에는 `:Md` / `:MdStop`).
> - **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열도록 안내한다.
> - 브라우저 창을 Windows에서 터미널 옆에 놓고 쓰면 된다 (`Win+←` / `Win+→`로 화면 반씩).

검증 (별도 tmux 서버 + 가짜 `cmd.exe`로 브라우저를 띄우지 않고 확인):
```bash
SP=<스크래치패드>; mkdir -p $SP/fakebin; rm -f $SP/open.log
printf '#!/bin/sh\necho "$@" >> %s/open.log\n' $SP > $SP/fakebin/cmd.exe; chmod +x $SP/fakebin/cmd.exe
printf '# 테스트\n\n첫 문단\n' > $SP/test.md
T="tmux -L mdtest"
$T new-session -d -s m -x 120 -y 30 "env PATH=\"$SP/fakebin:\$PATH\" vim $SP/test.md"; sleep 1.5
$T send-keys -t m ':md' Enter; sleep 1.5
URL=$(awk '{print $NF}' $SP/open.log | tail -1); echo "$URL"          # → http://localhost:<포트>/
(timeout 4 curl -sN "${URL}events" > $SP/ev.txt &); sleep 1
$T send-keys -t m G o '## 실시간 제목'; sleep 1; $T send-keys -t m Escape gg; sleep 2
grep -c '실시간 제목' $SP/ev.txt                                        # → 1 이상 (저장 안 했는데 전달됨)
$T send-keys -t m ':q!' Enter; sleep 1; curl -s -m 2 "$URL" >/dev/null || echo "서버 종료 OK"
$T kill-server
```
Windows 브라우저가 WSL 서버에 닿는지: 서버 실행 중 `powershell.exe -c "(Invoke-WebRequest -UseBasicParsing '<URL>').StatusCode"` → `200`.

---

## 18단계. `iv`: 면접 포트폴리오 토론 전용 Claude 세션

저장소 최상위 `interview/` 폴더(`inter_view.md` + 토론 규칙 `CLAUDE.md`)에서만 Claude를 실행해서 토론 세션을 하나로 유지한다.
`claude -c`는 **현재 폴더**의 마지막 대화를 이어 열기 때문에, 전용 폴더에서 실행하면 다른 작업 세션과 섞이지 않는다.

사전 확인: `type -t iv` → 출력이 없어야 한다. 저장소 최상위 `interview/` 폴더가 있어야 한다 (저장소에 포함).
경로는 PC마다 다를 수 있으니, 다른 PC에서는 `D`를 실제 경로로 바꾼다.

`~/.bashrc` 맨 아래에 없으면 추가:
```bash
# iv : 면접 포트폴리오 토론 전용 Claude 세션 (System_Verilog/interview 폴더)
#   처음이면 'interview' 이름으로 새 세션, 이후로는 그 폴더의 마지막 대화를 이어서 열기
iv() {
    local D=/mnt/c/26_AI_CAMP/System_Verilog/interview
    local S="$HOME/.claude/projects/$(echo "$D" | sed 's#[/_]#-#g')"
    cd "$D" || return
    if ls "$S"/*.jsonl >/dev/null 2>&1; then
        claude -c --add-dir .. "$@"
    else
        claude -n interview --add-dir .. "$@"
    fi
}
```
- `--add-dir ..`: 상위 저장소 전체(`homework/homework_verilog/`의 숙제 PDF · `homework.md` 등)를 권한 확인 없이 읽기 위함
- 폴더를 옮기면 세션 기록 폴더 이름도 바뀌어 `claude -c`가 이전 대화를 못 찾음 → 이전 기록 폴더의 `*.jsonl`을 새 경로 이름의 기록 폴더로 복사 (2026-11-03 `verilog/homework/interview` → `interview` 이동 시 수행)
- Claude Code는 세션 기록을 `~/.claude/projects/<경로의 / 와 _ 를 - 로 바꾼 이름>/`에 저장 → 그 폴더에 기록이 있으면 이어 열기

검증:
```bash
bash -ic 'type -t iv'
# → function
```
적용: `source ~/.bashrc`

---

## 19단계. vim 대문자 `:` 명령을 소문자처럼 (`:W` `:WQ` `:Q!` …)

Caps Lock이 켜진 채로 `:W`, `:WQ`, `:Q!`를 치면 `E492: Not an editor command`가 나서 불편하다는 요청 (2026-10-10).
→ `:` 명령줄에서 Enter를 누를 때 **명령 이름만** 소문자로 바꿔서 실행한다.
- 터미널 vim은 Caps Lock으로 친 `J`와 Shift+`j`를 구분할 수 없다. 그래서 **normal 모드 키는 건드리지 않는다** (Shift+글자 기능 `A` `O` `G` `J` … 그대로). 사용자가 명령줄만 바꾸기로 선택했다.
- 바뀌는 것: 명령 이름 (`:W` → `:w`, `:WQ` → `:wq`, `:Q!` → `:q!`, `:1,2S/…` → `:1,2s/…`, `:'<,'>S/…`도 됨). `:set` 계열(`:SET NU`)은 옵션 이름도 소문자로.
- 그대로인 것: 명령 뒤 인자 (`:%S/CLEAR/STOP/`의 `CLEAR`/`STOP` 대소문자 유지), 정확히 있는 대문자 명령(`:Md`, `:X`), 없는 명령(`:FOO` → 여전히 E492), `/` `?` 검색.
- `exists(':S')`가 1인 이유: netrw의 `:Sexplore` 같은 사용자 명령의 앞부분이라서. 그래서 **2(정확히 일치)일 때만** 실제 대문자 명령으로 보고 그대로 둔다.
- `setcmdline()` 필요 (vim 9.0.1238 이상, 이 PC의 vim 9.1 패치 1-16에 있음): `vim -Nu NONE -es -c 'echo exists("*setcmdline")'`

`~/.vimrc` 맨 아래에 추가:
```vim
" ==========================================
"  대문자 명령 → 소문자 명령 (:W :WQ :Q! :X :SET NU ...)
" ==========================================
" Caps Lock 이 켜진 채로 : 명령을 쳐도 소문자 명령처럼 실행 (E492 방지)
"  - 명령 이름만 소문자로 바꿈 (:%S/CLEAR/STOP/ 처럼 뒤의 인자 대소문자는 그대로)
"  - :set 계열은 옵션 이름도 소문자로 (:SET NU → :set nu)
"  - :Md 처럼 실제로 있는 대문자 사용자 명령은 그대로
"  - normal 모드 키(J, K, A, O ...)는 건드리지 않음
function! s:CmdLower()
    if getcmdtype() !=# ':' | return | endif
    let l:m = matchlist(getcmdline(), '^\([[:space:]:]*[0-9.,$%;''<>+-]*\)\(\a\+\)\(.*\)$')
    if empty(l:m) | return | endif
    " :md / :mdstop / :glow (대소문자 무관, 인자 없을 때) → :Md / :MdStop / :Glow
    let l:alias = {'md': 'Md', 'mdstop': 'MdStop', 'glow': 'Glow'}
    if has_key(l:alias, tolower(l:m[2])) && l:m[3] =~# '^[[:space:]]*$'
        call setcmdline(l:m[1] . l:alias[tolower(l:m[2])]) | return
    endif
    if l:m[2] !~# '\u' | return | endif
    let l:name = tolower(l:m[2])
    " 대문자 이름이 정확히 있는 명령(2)이면 그대로, 소문자 이름이 명령이 아니면 그대로
    if exists(':' . l:m[2]) == 2 || !exists(':' . l:name) | return | endif
    let l:rest = l:m[3]
    if l:name =~# '^\(se\|set\|setl\|setlocal\|setg\|setglobal\)$'
        let l:rest = tolower(l:rest)
    endif
    call setcmdline(l:m[1] . l:name . l:rest)
endfunction
cnoremap <CR> <Cmd>call <SID>CmdLower()<CR><CR>
```
> - 명령줄 `<CR>`을 매핑하지만 `<Cmd>`로 줄만 고친 뒤 원래 `<CR>`을 실행하므로 Enter 동작 자체는 같다.
> - **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열도록 안내한다.

검증 (별도 tmux 서버에서 실제 키 입력):
```bash
SP=<스크래치패드>; printf 'AA aa\nAA zz\nline3\n' > $SP/t.txt
T="tmux -L capsfull"
$T new-session -d -s c -x 200 -y 30 "vim $SP/t.txt; echo VIMEXIT; sleep 5"; sleep 1.2
k(){ $T send-keys -t c "$@"; sleep 0.6; }
k ':SET NU' Enter; k ':1,2S/AA/BB/' Enter; k ':MdStop' Enter
k ':call writefile(["nu=".&nu, "err=".v:errmsg], "'$SP'/out.txt")' Enter
k ':W' Enter; cat $SP/out.txt $SP/t.txt     # → nu=1, err= (빈칸), 파일 1·2줄이 BB 로 저장됨
k ':WQ' Enter; sleep 0.5; $T capture-pane -p -t c | grep -q VIMEXIT && echo ":WQ 로 종료 OK"
$T kill-server
```

---

## 20단계. tmux: 화살표만 눌러서 창이 바뀌는 것 끄기 (`Ctrl+b` + 화살표는 유지)

화살표만 눌렀는데 tmux 창이 바뀌는 문제 (2026-10-13).
- 원인: tmux 기본 키 `Ctrl+b` + `←↑↓→`는 `-r`(반복) 옵션이 붙어 있다. `Ctrl+b ←`를 누르고 나서 `repeat-time`(0.5초) 동안은 `Ctrl+b` 없이 **화살표만 눌러도** 창이 계속 바뀐다. 그래서 창을 옮긴 직후 셸 기록(↑)이나 vim 커서를 움직이면 창이 다시 바뀐다.
- 해결: 같은 키를 `-r` 없이 다시 지정한다. `Ctrl+b` + 화살표는 **한 번 누르면 한 번만** 이동하고, 그다음 화살표는 창 안의 프로그램(셸, vim)으로 간다.
- 그대로인 것: `Ctrl+h/j/k/l`, 마우스 클릭, 창 크기 조절(`Ctrl+b` 다음 `Ctrl+화살표`/`Alt+화살표`), 복사 모드 안의 화살표.

사전 확인: `tmux list-keys -T prefix | grep -E ' (Up|Down|Left|Right) '` → 줄 앞에 `-r`이 있으면 적용 전이다.

`~/.tmux.conf` 백업(`cp ~/.tmux.conf ~/.tmux.conf.bak_arrow`) 후, `set -sg escape-time 10` 줄 아래에 추가:
```bash
# Ctrl+b 다음 화살표(←↑↓→) 창 이동: 한 번 누를 때 한 번만 이동
#  기본 키는 -r(반복)이라 Ctrl+b ← 후 0.5초 동안 화살표만 눌러도 창이 계속 바뀜 → -r 없이 다시 지정
bind-key Up    select-pane -U
bind-key Down  select-pane -D
bind-key Left  select-pane -L
bind-key Right select-pane -R
```
적용: `tmux source-file ~/.tmux.conf`

검증 (별도 tmux 서버에 클라이언트를 붙여서 실제 키 입력, `send-keys -K`는 tmux 3.4 이상):
```bash
T="tmux -L arrowtest -f $HOME/.tmux.conf"
$T new-session -d -s a -x 120 -y 30; $T split-window -h -t a; $T select-pane -t a:0.1
(script -qfc "tmux -L arrowtest attach -t a" /dev/null >/dev/null 2>&1 &); sleep 1
C=$($T list-clients -F '#{client_name}' | head -1); p(){ $T display -p -t a '#{pane_index}'; }
$T send-keys -K -c "$C" C-b Left; sleep 0.2; echo "C-b Left: $(p)"     # → 0 (이동함)
$T send-keys -K -c "$C" Right;     sleep 0.2; echo "Right: $(p)"        # → 0 (화살표만으로는 안 바뀜)
$T send-keys -K -c "$C" C-b Right; sleep 0.2; echo "C-b Right: $(p)"    # → 1
$T kill-server
```

---

## 21단계. tmux: Caps Lock 켜진 채 `Ctrl+B P` / `Ctrl+B W`도 소문자처럼

Caps Lock이 켜진 채로 `Ctrl+b p`(이전 window), `Ctrl+b w`(window 목록)를 누르면 대문자 `P`/`W`가 가서 아무 일도 안 일어나는 문제 (2026-10-13).
- prefix도 대문자로 와도 되게 `prefix2`를 `C-B`로 지정한다 (`prefix`는 `C-b` 그대로). `Ctrl+b`/`Ctrl+B` 어느 쪽으로 눌러도 prefix가 된다.
- tmux 3.6 기본 설정에서 prefix 다음 `P`, `W`는 비어 있다 (사전 확인으로 확인). 그래서 소문자와 같은 명령을 그대로 붙이면 다른 기능과 겹치지 않는다.
- 뒤 글자는 요청한 `p`, `w` 두 키만 추가한다. 다른 글자(`c`, `n`, `d` …)는 그대로.

사전 확인: `tmux show -g prefix2` → `None`이어야 하고, `tmux list-keys -T prefix | grep -E ' (P|W) +'` → 출력이 없어야 한다 (비어 있음). 이미 `C-B` / `previous-window` / `choose-tree -Zw`가 나오면 적용된 것.

`~/.tmux.conf` 백업(`cp ~/.tmux.conf ~/.tmux.conf.bak_caps`) 후, 20단계의 `bind-key Right select-pane -R` 줄 아래에 추가:
```bash
# Caps Lock 켜진 채 Ctrl+B / Ctrl+b P / W 도 소문자처럼 (prefix2: Ctrl+B, p: 이전 window, w: window 목록)
set -g prefix2 C-B
bind-key P previous-window
bind-key W choose-tree -Zw
```
적용: `tmux source-file ~/.tmux.conf`

검증 (별도 tmux 서버에 클라이언트를 붙여서 실제 키 입력):
```bash
T="tmux -L capstest -f $HOME/.tmux.conf"
$T new-session -d -s a -x 120 -y 30; $T new-window -t a; $T new-window -t a
(script -qfc "tmux -L capstest attach -t a" /dev/null >/dev/null 2>&1 &); sleep 1
C=$($T list-clients -F '#{client_name}' | head -1)
for k in "C-b p" "C-B P" "C-b P" "C-B p"; do
    $T select-window -t a:2; $T send-keys -K -c "$C" $k; sleep 0.3
    echo "$k → $($T display -p -t a '#{window_index}')"                          # → 모두 1 (2에서 이전으로)
done
$T send-keys -K -c "$C" C-B W; sleep 0.5; $T display -p -t a '#{pane_mode}'      # → tree-mode
$T kill-server
```

---

## 22단계. vim 줄번호 색 (회보라 + 커서 줄만 주황, 모든 테마에서 유지)

테마(Catppuccin Mocha)의 기본 줄번호 색(`#45475a`)이 배경과 거의 구분이 안 될 만큼 어두워서 바꾼다 (2026-10-13).
- 일반 줄번호: Overlay1 `#7f849c` (회보라). 커서가 있는 줄 번호: Peach `#fab387` (주황, 굵게).
- `cursorline`이 꺼져 있으면 `CursorLineNr` 색이 화면에 안 보인다. `cursorlineopt=number`로 켜면 줄 전체가 아니라 **번호만** 강조된다.
- `theme` 명령이 colorscheme을 바꿀 때마다 색이 덮어써지므로, `ColorScheme` 이벤트에서 다시 칠한다 → 8개 테마 모두 같은 색.

`~/.vimrc` 백업(`cp ~/.vimrc ~/.vimrc.bak_linenr`) 후, "테마" 섹션의 `if filereadable(expand('~/.vim/theme.vim'))` **바로 위**에 추가 (colorscheme을 읽기 전에 autocmd가 먼저 등록돼야 함):
```vim
" 줄번호 색: 어떤 테마든 colorscheme 적용 뒤에 다시 칠함 (회보라 #7f849c, 커서 줄 번호만 주황 #fab387)
set cursorline cursorlineopt=number   " 줄 전체가 아니라 커서 줄 번호만 강조
augroup linenr_color
    autocmd!
    autocmd ColorScheme * highlight LineNr       guifg=#7f849c ctermfg=103 guibg=NONE ctermbg=NONE
                      \ | highlight CursorLineNr guifg=#fab387 ctermfg=216 guibg=NONE ctermbg=NONE gui=bold cterm=bold
augroup END
```
> **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열거나 `:source ~/.vimrc` 후 `:colorscheme <현재 테마>`를 실행한다.

검증 (8개 테마 모두 같은 색이 나와야 함):
```bash
for t in catppuccin_mocha onedark gruvbox nord dracula everforest rosepine tokyonight; do
  vim -Nu ~/.vimrc -es +"colorscheme $t" +'redir! > /dev/stdout | hi LineNr | hi CursorLineNr | redir END' +q | grep -o 'guifg=#[0-9a-f]*' | tr '\n' ' '; echo
done   # → 줄마다 guifg=#7f849c guifg=#fab387
```

---

## 23단계. vim에서 md 그대로 보기 좋게 (플러그인 없이)

vim 내장 markdown 문법만 써서, md를 편집 화면 그대로 읽기 좋게 만든다 (2026-10-22).
- `conceallevel=2`: `**굵게**` `` `코드` `` `[링크](url)`의 기호·url을 숨긴다. **커서가 있는 줄은 원래대로** 보여서 편집에는 지장 없다 (`concealcursor=` 비움).
- 제목 `#`~`######`는 단계별 색(빨강→주황→노랑→초록→파랑→보라, 굵게), `#` 기호는 흐리게.
- ```` ```verilog ```` 등 코드 블록 안을 해당 언어 색으로 칠한다 (`g:markdown_fenced_languages`).
- 표: 내장 문법에는 표 규칙이 없어서 `~/.vim/after/syntax/markdown.vim`에 추가 (`|`와 `---` 줄 흐리게, 머리줄 굵게).
- 색은 22단계처럼 `ColorScheme` 이벤트에서 다시 칠한다 → `theme`로 바꿔도 유지.

`~/.vimrc` 백업(`cp ~/.vimrc ~/.vimrc.bak_mdview`) 후 맨 아래에 추가:
```vim
" ==========================================
"  md 파일을 vim 안에서 보기 좋게 (플러그인 없이 vim 내장 markdown 문법 사용)
" ==========================================
" ```verilog 같은 코드 블록 안도 해당 언어 색으로 칠함
let g:markdown_fenced_languages = ['verilog', 'systemverilog', 'python', 'bash=sh', 'sh', 'c', 'cpp', 'tcl', 'vim']
" conceallevel=2 : **굵게** `코드` [링크](url) 의 기호를 숨김 (커서가 있는 줄은 원래대로 보임)
" wrap + linebreak : 긴 문장을 단어 단위로 줄바꿈, breakindent : 목록 들여쓰기 유지
augroup md_view
    autocmd!
    autocmd FileType markdown setlocal conceallevel=2 concealcursor= wrap linebreak breakindent
augroup END
" 제목 단계별 색 (catppuccin 팔레트) + 굵게/기울임/코드/표 색 : 어떤 테마든 colorscheme 뒤에 다시 칠함
function! s:MdColors()
    highlight markdownH1 guifg=#f38ba8 gui=bold ctermfg=211 cterm=bold
    highlight markdownH2 guifg=#fab387 gui=bold ctermfg=216 cterm=bold
    highlight markdownH3 guifg=#f9e2af gui=bold ctermfg=223 cterm=bold
    highlight markdownH4 guifg=#a6e3a1 gui=bold ctermfg=150 cterm=bold
    highlight markdownH5 guifg=#89b4fa gui=bold ctermfg=111 cterm=bold
    highlight markdownH6 guifg=#cba6f7 gui=bold ctermfg=183 cterm=bold
    highlight markdownHeadingDelimiter guifg=#6c7086 ctermfg=242
    highlight markdownBold       guifg=#f5c2e7 gui=bold ctermfg=218 cterm=bold
    highlight markdownItalic     guifg=#94e2d5 gui=italic ctermfg=116 cterm=italic
    highlight markdownCode       guifg=#f5e0dc guibg=#313244 ctermfg=224 ctermbg=236
    highlight markdownCodeBlock  guifg=#a6e3a1 ctermfg=150
    highlight markdownListMarker guifg=#fab387 gui=bold ctermfg=216 cterm=bold
    highlight markdownOrderedListMarker guifg=#fab387 gui=bold ctermfg=216 cterm=bold
    highlight markdownBlockquote guifg=#7f849c gui=italic ctermfg=103 cterm=italic
    highlight markdownLinkText   guifg=#89b4fa gui=underline ctermfg=111 cterm=underline
    highlight markdownRule       guifg=#6c7086 ctermfg=242
    highlight mdTablePipe        guifg=#6c7086 ctermfg=242
    highlight mdTableSep         guifg=#6c7086 ctermfg=242
    highlight mdTableHead        guifg=#89dceb gui=bold ctermfg=117 cterm=bold
endfunction
augroup md_colors
    autocmd!
    autocmd ColorScheme * call s:MdColors()
augroup END
call s:MdColors()
```

`~/.vim/after/syntax/markdown.vim` 새로 만들기 (`mkdir -p ~/.vim/after/syntax`):
```vim
" 내장 markdown 문법에 표(|) 색 추가 : ~/.vimrc 의 s:MdColors() 에서 색 지정
" 표 구분 줄 |---|:---:|  → 흐리게
syntax match mdTableSep  /^\s*|\?\s*:\?-\{3,}:\?\s*\(|\s*:\?-\{3,}:\?\s*\)*|\?\s*$/
" 표 칸 구분 |  → 흐리게 (코드 블록 안은 제외)
syntax match mdTablePipe /|/ containedin=ALLBUT,markdownCode,markdownCodeBlock,mdTableSep
" 표 머리줄 (바로 다음 줄이 구분 줄인 | 줄) → 굵게
syntax match mdTableHead /^\s*|.*|\s*\ze\n\s*|\?\s*:\?-\{3,}/ contains=mdTablePipe
```
> - 기호를 전부 보면서 편집하고 싶을 때는 `:set conceallevel=0`, 다시 숨기기 `:set conceallevel=2`.
> - **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열도록 안내한다.

검증:
```bash
printf '# 제목\n\n| a | b |\n|---|---|\n| 1 | 2 |\n' > /tmp/t.md
vim -Nu ~/.vimrc -es +'e /tmp/t.md' +'redir! > /dev/stdout | echo &conceallevel &ft | hi markdownH1 | hi mdTablePipe | redir END' +'qa!'; rm /tmp/t.md
# → "2 markdown", markdownH1 guifg=#f38ba8, mdTablePipe guifg=#6c7086
```

---

## 24단계. glow: vim `:glow`로 md 렌더링 화면 보기

[glow](https://github.com/charmbracelet/glow)는 md를 터미널에서 렌더링하는 뷰어다 (표 정렬, 제목·코드 색). vim 안에서 `:glow`를 치면 **지금 창이 그 자리에서** 렌더링 화면으로 바뀌고, `q`(또는 `:glow` 한 번 더)를 누르면 원래 편집 화면(커서·스크롤 위치 그대로)으로 돌아온다 (2026-10-22 추가, 2026-11-20 방식 변경).
- 창 분할·새 탭 없이 지금 창의 버퍼만 렌더링 결과로 바꾼다 (`hide buffer` → 저장 안 한 md도 그대로 유지). 편집 커서가 있던 위치 근처부터 보여준다.
- 저장 안 한 버퍼 내용을 임시 파일에 써서 화면 밖(hidden) 터미널에서 glow를 돌린 뒤 결과를 띄운다 (원본 md 안 건드림). 읽기는 vim 키 그대로: `j`/`k`, `Ctrl-d`/`Ctrl-u`, `gg`/`G`, `/검색`.
- 색 테마: 기본 **vim** = 지금 vim 화면 색(제목 H1~H6·굵게·기울임·코드·인용·링크 + ```` ``` ```` SV 코드 블록 색)을 렌더링할 때마다 읽어서 glow 테마 json을 새로 만든다 → `theme`로 vim 테마를 바꾸면 따라 바뀐다.
- `:glow 이름`으로 바꿔볼 수 있다 (`Tab` 자동완성: vim, catppuccin, dracula, tokyo-night, pink, dark, light). 고른 테마는 vim이 켜져 있는 동안 유지된다. `catppuccin`은 고정 색 사용자 테마 파일(`~/.config/glow/catppuccin.json`).
- 바뀐 과정: 10-22 새 탭 + `glow -p`(less) → 11-19 오른쪽 창 실시간 미리보기(0.4초마다 다시 렌더링, 커서 따라 스크롤) → **11-20 지금 창에서 렌더링** (현재 방식). 예전 방식의 코드는 쓰지 않는다.

### 24-1. glow 설치 (sudo 없이 `~/.local/bin`에)
`apt install glow`도 되지만 sudo가 필요해서, GitHub 릴리스 바이너리를 받는다:
```bash
D=$(mktemp -d) && cd $D
URL=$(curl -s https://api.github.com/repos/charmbracelet/glow/releases/latest | grep -o 'https://[^"]*Linux_x86_64.tar.gz' | head -1)
curl -sL "$URL" -o glow.tgz && tar xzf glow.tgz
mkdir -p ~/.local/bin && install -m 755 $(find . -name glow -type f) ~/.local/bin/glow
cd ~ && rm -rf $D
glow --version   # → glow version 3.x
```
> `~/.local/bin`이 `PATH`에 있어야 한다 (`echo $PATH | tr : '\n' | grep local/bin`). Ubuntu는 기본 `~/.profile`이 폴더가 있으면 넣어 준다 → 없었으면 터미널을 새로 연다.

### 24-2. catppuccin 테마 파일 복사
이 문서 폴더의 `glow-catppuccin.json`을 복사:
```bash
mkdir -p ~/.config/glow && cp <이 문서 폴더>/glow-catppuccin.json ~/.config/glow/catppuccin.json
```

### 24-3. `~/.vimrc` 맨 아래에 추가
백업(`cp ~/.vimrc ~/.vimrc.bak_glow`) 후 23단계 아래에 추가 (예전 `:Glow` 섹션이 이미 있으면 `"  :Glow :` 주석 ~ `command! ... Glow` 줄까지 통째로 이 코드로 교체):
```vim
" ==========================================
"  :Glow : 편집 중인 md 를 지금 창에서 렌더링해서 읽기 (터미널용 md 뷰어 glow)
" ==========================================
" 창 분할 없이 지금 창이 렌더링 화면으로 바뀜. 저장 안 한 내용도 보이고, 편집 커서 위치 근처부터 보여줌
" 읽기: j/k · Ctrl-d/u · gg/G · / 검색
" 돌아가기: q 또는 :Glow 한 번 더 → 원래 편집 화면 (커서·스크롤 위치 그대로)
" 색 테마: 기본 vim, :Glow <이름> 으로 바꾸기 (Tab 자동완성, vim 켜져 있는 동안 유지)
"   vim        = 지금 vim 화면 색 그대로 (제목 H1~H6·굵게·기울임·코드·인용·링크 색 + SV 코드 블록 색)
"                렌더링할 때마다 vim 의 highlight 를 읽어서 glow 테마(json)를 새로 만듦 → vim 테마를 바꾸면 따라 바뀜
"   catppuccin = catppuccin mocha 고정 색 (~/.config/glow/catppuccin.json)
let s:glow_styles = {'vim': '', 'catppuccin': expand('~/.config/glow/catppuccin.json'),
    \ 'dracula': 'dracula', 'tokyo-night': 'tokyo-night', 'pink': 'pink', 'dark': 'dark', 'light': 'light'}
let g:glow_style = get(g:, 'glow_style', 'vim')
let s:glow_vim_json = tempname() . '-glow-vim.json'
" vim highlight 그룹의 실제 색 (#rrggbb). 없으면 기본값
function! s:GlowHl(group, attr, default)
    let l:c = synIDattr(synIDtrans(hlID(a:group)), a:attr . '#')
    return l:c =~# '^#\x\{6}$' ? l:c : a:default
endfunction
" 지금 vim 색으로 glow 테마 json 만들기
function! s:GlowVimStyle()
    let l:fg  = s:GlowHl('Normal', 'fg', '#cdd6f4')
    let l:dim = s:GlowHl('markdownRule', 'fg', '#6c7086')
    let l:st = {
        \ 'document':    {'block_prefix': "\n", 'block_suffix': "\n", 'color': l:fg, 'margin': 2},
        \ 'paragraph': {}, 'text': {}, 'list': {'level_indent': 2},
        \ 'heading':     {'block_suffix': "\n", 'bold': v:true},
        \ 'block_quote': {'indent': 1, 'indent_token': '▎ ', 'italic': v:true,
        \                 'color': s:GlowHl('markdownBlockquote', 'fg', l:dim)},
        \ 'strong':      {'bold': v:true, 'color': s:GlowHl('markdownBold', 'fg', l:fg)},
        \ 'emph':        {'italic': v:true, 'color': s:GlowHl('markdownItalic', 'fg', l:fg)},
        \ 'strikethrough': {'crossed_out': v:true, 'color': l:dim},
        \ 'hr':          {'color': l:dim, 'format': "\n────────────────────────────────────────\n"},
        \ 'item':        {'block_prefix': '• '},
        \ 'enumeration': {'block_prefix': '. ', 'color': s:GlowHl('markdownListMarker', 'fg', l:fg)},
        \ 'task':        {'ticked': '[✓] ', 'unticked': '[ ] '},
        \ 'link':        {'color': s:GlowHl('markdownLinkText', 'fg', l:fg), 'underline': v:true},
        \ 'link_text':   {'color': s:GlowHl('markdownLinkText', 'fg', l:fg), 'bold': v:true},
        \ 'image':       {'color': s:GlowHl('markdownLinkText', 'fg', l:fg), 'underline': v:true},
        \ 'image_text':  {'color': l:dim, 'format': 'Image: {{.text}} →'},
        \ 'code':        {'prefix': ' ', 'suffix': ' ', 'color': s:GlowHl('markdownCode', 'fg', l:fg),
        \                 'background_color': s:GlowHl('markdownCode', 'bg', '#313244')},
        \ 'table':       {'color': l:fg},
        \ 'definition_list': {}, 'definition_term': {}, 'definition_description': {'block_prefix': "\n🠶 "},
        \ 'html_block': {}, 'html_span': {}}
    " 제목: vim 처럼 # 개수 + 단계별 색
    for l:i in range(1, 6)
        let l:st['h' . l:i] = {'prefix': repeat('#', l:i) . ' ', 'bold': v:true,
            \ 'color': s:GlowHl('markdownH' . l:i, 'fg', l:fg)}
    endfor
    " ``` 코드 블록: vim 의 SV 역할별 색에 최대한 맞춤 (glow 는 키워드를 역할별로 못 나눠서 대표 색만)
    let l:C = {g -> {'color': s:GlowHl(g, 'fg', l:fg)}}
    let l:st.code_block = {'color': l:fg, 'margin': 2, 'chroma': {
        \ 'text': {'color': l:fg}, 'name': {'color': l:fg}, 'punctuation': {'color': l:fg},
        \ 'operator': l:C('Operator'),
        \ 'comment': l:C('Comment'), 'comment_preproc': l:C('PreProc'),
        \ 'keyword': l:C('vlogBlock'), 'keyword_reserved': l:C('vlogBlock'),
        \ 'keyword_namespace': l:C('vlogBlock'), 'keyword_type': l:C('vlogType'),
        \ 'name_function': l:C('vlogMethod'), 'name_class': l:C('vlogClassName'),
        \ 'name_builtin': l:C('Special'), 'name_constant': l:C('Constant'),
        \ 'literal_number': l:C('Number'), 'literal_string': l:C('String'),
        \ 'literal_string_escape': l:C('Special')}}
    call writefile([json_encode(l:st)], s:glow_vim_json)
    return s:glow_vim_json
endfunction
" glow -s 에 넘길 값 (vim 이면 그때그때 json 생성)
function! s:GlowStyleArg()
    return g:glow_style ==# 'vim' ? s:GlowVimStyle() : s:glow_styles[g:glow_style]
endfunction
" 렌더링 중일 때: src 편집 버퍼, win 창, view 편집 화면 위치, tmp 임시 파일, buf 렌더링 터미널 버퍼
let s:glow = {}
function! s:GlowComplete(lead, line, pos)
    return filter(sort(keys(s:glow_styles)), 'v:val =~# "^" . a:lead')
endfunction
function! s:Glow(...)
    let l:theme = a:0 && !empty(a:1)
    if l:theme
        if !has_key(s:glow_styles, a:1)
            echo 'Glow: 없는 테마 ' . a:1 . ' (' . join(sort(keys(s:glow_styles)), ', ') . ')' | return
        endif
        let g:glow_style = a:1
    endif
    " 렌더링 화면에서 :Glow → 편집 화면으로 (테마를 주면 그 테마로 다시 렌더링)
    if exists('b:glow_src')
        call s:GlowBack()
        if !l:theme | return | endif
    endif
    if !executable('glow')
        echo 'Glow: glow 가 없음 (~/.local/bin/glow)' | return
    endif
    if !empty(s:glow) | return | endif
    let l:w = winwidth(0)
    let s:glow = {'src': bufnr(), 'win': win_getid(), 'view': winsaveview(),
        \ 'tmp': tempname() . '.md', 'ratio': line('.') * 1.0 / line('$')}
    call writefile(getline(1, '$'), s:glow.tmp)
    " 화면 밖(hidden) 터미널에서 glow 실행 → 끝나면 s:GlowShow 가 지금 창에 띄움
    let s:glow.buf = term_start(['glow', '-s', s:GlowStyleArg(), '-w', string(l:w - 2), s:glow.tmp],
        \ {'hidden': 1, 'norestore': 1, 'term_name': 'Glow',
        \  'term_cols': l:w, 'term_rows': max([winheight(0), 5]),
        \  'exit_cb': {j, st -> timer_start(30, {-> s:GlowShow()})}})
endfunction
function! s:GlowShow()
    if empty(s:glow) | return | endif
    let l:g = s:glow
    let s:glow = {}
    call delete(l:g.tmp)
    if !bufexists(l:g.buf) | return | endif
    call setbufvar(l:g.buf, '&bufhidden', 'wipe')
    " 렌더링하는 사이에 창을 닫았거나 다른 파일로 옮겼으면 취소
    if win_id2win(l:g.win) == 0 || winbufnr(l:g.win) != l:g.src
        execute 'silent! bwipeout!' l:g.buf | return
    endif
    call setbufvar(l:g.buf, 'glow_src', l:g.src)
    call setbufvar(l:g.buf, 'glow_view', l:g.view)
    let l:n = getbufinfo(l:g.buf)[0].linecount
    let l:top = min([max([float2nr(l:g.ratio * l:n) - 3, 1]), l:n])
    call win_gotoid(l:g.win)
    " hide : 저장 안 한 md 도 버퍼를 숨긴 채로 화면만 바꿈
    execute 'hide buffer' l:g.buf
    setlocal nonumber norelativenumber signcolumn=no nolist
    nnoremap <buffer><silent><nowait> q <Cmd>call <SID>GlowBack()<CR>
    call winrestview({'lnum': l:top, 'topline': l:top})
    echo 'Glow · ' . g:glow_style . '  (q 또는 :Glow 로 돌아가기)'
endfunction
" 렌더링 화면 → 원래 편집 화면 (렌더링 버퍼는 자동으로 지워짐)
function! s:GlowBack()
    if !exists('b:glow_src') | return | endif
    let [l:src, l:view] = [b:glow_src, b:glow_view]
    if !bufexists(l:src)
        echo 'Glow: 원래 버퍼가 없음' | return
    endif
    execute 'buffer' l:src
    call winrestview(l:view)
endfunction
command! -nargs=? -complete=customlist,s:GlowComplete Glow call s:Glow(<q-args>)
```
> - 소문자 `:glow`는 19단계 `s:CmdLower()`의 `l:alias`에 `'glow': 'Glow'`가 있어야 동작한다 (19단계 코드에 포함됨). `:glow dracula`처럼 인자가 있으면 `:Glow dracula`로 친다.
> - glow는 한 줄에 `~`가 두 번 있으면(`1215~1462줄과 1465~1712줄`) 그 사이를 취소선으로 처리해서 `~`가 사라진다. 그런 곳은 `-`나 `–`를 쓴다.
> - **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열도록 안내한다.

검증 (별도 tmux 서버에서 실제 화면 확인):
```bash
SP=<스크래치패드>; printf '# 테스트 제목\n\n| a | b |\n|---|---|\n| 1 | 2 |\n' > $SP/t.md
T="tmux -L gt"
$T new-session -d -x 120 -y 20 "vim -n $SP/t.md"; sleep 2
$T send-keys ':glow' Enter; sleep 3; $T capture-pane -p | head -8      # → 줄번호 없이 렌더링된 제목·표만 보임
$T send-keys q; sleep 1
$T send-keys ':echo tabpagenr("$") winnr("$") &ft g:glow_style' Enter; sleep 1
$T capture-pane -p | tail -1                                            # → 1 1 markdown vim (창 분할 없이 원래 편집 화면 복귀)
$T send-keys ':qa!' Enter; sleep 1; $T kill-server 2>/dev/null
```

---

## 25단계. vim: Caps Lock / 한글 상태를 오른쪽 위에 `CAPS` / `한`으로 표시

Caps Lock이나 한글 입력이 켜진 줄 모르고 normal 모드 키를 눌러 엉뚱한 동작이 일어나는 걸 막기 위해, 켜져 있는 동안 vim 화면 오른쪽 위에 표시한다 (2026-10-30).
- 오른쪽 끝에 `CAPS`(주황 `#fab387`, 22단계 커서 줄 번호와 같은 색), 그 왼쪽에 `한`(파랑 `#89b4fa`). 둘 다 켜지면 ` 한  CAPS `. 색은 테마와 상관없이 유지.
- 터미널 vim은 키 상태를 알 수 없다 → vim이 켜질 때 Windows `powershell.exe`로 `~/.vim/keystate.ps1`을 job으로 띄운다. 이 스크립트가 0.2초마다 확인하고 **바뀔 때만** 숫자를 보낸다 (1: Caps Lock, 2: 한글, 3: 둘 다).
  - Caps Lock: `[console]::CapsLock`
  - 한글: 앞 창의 IME에 `WM_IME_CONTROL`/`IMC_GETCONVERSIONMODE`를 물어서 1번 비트 확인. **앞 창이 터미널(Windows Terminal 등)일 때만** 갱신한다. 브라우저·Discord 같은 Chromium 앱은 엉뚱한 값(예: `4027`)을 돌려주기 때문이다. 다른 창이 앞에 있으면 마지막 상태를 그대로 둔다.
- 표시는 popup 창(`+popupwin`, vim 8.2 이상)이고, 창 폭이 바뀌면 오른쪽 끝으로 다시 붙는다.
- vim 하나마다 powershell 하나가 뜬다 (메모리 약 50MB). vim을 닫으면 같이 꺼진다.

사전 확인: `vim --version | grep -o '+popupwin\|+job'` → 둘 다 나와야 함. `echo $WSL_DISTRO_NAME` → 비어 있으면 안 됨. `grep -c 'Caps Lock / 한글 표시\|Caps Lock 표시' ~/.vimrc` → `0` (이미 있으면 건너뜀. 옛 "Caps Lock 표시" 섹션만 있으면 그 섹션을 아래 내용으로 교체).

### 25-1. 감시 스크립트 복사
```bash
cp <저장소>/ubuntu-terminal-setup/keystate.ps1 ~/.vim/keystate.ps1
cd /mnt/c && timeout 3 powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(wslpath -w ~/.vim/keystate.ps1)"; cd -
# → 0 / 1 / 2 / 3 중 하나가 한 번 출력되고 3초 뒤 종료 (exit 124)
```

### 25-2. `~/.vimrc` 맨 아래에 추가
`~/.vimrc` 백업(`cp ~/.vimrc ~/.vimrc.bak_capsind`) 후:
```vim
" ==========================================
"  Caps Lock / 한글 표시 : 켜져 있으면 vim 오른쪽 위에 CAPS / 한 띄움
" ==========================================
" 터미널 vim 은 키 상태를 알 수 없어서 Windows powershell(~/.vim/keystate.ps1)이 0.2초마다 확인 → 바뀔 때만 숫자 출력
" (1: Caps Lock, 2: 한글, 3: 둘 다). 한/영은 앞 창이 터미널일 때만 갱신. vim 이 켜질 때 시작, vim 을 닫으면 같이 꺼짐
let s:key_popups = []
let s:key_state = 0
function! s:KeyShow()
    call map(s:key_popups, 'popup_close(v:val)')
    let s:key_popups = []
    let l:col = &columns
    " 오른쪽 끝부터: CAPS, 그 왼쪽에 한
    for [l:bit, l:text, l:hl] in [[1, ' CAPS ', 'CapsLockInd'], [2, ' 한 ', 'HangulInd']]
        if and(s:key_state, l:bit)
            call add(s:key_popups, popup_create(l:text, {'line': 1, 'col': l:col, 'pos': 'topright',
                \ 'highlight': l:hl, 'zindex': 300}))
            let l:col -= strdisplaywidth(l:text) + 1
        endif
    endfor
endfunction
function! s:KeyState(msg)
    let s:key_state = str2nr(trim(a:msg))
    call s:KeyShow()
endfunction
function! s:KeyStart()
    let l:ps1 = '\\wsl.localhost\' . $WSL_DISTRO_NAME . substitute(expand('~/.vim/keystate.ps1'), '/', '\\', 'g')
    let s:key_job = job_start(['powershell.exe', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', l:ps1],
        \ {'cwd': '/mnt/c', 'out_cb': {ch, msg -> s:KeyState(msg)}, 'err_io': 'null'})
endfunction
if has('popupwin') && executable('powershell.exe') && !empty($WSL_DISTRO_NAME) && filereadable(expand('~/.vim/keystate.ps1'))
    augroup key_ind
        autocmd!
        " 색: 어떤 테마든 CAPS 는 주황 바탕(#fab387, 커서 줄 번호와 같음), 한 은 파랑 바탕(#89b4fa)
        autocmd ColorScheme * highlight CapsLockInd guifg=#1e1e2e guibg=#fab387 ctermfg=234 ctermbg=216 gui=bold cterm=bold
                          \ | highlight HangulInd   guifg=#1e1e2e guibg=#89b4fa ctermfg=234 ctermbg=111 gui=bold cterm=bold
        autocmd VimEnter * call s:KeyStart()
        autocmd VimResized * if s:key_state | call s:KeyShow() | endif
        autocmd VimLeavePre * if exists('s:key_job') | call job_stop(s:key_job, 'kill') | endif
    augroup END
    highlight CapsLockInd guifg=#1e1e2e guibg=#fab387 ctermfg=234 ctermbg=216 gui=bold cterm=bold
    highlight HangulInd   guifg=#1e1e2e guibg=#89b4fa ctermfg=234 ctermbg=111 gui=bold cterm=bold
endif
```
> - **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열도록 안내한다.
> - WSL이 아니거나 `~/.vim/keystate.ps1`이 없으면 아무 일도 하지 않는다.

검증 (별도 tmux 서버, Caps Lock을 스크립트로 켰다가 다시 끔 → 원래 상태로 돌아옴):
```bash
SP=<스크래치패드>
cat > $SP/tog.ps1 <<'EOF'
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte b, byte s, uint f, UIntPtr e);' -Name K -Namespace W
[W.K]::keybd_event(0x14,0x45,1,[UIntPtr]::Zero); [W.K]::keybd_event(0x14,0x45,3,[UIntPtr]::Zero)
EOF
tog(){ (cd /mnt/c; powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(wslpath -w $SP/tog.ps1)"); }
kc(){ ps -eo args | grep -c '[k]eystate.ps1'; }
printf 'line1\n' > $SP/c.txt; T="tmux -L keyind"
$T new-session -d -s k -x 80 -y 10 "vim $SP/c.txt"; sleep 4
kc                                                                      # → 1 (감시 job 실행 중)
tog; sleep 1.2; $T capture-pane -p -t k | head -1                      # → 오른쪽 끝에 CAPS
$T resize-window -t k -x 60; sleep 0.7; $T capture-pane -p -t k | head -1   # → 폭 60 오른쪽 끝에 CAPS
tog; sleep 1.2; $T capture-pane -p -t k | head -1                      # → CAPS 없음
$T send-keys -t k ':q' Enter; sleep 2; $T kill-server 2>/dev/null
kc                                                                      # → 0 (vim 닫으면 감시 종료)
```
한글 표시는 앞 창이 터미널일 때만 바뀌어서 자동 검증이 어렵다 → 사용자에게 vim을 새로 열고 `한/영` 키와 Caps Lock을 눌러 보게 하고, 오른쪽 위 `한` / `CAPS`가 나타나고 사라지는지 확인받는다.

---

## 26단계. `xsv`: 터미널에서 Vivado xsim 시뮬레이션 실행

Vivado GUI를 열지 않고 Ubuntu(WSL) 터미널에서 SystemVerilog TB를 바로 돌린다 (2026-11-04).
- WSL에서 Windows Vivado의 `xvlog.bat` → `xelab.bat` → `xsim.bat`을 `cmd.exe`로 차례로 실행한다. 경고/오류 줄만 터미널에 보여 주고, 시뮬 출력(`$display`)은 그대로 출력한다.
- `xsv -g`는 파형 창(xsim GUI)을 띄운다. 창 Tcl 콘솔에 `rl`을 치면 같은 창에서 다시 컴파일하고 파형을 갱신한다 (신호 배치 유지).
- `xsv -s`는 Vivado 본체(`vivado.bat -mode gui`)를 프로젝트 없이 띄워 `read_verilog` → `synth_design -rtl` → `show_schematic`으로 RTL 회로도를 연다 (Vivado GUI의 RTL Analysis → Schematic과 같음). **합성 가능한 RTL만** 그릴 수 있고 class·`initial`이 있는 TB는 안 된다. Vivado가 뜨기까지 1분 정도 걸린다. 스크립트는 `xsim_build/xsv_schem.tcl`.
- 파형에는 **DUT 인스턴스 신호만** 자동으로 넣는다: top 바로 아래 인스턴스 중 이름에 `dut`가 들어간 것(대소문자 무관, `DUT`·`u_dut` 등). 여러 개면 인스턴스 이름 구분선을 넣는다 (2026-11-07 수정). DUT 인스턴스가 없으면 top 신호와 바로 아래 scope(interface 인스턴스 등)의 신호를 구분선과 함께 넣는다. class 기반 TB는 top에 class 핸들만 있어서 top만 넣으면 파형이 비어 보이기 때문이다 (2026-11-04). 전체 신호는 `log_wave -recursive *`로 기록되므로 interface·TB 신호는 Scope 창에서 끌어다 넣으면 된다.
- 빌드 결과는 실행한 폴더의 `xsim_build/`에 생긴다. `xsv`의 스냅샷은 `sim_r`이고, `xsv -g`/`rl`은 top + 파일 조합마다 `sim_<첫파일>_<해시6>` 스냅샷과 `xsim_build/<스냅샷>/` 폴더를 따로 쓴다. 그래서 파형 창을 연 채로 `xsv`를 실행해도 충돌하지 않고, top 이름이 같은 TB(v2·v3 등)도 창을 동시에 띄울 수 있다. 같은 조합을 다시 `xsv -g` 하면 그 창만 닫고 새로 띄운다 (2026-11-09 수정).
- Windows 프로그램이 파일을 읽어야 하므로 **`/mnt/c`, `/mnt/d` 같은 Windows 드라이브 아래에서만** 실행된다 (`~/` 아래에서는 안내 메시지만 나옴).
- 함수는 `~/.xsv.sh`에 두고 `~/.bashrc`에서 불러온다.

사전 확인: `ls /mnt/c/Xilinx/Vivado/2020.2/bin/xsim.bat` → 파일이 있어야 함 (경로나 버전이 다르면 `xsv.sh`의 Vivado 경로 두 곳 `VIV='C:\Xilinx\Vivado\2020.2\bin'`, `set bin {C:/Xilinx/Vivado/2020.2/bin}`을 그 PC에 맞게 고친다). `grep -c 'xsv.sh' ~/.bashrc` → `0` (이미 있으면 건너뜀).

### 26-1. 함수 파일 복사 + `~/.bashrc` 맨 아래에 추가
`~/.bashrc` 백업(`cp ~/.bashrc ~/.bashrc.bak_xsv`) 후:
```bash
cp <저장소>/ubuntu-terminal-setup/xsv.sh ~/.xsv.sh
echo '[ -f ~/.xsv.sh ] && source ~/.xsv.sh' >> ~/.bashrc
source ~/.bashrc
type -t xsv xsv-re
# → function / function
```

### 26-2. 사용법

| 명령 | 역할 |
|---|---|
| `xsv <top_module> <파일들...>` | 시뮬 실행, 결과를 터미널에 출력 (예: `xsv tb_adder tb_adder.sv ../adder.sv`) |
| `xsv -g <top_module> <파일들...>` | 파형 창 띄우기 (다른 TB의 창은 유지, 같은 top + 파일 조합의 창만 닫고 새로, `run all`, DUT 인스턴스 신호만 자동 추가, DUT가 없으면 top + interface 등) |
| `rl` (xsim 창 Tcl 콘솔) | 같은 창에서 다시 컴파일 + 파형 갱신 |
| `xsv -s <top_module> <RTL 파일들...>` | RTL 회로도 창 띄우기 (예: `xsv -s adder ../adder.sv`, 기존 xsv 회로도 창은 닫고 새로) |
| `rs` (Vivado Tcl 콘솔) | RTL 수정 후 같은 창에서 회로도 다시 그리기 |
| `xsv-re` / `xsv -re` | 이 터미널에서 마지막으로 실행한 xsv 다시 실행 |
| `xsv-kill` | 백그라운드 Vivado 시뮬 전부 종료 (`xsim`·`xsimk`·`xelab`·`xvlog` + 회로도 창, 파형 창 포함). 끈 프로세스와 PID 출력. Vivado 프로젝트 창은 안 건드림 |
| `xsv-clean` | `xsv-kill` + `xsim_build/` 삭제 |

> - 첫 인자는 파일명이 아니라 TB 안의 **`module` 이름**이다. 파일 경로는 실행 위치 기준 상대 경로.
> - git 저장소 안에서 쓴다면 `.gitignore`에 `xsim_build/`를 넣어 빌드 결과가 커밋되지 않게 한다.

검증 (Windows `%TEMP%` 아래 임시 폴더에서 1줄짜리 TB 실행 후 삭제):
```bash
cd /mnt/c && W=$(wslpath "$(cmd.exe /c echo %TEMP% 2>/dev/null | tr -d '\r')")/xsv_test
rm -rf "$W"; mkdir -p "$W" && cd "$W"
printf 'module tb_t;\n  initial begin\n    $display("xsv ok");\n    $finish;\n  end\nendmodule\n' > tb_t.sv
xsv tb_t tb_t.sv | tail -4
# → "xsv ok" 와 "$finish called at time : 0 fs" 가 나오면 성공, xsim_build/ 생성됨
cd /mnt/c && rm -rf "$W"
```
파형 창은 자동 검증이 어렵다 → 사용자에게 TB 폴더에서 `xsv -g ...`로 창을 띄우고, TB를 고친 뒤 창 Tcl 콘솔에 `rl`을 쳐서 파형이 갱신되는지 확인받는다. 회로도도 `xsv -s ...`로 창이 뜨고 RTL을 고친 뒤 `rs`로 바뀌는지 확인받는다.
회로도 검증 (Vivado를 스크립트로 띄워 회로도를 SVG로 저장한 뒤 종료, 1~2분 걸림):
```bash
cd /mnt/c && W=$(wslpath "$(cmd.exe /c echo %TEMP% 2>/dev/null | tr -d '\r')")/xsv_schem_test
rm -rf "$W"; mkdir -p "$W" && cd "$W"
printf 'module add2(input logic [3:0] a, b, output logic [4:0] s);\n  assign s = a + b;\nendmodule\n' > add2.sv
nohup(){ :; }; xsv -s add2 add2.sv; unset -f nohup        # 창은 띄우지 않고 xsim_build/xsv_schem.tcl 만 생성
cd xsim_build && printf 'source xsv_schem.tcl\nwrite_schematic -format svg -force sch.svg\nexit\n' > t.tcl
cmd.exe /c 'C:\Xilinx\Vivado\2020.2\bin\vivado.bat' -mode gui -nojournal -nolog -source t.tcl > /dev/null 2>&1
grep -o 'RTL_ADD' sch.svg | head -1
# → RTL_ADD 가 나오면 성공
cd /mnt/c && rm -rf "$W"
```

### 26-3. `simkill`: 안 끝나는 시뮬 강제 종료
TB에 지연 없는 `forever` 루프가 있으면 시간이 0ns에서 멈춘 채 xsim이 끝나지 않고(`xsim.log`가 계속 커짐), `xsim_build/`가 잠겨서 지워지지도 않는다. 이럴 때 Windows의 xsim 프로세스를 강제로 끈다 (2026-11-04).
- 기본: `xsimk.exe`, `xsim.exe`, `xelab.exe`, `xvlog.exe` 종료. `-a`를 붙이면 `vivado.exe`까지.
- 끈 프로세스 이름과 PID를 출력하고, 없으면 `실행 중인 시뮬 프로세스 없음`. (`taskkill` 한글 메시지는 깨져서 숨김)

사전 확인: `type simkill` → not found (이미 있으면 건너뜀).
```bash
mkdir -p ~/.local/bin
cp <저장소>/ubuntu-terminal-setup/simkill ~/.local/bin/simkill
chmod +x ~/.local/bin/simkill
simkill
# → "실행 중인 시뮬 프로세스 없음" (돌고 있던 시뮬이 있으면 "종료: xsim.exe (PID ...)")
```
> `~/.local/bin`이 `PATH`에 없으면 `echo $PATH | grep -c .local/bin` → `0`. 그때는 새 터미널을 열거나(Ubuntu 기본 `~/.profile`이 폴더가 있으면 PATH에 넣음) `~/.bashrc`에 `export PATH="$HOME/.local/bin:$PATH"`를 추가한다.

## 27단계. vim: Verilog/SV 키워드를 역할별 색으로 (모듈·클래스 경계가 잘 보이게)

vim 내장 문법은 `module`, `class`, `task`, `logic`, `input`을 전부 같은 그룹(Statement)으로 칠해서, TB에 class가 여러 개 있으면 경계가 안 보인다. 역할별로 그룹을 나누고 색을 따로 준다 (2026-11-04).

| 그룹 | 키워드 | 색 (catppuccin mocha) |
|---|---|---|
| `vlogBlock` | `module` `interface` `class` `package` `program` (+ `end~`) | 빨강 `#f38ba8`, 굵게 |
| `vlogMethod` | `task` `function` (+ `end~`) | 파랑 `#89b4fa`, 굵게 |
| `vlogProc` | `initial` `always` `always_ff/comb/latch` `final` | 주황 `#fab387`, 굵게 |
| `vlogType` | `logic` `bit` `byte` `int` `wire` `reg` `string` `void` … | 노랑 `#f9e2af` |
| `vlogDir` | `input` `output` `inout` `ref` | 청록 `#94e2d5` |
| `vlogSeparator` | `//////`, `// =====`, `// -----`처럼 기호 5개 이상 이어지는 주석 줄 | 연보라 `#b4befe`, 굵게 |
| `vlogClassName` | 파일 안의 `class X` / `interface X` 이름 + `mailbox` `semaphore` → `transaction tr;`, `virtual adder_interface vif;`, `mailbox #(transaction) mbox;`의 타입 이름 | 초록 `#a6e3a1`, 굵게 (2026-11-05) |

- `.sv`는 `systemverilog.vim`이 `class`·`logic` 등을 자기 그룹으로 다시 잡기 때문에, `after/syntax/systemverilog.vim`에서 한 번 더 적용한다.
- `vlogClassName`은 이름이 파일마다 달라서 `.vimrc`의 `s:VlogClassNames()`가 버퍼를 훑어 `syntax keyword`로 등록한다. 파일을 열 때, `:w` 저장할 때, 입력 모드를 나올 때 다시 찾는다. 다른 파일에 정의된 class는 못 찾는다.
- 색은 22단계처럼 `ColorScheme` 이벤트에서 다시 칠한다 → `theme`로 바꿔도 유지.

사전 확인: `ls ~/.vim/after/syntax/verilog.vim` → 없어야 함, `grep -c 'VlogColors' ~/.vimrc` → `0` (이미 있으면 건너뜀). `VlogColors`는 있는데 `grep -c 'VlogClassNames' ~/.vimrc` → `0`이면(2026-11-04 버전) 27-2의 "Verilog / SV 색" 섹션만 아래 내용으로 교체한다.

### 27-1. 문법 그룹 파일 2개 만들기 (`mkdir -p ~/.vim/after/syntax`)
`~/.vim/after/syntax/verilog.vim`:
```vim
" Verilog / SystemVerilog 키워드를 역할별로 나눠 색 구분 (원래는 module, logic, task 가 전부 같은 색)
" 색 자체는 ~/.vimrc 의 s:VlogColors() 에서 지정 (테마를 바꿔도 다시 칠함)

" 구조 경계 : module / class / interface ... 시작과 끝
syntax keyword vlogBlock  module endmodule macromodule interface endinterface class endclass
syntax keyword vlogBlock  package endpackage program endprogram
" 메서드 : task / function
syntax keyword vlogMethod task endtask function endfunction
" 실행 블록 : initial / always ...
syntax keyword vlogProc   initial always always_ff always_comb always_latch final
" 데이터 타입
syntax keyword vlogType   logic bit byte int integer shortint longint wire reg real shortreal string void
" 포트 방향
syntax keyword vlogDir    input output inout ref
" 구분선 주석 : ////////////// , // ====== , // ------ 처럼 기호가 5개 이상 이어지는 줄
syntax match   vlogSeparator "^\s*//\s*[/=\-*#~]\{5,}.*$"
```
`~/.vim/after/syntax/systemverilog.vim`:
```vim
" systemverilog.vim 이 class / interface / logic 등을 자기 그룹으로 다시 잡기 때문에 한 번 더 적용
execute "source " . expand("<sfile>:p:h") . "/verilog.vim"
```

### 27-2. `~/.vimrc`에 색 지정 추가
`~/.vimrc` 백업(`cp ~/.vimrc ~/.vimrc.bak_vlogcolor`) 후 23단계 `call s:MdColors()` 줄 바로 아래(없으면 맨 아래)에 추가:
```vim
" ==========================================
"  Verilog / SV 색 : 역할별로 다른 색 → module / class / task 경계가 잘 보이게
" ==========================================
" 그룹 정의는 ~/.vim/after/syntax/verilog.vim (catppuccin mocha 팔레트)
function! s:VlogColors()
    highlight vlogBlock     guifg=#f38ba8 gui=bold ctermfg=211 cterm=bold
    highlight vlogMethod    guifg=#89b4fa gui=bold ctermfg=111 cterm=bold
    highlight vlogProc      guifg=#fab387 gui=bold ctermfg=216 cterm=bold
    highlight vlogType      guifg=#f9e2af ctermfg=223
    highlight vlogDir       guifg=#94e2d5 ctermfg=116
    highlight vlogSeparator guifg=#b4befe gui=bold ctermfg=147 cterm=bold
    highlight vlogClassName guifg=#a6e3a1 gui=bold ctermfg=150 cterm=bold
endfunction
" class / interface 이름(핸들 선언 타입) : 파일 안의 class X, interface X 를 찾아서 초록으로 + mailbox, semaphore
" 예) transaction tr;  virtual adder_interface vif;  mailbox #(transaction) mbox;
" 열 때 + 저장할 때 + 입력 모드 나갈 때 다시 찾음 (다른 파일에 정의된 class 는 못 찾음)
function! s:VlogClassNames()
    if &filetype !~# '^\(verilog\|systemverilog\)$' | return | endif
    silent! syntax clear vlogClassName
    let l:names = ['mailbox', 'semaphore']
    for l:line in getline(1, '$')
        let l:m = matchlist(l:line, '^\s*\%(virtual\s\+\)\?\%(class\|interface\)\s\+\(\h\w*\)')
        if !empty(l:m) | call add(l:names, l:m[1]) | endif
    endfor
    execute 'syntax keyword vlogClassName ' . join(uniq(sort(l:names)))
endfunction
augroup vlog_classnames
    autocmd!
    autocmd Syntax verilog,systemverilog call s:VlogClassNames()
    autocmd BufWritePost,InsertLeave * call s:VlogClassNames()
augroup END
augroup vlog_colors
    autocmd!
    autocmd ColorScheme * call s:VlogColors()
augroup END
call s:VlogColors()
```
> **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열도록 안내한다.

검증 (`.sv` 임시 파일에서 키워드마다 그룹·색 확인):
```bash
T=$(mktemp -d); printf '////////////////\nclass c;\n  logic a;\n  task run(input int n);\n  endtask\nendclass\nmodule m;\n  initial begin end\n  c h;\nendmodule\n' > $T/t.sv
vim -Nu ~/.vimrc -es "$T/t.sv" +'redir! > /dev/stdout | for [l,c] in [[1,1],[2,1],[3,3],[4,3],[4,12],[7,1],[8,3],[9,3]] | let i=synID(l,c,1) | echo synIDattr(i,"name") synIDattr(synIDtrans(i),"fg#") | endfor | redir END' +'qa!'
rm -rf $T
# → vlogSeparator #b4befe / vlogBlock #f38ba8 / vlogType #f9e2af / vlogMethod #89b4fa / vlogDir #94e2d5 / vlogBlock #f38ba8 / vlogProc #fab387 / vlogClassName #a6e3a1
```


---

## 28단계. tmux: `Ctrl+b Ctrl+o` / `Ctrl+b Alt+o`(pane 돌리기), `Ctrl+b Space`(레이아웃 순환) 끄기

tmux 좌우 pane 위치가 갑자기 바뀌는 문제 (2026-11-07, `Alt+o`·`Space` 추가 2026-11-09).
- 원인: tmux 기본 키 `Ctrl+b` 다음 `Ctrl+o`는 `rotate-window`(pane 전체를 한 칸씩 돌림)이고, `Ctrl+b` 다음 `Alt+o`는 반대 방향 돌리기다. `Ctrl+b o`(다음 pane으로 이동)를 누를 때 Ctrl을 늦게 떼면 `Ctrl+o`로 들어가서 pane 위치가 바뀐다. `Ctrl+b` 다음 `Space`는 `next-layout`(가로/세로 배치를 순환)이라 실수로 눌리면 배치가 바뀐다.
- 해결: prefix 다음 `C-o`, `M-o`, `Space` 바인딩을 지운다. `Ctrl+b o`(다음 pane)는 그대로다.
- 그대로인 것: `Ctrl+b {` / `Ctrl+b }`(pane 맞바꾸기) — 직접 위치를 바꾸고 싶을 때 쓴다.

사전 확인: `tmux list-keys -T prefix | grep -E ' (C-o|M-o|Space) '` → `rotate-window`나 `next-layout`이 나오면 적용 전이다 (출력이 없으면 적용된 것).

`~/.tmux.conf` 백업(`cp ~/.tmux.conf ~/.tmux.conf.bak_ctrlo`) 후, 21단계의 `bind-key W choose-tree -Zw` 줄 아래에 추가:
```bash
# Ctrl+b Ctrl+o / Ctrl+b Alt+o (pane 돌리기) 끄기: Ctrl+b o (다음 pane) 누를 때 Ctrl을 늦게 떼면 pane 위치가 바뀌던 것
unbind-key C-o
unbind-key M-o
# Ctrl+b Space (레이아웃 순환) 끄기: 실수로 눌리면 pane 배치가 바뀌던 것
unbind-key Space
```
적용: `tmux unbind-key C-o; tmux unbind-key M-o; tmux unbind-key Space` (실행 중인 tmux에 바로 적용, `source-file`은 지운 키를 되살리지 않으므로 이것만으로 충분)

검증:
```bash
tmux list-keys -T prefix | grep -cE ' (C-o|M-o|Space) '        # → 0
tmux -L ctrlotest -f ~/.tmux.conf new-session -d -s a \; list-keys -T prefix | grep -cE ' (C-o|M-o|Space) '; tmux -L ctrlotest kill-server   # → 0 (새 서버에서도)
tmux list-keys -T prefix | grep -E ' o +select-pane'            # → 다음 pane 이동은 그대로
```

---

## 29단계. tmux: `Ctrl+b d`(detach) 끄기

tmux 작업 중 갑자기 세션에서 나가지는 문제 (2026-11-09).
- 원인: tmux 기본 키 `Ctrl+b` 다음 `d`는 `detach-client`이고, `Ctrl+b x` / `Ctrl+b &`와 달리 확인 없이 바로 실행된다.
- 해결: prefix 다음 `d` 바인딩을 지운다. 세션은 전과 같고, 나가야 할 때는 셸에서 `tmux detach`를 실행한다.
- 그대로인 것: `Ctrl+b x`(현재 pane 닫기), `Ctrl+b &`(현재 window 닫기) — 둘 다 y/n 확인을 거친다.

사전 확인: `tmux list-keys -T prefix | grep -E ' d +detach-client'` → 출력이 나오면 적용 전이다 (출력이 없으면 적용된 것).

`~/.tmux.conf` 백업(`cp ~/.tmux.conf ~/.tmux.conf.bak_detach`) 후, 28단계의 `unbind-key Space` 줄 아래에 추가:
```bash
# Ctrl+b d (detach) 끄기: 실수로 눌리면 바로 tmux에서 나가지던 것 (나갈 때는 셸에서 tmux detach)
unbind-key d
```
적용: `tmux unbind-key d` (실행 중인 tmux에 바로 적용)

검증:
```bash
tmux list-keys -T prefix | grep -c ' d  *detach-client'        # → 0
tmux -L ctrlotest -f ~/.tmux.conf new-session -d -s a \; list-keys -T prefix | grep -c ' d  *detach-client'; tmux -L ctrlotest kill-server   # → 0 (새 서버에서도)
```

---

## 30단계. vim `:!`에서 셸 함수(`pdf`, `xsv` 등) 실행 + 자동완성

vim에서 `:!pdf`, `:!xsv`가 `command not found`이고 `Tab` 자동완성에도 안 나오는 문제 (2026-11-10).
- 원인: vim의 `:!`는 `bash -c`로 실행하고, `bash -c`(비대화형 셸)는 `~/.bashrc`를 읽지 않는다. `pdf` / `png` / `ppt` / `md` / `wh`는 `~/.bashrc`의 함수, `xsv`는 `~/.xsv.sh`의 함수라 vim 안에서는 없는 명령이 된다. vim의 `:!` 자동완성도 PATH의 실행 파일만 찾는다.
- 해결: `~/.local/bin/.bashrc-fn` 하나를 만들고, 함수 이름으로 심볼릭 링크를 건다. 링크 이름과 같은 함수를 `~/.bashrc`(또는 `~/.xsv.sh`)에서 불러와 실행하므로 함수 코드는 복사하지 않는다 (`.bashrc`만 고치면 vim에도 반영).
- 터미널에서는 셸 함수가 PATH보다 먼저라 동작이 그대로다.
- 제외: `pro` / `tsv` / `iv`(폴더 이동, tmux 화면 구성이라 `:!`로는 의미 없음), `xsv-kill` / `xsv-clean`(alias), `xsv -re`(실행한 터미널에 남은 기록을 씀).

사전 확인: `ls -la ~/.local/bin/pdf` → `.bashrc-fn`을 가리키는 링크면 적용된 것. 같은 이름의 다른 명령이 없는지도 확인: `for n in pdf png ppt md wh xsv; do bash -c "command -v $n"; done` → 출력 없으면 적용 전.

`~/.local/bin/.bashrc-fn` 작성:
```bash
#!/bin/bash
# vim 의 :! 처럼 ~/.bashrc 를 읽지 않는 셸에서도 ~/.bashrc / ~/.xsv.sh 의 함수를 쓰게 하는 실행 파일
#  - ~/.local/bin/<함수 이름> 심볼릭 링크로 실행 → 같은 이름의 함수를 불러와 실행
#  - 함수 코드는 ~/.bashrc / ~/.xsv.sh 한 곳에만 있음 (여기에 복사하지 않음)
#  - 터미널에서는 셸 함수가 먼저 실행되므로 이 파일은 vim :! 같은 곳에서만 쓰임
name=$(basename "$0")
if [ "$name" = xsv ]; then
  source ~/.xsv.sh
else
  def=$(sed -n "/^${name}() {/,/^}/p" ~/.bashrc)
  [ -n "$def" ] || { echo "$name: ~/.bashrc 에서 '${name}() {' 함수를 찾지 못함" >&2; exit 1; }
  eval "$def"
fi
"$name" "$@"
```
링크:
```bash
chmod +x ~/.local/bin/.bashrc-fn
cd ~/.local/bin && for n in pdf png ppt md wh xsv; do ln -s .bashrc-fn $n; done
```
- `.bashrc`의 함수는 `이름() {`로 시작하고 `}`가 줄 맨 앞에 있어야 불러온다 (지금 함수들은 모두 이 형태). 새 함수를 vim에서도 쓰려면 같은 형태로 만들고 링크를 하나 더 건다.

검증 (없는 파일 이름을 넣어서 창은 안 열림):
```bash
for c in 'pdf zz_none' 'png zz_none' 'ppt zz_none' 'md zz_none' 'wh' 'xsv'; do bash -c "$c" 2>&1 | head -1; done
# → 각 함수의 "없음" / 사용법 메시지 (command not found 가 아니면 성공)
vim -Nes -c 'call writefile([string(getcompletion("pd","shellcmd")), string(getcompletion("xsv","shellcmd"))], "/dev/stdout")' -c 'qa!'
# → ['pdf', ...] / ['xsv']
bash -ic 'type -t pdf xsv'   # → function / function (터미널에서는 그대로 함수)
```

---

## 31단계. `exl [파일명|폴더명]`: 엑셀 파일을 Windows Excel로 열기

16단계 `pdf`와 같은 방식이다 (Windows 경로로 바꿔서 `cmd.exe /c start`, 확장자에 연결된 앱 = Excel로 열림). 인자 없이 `exl`이면 현재 폴더의 엑셀 파일 전부, `exl 이름`이면 그 파일(확장자 생략 가능, `.xlsx` → `.xlsm` → `.xls` → `.csv` 순으로 찾음), 폴더를 주면 그 안의 엑셀 파일 전부를 연다 (하위 폴더는 안 봄, 대소문자 무시). Excel이 파일을 열 때 만드는 잠금파일(`~$파일.xlsx`)은 건너뛴다 (14단계 `ppt`와 같음).

사전 확인: `bash -ic 'type -t exl'` → `function`이면 적용된 것. 같은 이름의 다른 명령이 없는지: `bash -c 'command -v exl'` → 출력 없으면 적용 전.

`~/.bashrc` 백업(`cp ~/.bashrc ~/.bashrc.bak_exl`) 후, `pdf()` 함수 바로 아래에 추가:
```bash
# ==========================================
#  exl [이름] : 현재 폴더의 엑셀 파일(.xlsx/.xlsm/.xls/.csv)을 Windows Excel로 열기
#   - exl            → 현재 폴더의 엑셀 파일 전부
#   - exl 이름       → 현재 폴더의 "이름" / "이름.xlsx" / "이름.xlsm" / "이름.xls" / "이름.csv" (확장자 생략 가능)
#   - exl 폴더명     → 그 폴더 안의 엑셀 파일 전부
#   - Excel 잠금파일(~$*.xlsx)은 건너뜀
# ==========================================
exl() {
    local target="${1:-.}" files=() f c
    if [ $# -gt 1 ]; then
        echo "사용법: exl  |  exl \"파일명\"  |  exl \"폴더명\"" >&2
        return 1
    fi
    if [ -d "$target" ]; then
        shopt -s nullglob nocaseglob
        for f in "$target"/*.xlsx "$target"/*.xlsm "$target"/*.xls "$target"/*.csv; do
            [[ "$(basename "$f")" == '~$'* ]] || files+=("$f")
        done
        shopt -u nullglob nocaseglob
        if [ ${#files[@]} -eq 0 ]; then
            echo "exl: '$(realpath "$target")' 폴더에 .xlsx/.xlsm/.xls/.csv 파일이 없음" >&2
            return 1
        fi
    else
        for c in "$target" "$target.xlsx" "$target.xlsm" "$target.xls" "$target.csv"; do
            [ -f "$c" ] && { files=("$c"); break; }
        done
        if [ ${#files[@]} -eq 0 ]; then
            echo "exl: '$PWD'에 '$target'(.xlsx/.xlsm/.xls/.csv) 없음" >&2
            return 1
        fi
    fi
    for f in "${files[@]}"; do
        f=$(realpath "$f")
        echo "열기: $f"
        (cd /mnt/c && cmd.exe /c start "" "$(wslpath -w "$f")")
    done
}
```
vim `:!exl`도 되도록 30단계 링크 추가 (30단계를 이미 적용한 경우):
```bash
cd ~/.local/bin && ln -s .bashrc-fn exl
```
적용: 열려 있는 터미널에서 `source ~/.bashrc`

검증 (실제로 Excel 창을 띄우지 않도록 `cmd.exe`를 출력으로 바꿔서 확인):
```bash
bash -ic 'cmd.exe() { echo "→ cmd.exe $*"; }; cd 엑셀있는폴더 && exl && exl 파일이름 && exl 없는이름'
# → "열기: ..." + "→ cmd.exe /c start  D:\...\파일.xlsx" / 없는 이름은 "exl: ... 없음"
bash -c 'exl 없는이름'   # → "exl: ... 없음" (vim :! 방식, command not found 가 아니면 성공)
```

---

## 32단계. vim ALE(verilator)에서 `covergroup` 오류 표시 없애기

TB에 `covergroup`을 넣으면 vim에 빨간 오류가 뜨는 문제 (2026-11-11).
- 원인: vim 문법 검사기(ALE)가 쓰는 verilator(5.032)가 covergroup을 지원하지 않는다 → `%Error-UNSUPPORTED: Unsupported: covergroup` / `cover point` / `cover bin specification` / `covergroup within class`. 경고가 아니라 지원 안 함 오류라 `-Wno-UNSUPPORTED` 같은 옵션으로 못 끈다 (`Unknown warning specified`). 클래스 안에 빈 클래스를 넣어 흉내 내는 방법도 `class within class` 미지원이라 안 된다.
- 코드 문제는 아니다: Vivado(xvlog/xsim)는 covergroup을 정상 컴파일·실행한다.
- 해결: ALE의 `b:ale_command_wrapper`로 verilator 앞에 래퍼(`verilator-cgstrip`)를 끼운다. 래퍼는 검사할 파일에 `covergroup`이 있을 때만 **임시 복사본**을 만들어 아래처럼 바꾼 뒤 verilator를 돌리고, 메시지의 파일 경로를 원래대로 되돌린다.
  - `covergroup … endgroup` → 빈 줄 (줄 번호 유지)
  - `cg = new;` / `this.cg = new;` / `cg.sample();` → `;` (빈 문장)
  - `cg.cp.get_coverage()` / `get_inst_coverage()` → `0.0`
  - 모듈에서 covergroup을 타입으로 쓴 인스턴스 선언(`cg_t cg_i = new;`)도 같이 처리
- 원본 파일과 vim 버퍼는 건드리지 않는다. covergroup이 없는 파일은 verilator를 그대로 실행한다. 다른 오류는 원래 줄 번호로 그대로 표시된다.

사전 확인: `grep -n ale_covergroup ~/.vimrc` → 나오면 적용된 것.

스크립트 설치 (저장소 폴더에서):
```bash
cp ubuntu-terminal-setup/verilator-cgstrip ~/.local/bin/ && chmod +x ~/.local/bin/verilator-cgstrip
```
`~/.vimrc` 백업(`cp ~/.vimrc ~/.vimrc.bak_cgstrip`) 후, `augroup ale_tb … augroup END` 바로 아래에 추가:
```vim
" covergroup : verilator 가 지원하지 않아 "Unsupported: covergroup" 오류가 뜸 (-Wno 옵션으로도 못 끔)
"  → 검사할 때만 covergroup 블록과 사용처(new / sample / get_coverage)를 지운 임시 복사본으로 verilator 실행
"    (~/.local/bin/verilator-cgstrip, 원본 파일·버퍼는 그대로, covergroup 없는 파일은 verilator 그대로 실행)
augroup ale_covergroup
    autocmd!
    autocmd FileType verilog,systemverilog
        \ let b:ale_command_wrapper = expand('~/.local/bin/verilator-cgstrip') . ' %*'
augroup END
```
적용: 열려 있는 vim은 파일을 다시 열거나(`:e`) vim 재시작.

검증 (covergroup 있는 TB, 예: `sim_file/tb_fifo_pre.sv`):
```bash
D=$(pwd)   # TB 가 있는 폴더
ALE="verilator --lint-only -Wall -Wno-DECLFILENAME -I$D -y $D --timing -Wno-BLKSEQ -Wno-VARHIDDEN"
$ALE tb_fifo_pre.sv 2>&1 | grep -c 'Unsupported: cover'                                  # → 1 이상 (래퍼 없이)
~/.local/bin/verilator-cgstrip $ALE tb_fifo_pre.sv 2>&1 | grep -c 'Unsupported: cover'   # → 0 (래퍼 사용)
```
- vim에서 TB를 열고 `:echo b:ale_command_wrapper` → `…/verilator-cgstrip %*`, covergroup 줄에 빨간 표시가 없으면 성공. 일부러 오타를 넣으면 그 줄에 오류가 그대로 뜬다.

---

## 33단계. 배경색 `#45475A` 통일 + vim 글자 선명하게 + tmux 상태바 위로·굵은 pane 테두리

Catppuccin Mocha 기본 배경(`#1E1E2E`)이 너무 어두워서, vim 선택 영역 색인 `#45475A`(surface1)를 배경으로 쓰기로 함 (2026-11-18).
터미널·vim·tmux 상태바를 모두 같은 색으로 맞추고, 그에 맞춰 글자·테두리·상태바를 조정했다.

사전 확인: `grep -n "my_bg" ~/.vimrc` 와 `grep -n "status-position top" ~/.tmux.conf` → 둘 다 나오면 적용된 것.

### 33-1. `theme.py` 교체 (터미널 배경 + tmux 색·배치)
저장소의 `ubuntu-terminal-setup/theme.py`를 다시 복사한다 (백업 먼저).
```bash
cp ~/.theme/theme.py ~/.theme/theme.py.bak_bg
cp <저장소>/ubuntu-terminal-setup/theme.py ~/.theme/theme.py
```
15단계 버전과 달라진 점:
- `catppuccin`: 터미널 배경 `bg='#45475A'`, ANSI black `'#313244'` (배경과 같으면 검은 글자가 안 보여서)
- `catppuccin` tmux 색: 상태바 `bar='#45475A'`(배경과 같음), 시계 칸·메시지 `box='#585B70'`, 흐린 글자 `dim='#9399B2'`, pane 테두리 전용 `border='#9399B2'`
- `write_tmux()`: 왼쪽에 날짜+시계 칸 → 세션 이름 (`status-left-length 50`), 오른쪽(`status-right`)은 비움. pane 테두리는 `border` 색 (없는 테마는 예전처럼 `box` 색)

### 33-2. `~/.vimrc`: 배경색 + 글자색 선명하게
백업(`cp ~/.vimrc ~/.vimrc.bak_bg`) 후, `if filereadable(expand('~/.vim/theme.vim'))` **바로 위**(22단계 줄번호 색 `augroup linenr_color` 보다 아래)에 추가:
```vim
" 배경색: 어떤 테마든 #45475a (Catppuccin surface1) 로 덮어씀
" EndOfBuffer(~)·Visual 선택색이 원래 #45475a 라 안 보이게 되므로 한 단계 밝은 #585b70 으로
" 배경이 밝아져 글자가 흐려 보이므로 모든 글자색(guifg)을 색조는 그대로, 밝기·채도만 올림
"   밝기 L += (1-L)*0.5 , 채도 S += (1-S)*0.7  (숫자 키우면 더 진해짐)
function! s:Brighten(hex) abort
    let [r, g, b] = map([1, 3, 5], {_, i -> str2nr(a:hex[i : i+1], 16) / 255.0})
    let mx = max([r, g, b]) | let mn = min([r, g, b])
    let l = (mx + mn) / 2 | let d = mx - mn
    let [h, s] = [0.0, 0.0]
    if d > 0
        let s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
        let h = mx == r ? (g - b) / d + (g < b ? 6 : 0) : mx == g ? (b - r) / d + 2 : (r - g) / d + 4
        let h = h / 6
    endif
    let l += (1 - l) * 0.5 | let s += (1 - s) * 0.7
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s | let p = 2 * l - q
    let out = []
    for t in [h + 1.0/3, h, h - 1.0/3]
        let t = t < 0 ? t + 1 : t > 1 ? t - 1 : t
        let c = t < 1.0/6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2.0/3 ? p + (q - p) * (2.0/3 - t) * 6 : p
        call add(out, float2nr(round(c * 255)))
    endfor
    return printf('#%02x%02x%02x', out[0], out[1], out[2])
endfunction
function! s:BrightenAll() abort
    for hl in hlget()
        if has_key(hl, 'guifg') && hl.guifg =~? '^#\x\{6}$'
            execute 'highlight' hl.name 'guifg=' . s:Brighten(hl.guifg)
        endif
    endfor
endfunction
augroup my_bg
    autocmd!
    autocmd ColorScheme * call s:BrightenAll()
                      \ | highlight Normal      guibg=#45475a
                      \ | highlight EndOfBuffer guifg=#585b70 guibg=#45475a
                      \ | highlight Visual      guibg=#585b70
augroup END
if filereadable(expand('~/.vim/theme.vim'))
```
> - `ColorScheme` 때마다 실행되므로 `theme next`로 테마를 바꿔도 배경 `#45475a` + 선명한 글자색이 유지된다 (colorscheme이 매번 원래 색으로 다시 칠하므로 밝기가 누적되지 않음).
> - 진하기 조절: `let l += (1 - l) * 0.5 | let s += (1 - s) * 0.7` 의 숫자 (앞 = 밝기, 뒤 = 채도, `0`이면 원래 색).
> - 22단계 줄번호 색도 이 블록보다 먼저 칠해지므로 같이 밝아진다.
> - tmux 안에서도 정확한 색이 나오려면 `termguicolors` + `t_8f`/`t_8b`(15단계 이전부터 있음)와 tmux `terminal-overrides ",*:RGB"`가 필요.

### 33-3. `~/.tmux.conf`: 상태바 위로 + 굵은 pane 테두리
백업(`cp ~/.tmux.conf ~/.tmux.conf.bak_border`) 후, `source-file -q ~/.tmux/theme.conf` **바로 아래**에 추가 (색이 아니라서 `theme.py`가 아닌 여기에 둠):
```bash
set -g pane-border-lines heavy   # pane 테두리를 굵은 선(┃━)으로
set -g status-position top       # 상태바를 화면 위쪽에 (왼쪽 위에 시계)
```

### 33-4. 적용
```bash
theme catppuccin              # Windows Terminal 배경 + ~/.tmux/theme.conf 다시 만듦
tmux source-file ~/.tmux.conf
```
열려 있는 vim은 `:source ~/.vimrc` 또는 다시 열기. Windows Terminal은 설정 파일이 바뀌면 바로 반영 (안 되면 새 탭).

검증:
```bash
vim -Nu ~/.vimrc -es -c 'redir! > /dev/stdout | echo g:colors_name synIDattr(hlID("Normal"),"bg#") synIDattr(hlID("Normal"),"fg#") synIDattr(hlID("String"),"fg#") | redir END | q'
# → catppuccin_mocha #45475a #e2e8fd #cafbc6   (원래 글자색 #cdd6f4 / #a6e3a1 보다 밝고 진함)
tmux show -gv status-style            # → bg=#45475A,fg=#CDD6F4
tmux show -gv status-position         # → top
tmux show -gv pane-border-lines       # → heavy
tmux show -gv pane-border-style       # → fg=#9399B2
tmux display -p '#{T:status-left}'    # → ... 2026-11-18 10:46 ... (오늘 날짜·시각)
python3 -c "import json,glob;d=json.load(open(glob.glob('/mnt/c/Users/*/AppData/Local/Packages/Microsoft.WindowsTerminal_*/LocalState/settings.json')[0],encoding='utf-8'));print([(x['background'],x['black']) for x in d['schemes'] if x['name']=='Catppuccin Mocha'])"
# → [('#45475A', '#313244')]
```

---

## 34단계. vim 기본 보강: 검색어 색칠 · 구버전 트루컬러 · netrw 파일 색 · swap 폴더 자동 생성 · Caps Lock `U P W Y`

2026-11-17 ~ 11-19에 `~/.vimrc` 여기저기에 조금씩 추가한 것들. 백업(`cp ~/.vimrc ~/.vimrc.bak_misc`) 후 아래 위치에 넣는다.
사전 확인: `grep -n "hlsearch\|netrw_color\|empty(&t_8f)\|mkdir(expand('~/.vim/swap')\|toupper(s:k)" ~/.vimrc` → 5개 다 나오면 적용된 것.

### 34-1. 검색어 전부 색칠 (`hlsearch` / `incsearch`) + 잘 보이는 검색 색
`set background=dark` **바로 아래**:
```vim
set hlsearch incsearch     " 검색어 전부 색칠 + 입력 중 미리 색칠 (색칠 지우기 :noh)
```
33-2단계 `augroup my_bg`의 `highlight Visual ...` 줄 **아래**에 3줄 추가, `augroup END` 아래에 주석 1줄:
```vim
                      \ | highlight Search      guifg=#1e1e2e guibg=#f9e2af
                      \ | highlight CurSearch   guifg=#1e1e2e guibg=#fab387
                      \ | highlight IncSearch   guifg=#1e1e2e guibg=#fab387 gui=NONE
augroup END
" 검색 색 : 배경(#45475a)과 테마 기본 Search(#3e5767)가 거의 같아 안 보여서 위에서 노랑/주황으로 다시 칠함
```
> 검색어 전체는 노랑, 지금 커서가 있는 검색어(`CurSearch`)와 입력 중 미리보기(`IncSearch`)는 주황. 색칠 지우기는 `:noh`.

### 34-2. 구버전 vim(8.2 등)에서도 tmux 안 트루컬러
`set termguicolors` **바로 아래**:
```vim
" vim 8.2 등 구버전은 TERM 이 xterm* 일 때만 트루컬러 코드를 채움 → tmux(tmux-256color)에선 비어서 색이 다 사라짐
if empty(&t_8f)
    let &t_8f = "\<Esc>[38;2;%lu;%lu;%lum"
    let &t_8b = "\<Esc>[48;2;%lu;%lu;%lum"
endif
```
> vim 9.x에서는 이미 채워져 있어서 아무 일도 안 한다. 같은 `.vimrc`를 서버(구버전 vim)에 복사했을 때 대비.

### 34-3. `:Explore`(netrw) 일반 파일 색
22단계 `augroup linenr_color … augroup END` **바로 아래**:
```vim
" Explore(netrw) 일반 파일 색: 기본은 Normal(흰색)이라 청록 #94e2d5 로 칠함 (폴더는 Directory 색 그대로)
augroup netrw_color
    autocmd!
    autocmd ColorScheme * highlight netrwPlain guifg=#94e2d5 ctermfg=116 guibg=NONE ctermbg=NONE
augroup END
```

### 34-4. swap 폴더 자동 생성
8단계 `set directory=~/.vim/swap//` **바로 위**:
```vim
call mkdir(expand('~/.vim/swap'), 'p')   " swap 폴더 없으면 생성 (새 서버에 복사했을 때 대비)
```

### 34-5. Caps Lock 켜진 채 `U` `P` `W` `Y` → 소문자처럼
19단계 `cnoremap <CR> <Cmd>call <SID>CmdLower()<CR><CR>` **바로 아래**:
```vim

" ==========================================
"  Caps Lock 대비: U P W Y → u p w y (normal / visual / operator-pending)
" ==========================================
" 대문자 U(줄 undo), P(앞에 붙여넣기), W(WORD 이동), Y(줄 복사)는 소문자 동작으로 덮어씀
" (diW → diw 처럼 텍스트 오브젝트도 소문자로 동작)
for s:k in ['u', 'p', 'w', 'y']
    execute 'nnoremap ' . toupper(s:k) . ' ' . s:k
    execute 'xnoremap ' . toupper(s:k) . ' ' . s:k
    execute 'onoremap ' . toupper(s:k) . ' ' . s:k
endfor
unlet s:k
```
> 대문자 `U`/`P`/`W`/`Y` 원래 기능은 못 쓰게 된다 (`A` `O` `G` 등 다른 대문자는 그대로).

검증:
```bash
vim -Nu ~/.vimrc -es -c 'redir! > /dev/stdout | echo &hlsearch &incsearch synIDattr(hlID("Search"),"bg#") synIDattr(hlID("CurSearch"),"bg#") synIDattr(hlID("netrwPlain"),"fg#") maparg("U","n") maparg("Y","n") | redir END | q'
# → 1 1 #f9e2af #fab387 #bffbf1 u y   (netrwPlain 은 33단계 Brighten 으로 #94e2d5 보다 밝아진 값)
```

---

## 35단계. vim UVM 편집: 설명 붙은 UVM 자동완성 + UVM 파일은 ALE 검사 끄기

UVM TB를 쓰기 시작하면서 추가 (2026-11-18 ~ 11-20).
- **자동완성**: `uvm_`을 치면 11단계 목록에 UVM 클래스·매크로·phase·함수가 **오른쪽에 한글 설명**과 함께 뜬다 (예: `uvm_component_utils  컴포넌트를 factory에 등록`). 사전은 `~/.vim/dict/uvm.dict` (`단어<Tab>설명`, 138개).
- **ALE**: 로컬 verilator는 UVM 라이브러리를 몰라서 `import uvm_pkg::*;`, `` `uvm_component_utils `` 등마다 가짜 빨간 오류가 뜬다 → 저장할 때 파일에 `uvm_pkg`나 `` `uvm_ ``가 있으면 **그 버퍼만** 검사를 끄고 기존 표시도 지운다. UVM 문법 오류는 서버 VCS의 `comp.log`로 확인 (37단계).

사전 확인: `grep -n "UvmComplete\|ale_uvm" ~/.vimrc` → 나오면 적용된 것. 11단계가 먼저 적용돼 있어야 한다.

### 35-1. 사전 파일 복사
```bash
cp <저장소>/ubuntu-terminal-setup/uvm.dict ~/.vim/dict/uvm.dict
```
> 단어를 더 넣을 때는 `uvm.dict`에 `단어<Tab>설명` 한 줄 추가 (`#` 줄은 주석). 다음 vim 실행부터 반영.

### 35-2. `~/.vimrc`: UVM 자동완성
백업(`cp ~/.vimrc ~/.vimrc.bak_uvmdict`) 후, 11-3단계 `augroup verilog_edit` **바로 위**에 추가:
```vim
" UVM 단어 : ~/.vim/dict/uvm.dict (단어<Tab>설명) 를 읽어 목록 옆에 설명 표시
"  'complete' 맨 앞 F 소스로 넣어서, 파일 안에 이미 있는 UVM 단어도 설명 붙은 쪽이 먼저 잡힘
"  (uvm.dict 를 고치면 다음 vim 실행부터 반영)
function! UvmComplete(findstart, base) abort
    if a:findstart
        return match(getline('.')[: col('.') - 2], '\k*$')
    endif
    if !exists('s:uvm_words')
        let s:uvm_words = []
        for l:line in readfile(expand('~/.vim/dict/uvm.dict'))
            if l:line =~# '^#' || l:line !~# '\t' | continue | endif
            let [l:w, l:d] = split(l:line, '\t', 1)[0:1]
            call add(s:uvm_words, {'word': l:w, 'menu': l:d})
        endfor
    endif
    if empty(a:base) | return [] | endif
    return filter(copy(s:uvm_words), 'stridx(v:val.word, a:base) == 0')
endfunction
```
그리고 `augroup verilog_edit` 안의 `setlocal dictionary=...` 줄을 아래로 교체 (`complete` 맨 앞에 `FUvmComplete,` 추가):
```vim
    autocmd FileType verilog,systemverilog setlocal dictionary=~/.vim/dict/verilog.dict complete=FUvmComplete,.,w,b,k iskeyword+=$
```
> - `complete`의 `F{함수}` 소스는 vim 9.1 후반 패치에 생긴 기능이다 (이 PC의 vim 9.1, 패치 1-2141에서 확인). 확인법: `grep -c 'F{func}' /usr/share/vim/vim91/doc/options.txt` → 1 이상이면 지원. 지원 안 하는 vim이면 `.sv`를 열 때 `complete` 오류가 나므로 이 단계를 건너뛴다.

### 35-3. `~/.vimrc`: UVM 파일은 ALE 검사 끄기
32단계 `augroup ale_covergroup … augroup END` **바로 아래**에 추가:
```vim
" UVM 파일 : 로컬 verilator 는 UVM 라이브러리를 몰라서 uvm_pkg / `uvm_ 매크로마다 가짜 오류가 뜸
"  → 저장 직전에 파일 안에 uvm_pkg 나 `uvm_ 가 있으면 그 버퍼만 ALE 검사 끄고 기존 표시도 지움
"    (UVM 코드를 지우면 다음 저장부터 다시 검사, UVM 문법 오류는 VCS comp.log 로 확인)
function! s:AleUvmCheck() abort
    if search('\<uvm_pkg\>\|`uvm_', 'nw')
        let b:ale_enabled = 0
        call ale#toggle#ResetBuffer(bufnr(''))
    else
        let b:ale_enabled = 1
    endif
endfunction
augroup ale_uvm
    autocmd!
    autocmd BufWritePre *.v,*.sv,*.svh call s:AleUvmCheck()
augroup END
```

검증:
```bash
vim -Nu ~/.vimrc -es -c 'set ft=systemverilog' -c 'redir! > /dev/stdout | echo &l:complete len(UvmComplete(0,"uvm_comp")) UvmComplete(0,"uvm_component_utils")[0].menu | redir END | q'
# → FUvmComplete,.,w,b,k 6 컴포넌트를 factory에 등록
vim -Nu ~/.vimrc -es -c 'redir! > /dev/stdout | autocmd ale_uvm | redir END | q' | grep -c AleUvmCheck
# → 3   (*.v / *.sv / *.svh)
```
실제 화면: `.sv` 파일에서 `uvm_comp` 입력 → 목록 오른쪽에 설명이 보이면 성공. `import uvm_pkg::*;`가 있는 파일을 `:w` 해도 `>>` 표시가 안 뜸.

---

## 36단계. tmux: `Ctrl+Shift+화살표`로 pane 자리 바꾸기

지금 pane을 화살표 방향의 pane과 **맞바꾼다** (커서도 같이 이동해서 계속 같은 내용의 pane에 있음). 28단계에서 끈 `Ctrl+b Ctrl+o`(돌리기)와 달리 원하는 방향으로 한 칸씩만 옮긴다.
사전 확인: `grep -n "C-S-Left" ~/.tmux.conf` → 나오면 적용된 것.

`~/.tmux.conf` 맨 아래에 추가:
```bash
# pane 자리 바꾸기: Ctrl+Shift+← ↓ ↑ → (현재 pane을 그 방향 pane과 교환, 커서도 같이 이동)
bind-key -n C-S-Left  swap-pane -d -t '{left-of}'
bind-key -n C-S-Right swap-pane -d -t '{right-of}'
bind-key -n C-S-Up    swap-pane -d -t '{up-of}'
bind-key -n C-S-Down  swap-pane -d -t '{down-of}'
```
적용: `tmux source-file ~/.tmux.conf`
> - `-n`이라 `Ctrl+b` 없이 바로 동작한다. 그 방향에 pane이 없으면 아무 일도 안 한다.
> - `{left-of}` 같은 대상은 tmux 3.1 이상. Windows Terminal에서 `Ctrl+Shift+화살표`를 다른 동작에 쓰고 있으면 (기본값은 없음) tmux까지 안 온다.

검증:
```bash
tmux list-keys -T root | grep -c 'swap-pane -d -t "{'
# → 4
```

---

## 37단계. center 서버 VCS/Verdi: `~/center` 자동 연결 + `srun` / `run` / `sim` / `verdi` / `clean` / `vcskill`

VCS·Verdi는 학원 서버(ssh 별칭 `center`)에만 있다. 서버 홈을 WSL의 `~/center`에 **sshfs로 연결**해서 파일은 로컬 vim으로 고치고, 컴파일·시뮬은 `srun`이 **서버의 같은 폴더**에서 실행한다 (2026-11-16 ~ 11-20).

| 명령 | 하는 일 |
|---|---|
| `srun <명령>` | `~/center/<경로>`에서 치면 서버 `~/<경로>`로 가서 명령 실행 (파이프 `\| tee`는 PC 쪽에서 처리) |
| `run` | `srun vcs $VCS_OPTS -f filelist.f -o simv` (UVM 1.2, `comp.log`, 커버리지 옵션 포함) |
| `sim [-n 테스트] [-l n\|l\|m\|h\|f\|d] [-s 시드] [추가 옵션]` | `./simv` 실행 + `sim.log` 저장. 안 주면 `TC`(비어 있음) / `VERB=UVM_HIGH` / `SEED=1234` |
| `verdi` | `srun verdi $VERDI_OPTS` (창은 X11로 Windows에 뜸) |
| `clean` | 시뮬 결과물 삭제. **`filelist.f`가 있는 폴더에서만** 동작 (다른 폴더 실수 삭제 방지) |
| `smake` | `srun make` |
| `vcskill` / `-y` / `-l` | 서버에서 도는 simv·vcs·verdi 목록 → 확인 후 종료 / 바로 종료 / 목록만 (파일은 안 지움) |

사전 확인:
- `ssh center true && echo ok` → `ok` (`~/.ssh/config`에 `Host center` 별칭과 키 로그인이 되어 있어야 함. 서버 주소·계정은 학원 안내대로, 이 문서에는 적지 않는다)
- `which sshfs` → 없으면 사용자에게 `! sudo apt install sshfs` 안내
- `grep -n "srun\|sshfs center" ~/.bashrc` → 나오면 적용된 것

### 37-1. 실행 파일 복사
```bash
cp <저장소>/ubuntu-terminal-setup/srun    ~/.local/bin/srun
cp <저장소>/ubuntu-terminal-setup/vcskill ~/.local/bin/vcskill
chmod +x ~/.local/bin/srun ~/.local/bin/vcskill
mkdir -p ~/center
```

### 37-2. `~/.bashrc` 맨 아래에 추가
백업(`cp ~/.bashrc ~/.bashrc.bak_vcs`) 후. **예전에 `run(){ python3 "$@"; }` 함수나 `alias sim=` / `alias clean=`이 있으면 먼저 지운다** (같은 이름이라 충돌).
```bash
# smake : srun make 줄임 (~/center 안에서 서버의 같은 폴더에서 make 실행)
alias smake='srun make'

# sim 기본값 : sim 옵션(-n / -l / -s)을 안 주면 이 값으로 실행
TC=
SEED=1234
VERB=UVM_HIGH
# 시뮬이 안 끝나고 계속 도는 것 방지 (둘 다 1시간)
#   SIM_WALL : 실제 시간 제한 → 넘으면 simv 강제 종료 (0시간 무한루프, UVM 없는 TB 도 막음)
#   TIMEOUT  : UVM 시뮬레이션 시간 제한 (+UVM_TIMEOUT, 단위 ps → 1h = 3600 * 10^12 ps)
SIM_WALL=1h
TIMEOUT=3600000000000000

VCS_OPTS="-full64 -sverilog"
VCS_OPTS+=" -ntb_opts uvm-1.2"
VCS_OPTS+=" -timescale=1ns/1ps"
VCS_OPTS+=" -debug_access+all -kdb -lca -l comp.log"
VCS_OPTS+=" +incdir+tb"
VCS_OPTS+=" -cm line+cond+fsm+tgl+branch+assert"

VERDI_OPTS="-dbdir simv.daidir -ssf novas.fsdb -sswr signal.rc"

alias run='srun vcs $VCS_OPTS -f filelist.f -o simv'
alias verdi='srun verdi $VERDI_OPTS'

# 예전 alias 가 남아 있으면 source ~/.bashrc 때 함수 정의가 깨지므로 먼저 제거
unalias sim clean 2>/dev/null

# sim [-n 테스트이름] [-l 레벨] [-s 시드] [추가 옵션...]
#   예) sim -n my_test -lh      → my_test, UVM_HIGH
#       sim -n my_test -ll -s 7 → my_test, UVM_LOW, seed 7
#   레벨 : n=NONE  l=LOW  m=MEDIUM  h=HIGH  f=FULL  d=DEBUG  (안 주면 VERB 기본값)
#   옵션 뒤에 남은 것(+my_arg 등)은 simv 에 그대로 넘어감
sim() {
    local tc="$TC" seed="$SEED" verb="$VERB" opt OPTIND=1
    while getopts ":n:l:s:" opt; do
        case "$opt" in
            n) tc="$OPTARG" ;;
            s) seed="$OPTARG" ;;
            l) case "$OPTARG" in
                   n) verb=UVM_NONE ;;   l) verb=UVM_LOW ;;   m) verb=UVM_MEDIUM ;;
                   h) verb=UVM_HIGH ;;   f) verb=UVM_FULL ;;  d) verb=UVM_DEBUG ;;
                   *) echo "sim: -l 레벨은 n/l/m/h/f/d 중 하나 (입력: $OPTARG)" >&2; return 1 ;;
               esac ;;
            :) echo "sim: -$OPTARG 뒤에 값이 필요함" >&2; return 1 ;;
            *) echo "사용법: sim [-n 테스트이름] [-l n|l|m|h|f|d] [-s 시드] [추가 옵션...]" >&2; return 1 ;;
        esac
    done
    shift $((OPTIND - 1))
    local SIM_OPTS="+UVM_VERBOSITY=$verb"
    SIM_OPTS+=" +ntb_random_seed=$seed"
    SIM_OPTS+=" +UVM_TIMEOUT=$TIMEOUT,NO"
    [ -n "$tc" ] && SIM_OPTS+=" +UVM_TESTNAME=$tc"
    SIM_OPTS+=" -cm line+cond+fsm+tgl+branch+assert"
    SIM_OPTS+=" -cm_dir coverage.vdb"
    SIM_OPTS+=" -cm_name sim1"
    srun timeout $SIM_WALL ./simv $SIM_OPTS "$@" | tee sim.log
    # timeout 이 끊으면 종료 코드 124
    [ "${PIPESTATUS[0]}" = 124 ] && echo "sim: 실제 시간 $SIM_WALL 초과로 강제 종료됨" | tee -a sim.log
}

# clean : 시뮬 결과물 삭제. filelist.f 가 있는 폴더(시뮬 폴더)에서만 동작 → 다른 폴더 실수 삭제 방지
clean() {
    if [ ! -f filelist.f ]; then
        echo "clean: filelist.f 가 없는 폴더라 삭제 안 함 (지금: $PWD)" >&2
        return 1
    fi
    rm -rf simv* csrc *.key *.h *.log *.fsdb novas* *.conf *.LOG coverage.* vdCovLog verdiLog *.xml
}

# ~/center : 서버(center) 홈을 sshfs 로 연결. WSL 재시작 등으로 끊겨 있으면 터미널 열 때 자동 재연결
if ! mountpoint -q ~/center; then
    sshfs center: ~/center -o reconnect,ServerAliveInterval=15,ConnectTimeout=5 2>/dev/null \
        || echo "~/center 서버 연결 실패 (수동: sshfs center: ~/center -o reconnect,ServerAliveInterval=15)"
fi
```
> - `sim`의 `+UVM_TESTNAME`은 `TC`나 `-n`이 있을 때만 붙는다 (없으면 TB의 `run_test("...")` 기본값).
> - `sim` 시간 제한 두 가지: `SIM_WALL`(실제 시간, `timeout`이 simv를 끊음 → 종료 코드 124면 `sim.log`에도 안내 기록), `TIMEOUT`(UVM 시뮬레이션 시간, `+UVM_TIMEOUT=…,NO`).
> - `run`/`sim`/`verdi`는 `~/center` 밖에서 치면 `srun`이 "~/center 안에서 실행하세요"로 막는다. `clean`은 로컬에서 바로 지운다 (sshfs라 서버 파일이 지워짐).
> - `vcskill`은 로컬 WSL에 남은 `ssh center … simv/verdi/make` 세션도 같이 끈다.

적용: `source ~/.bashrc`

검증:
```bash
bash -ic 'type -t srun vcskill sim clean; alias run verdi smake' 2>&1 | head -7
# → file / file / function / function / alias run=... / alias verdi=... / alias smake=...
mountpoint ~/center                       # → /home/<사용자>/center is a mountpoint
cd ~/center && srun pwd                   # → 서버 홈 경로
cd /tmp && srun pwd                       # → srun: ~/center 안에서 실행하세요 (지금: /tmp)
cd /tmp && clean                          # → clean: filelist.f 가 없는 폴더라 삭제 안 함 (지금: /tmp)
vcskill -l                                # → [서버] 실행 중인 시뮬레이션/Verdi 없음
```

---

## 최종 검증 체크리스트

- [ ] Windows Terminal 재시작 후 배경이 Gruvbox 갈색(#282828), 글꼴이 D2Coding
- [ ] `vim` 실행 시 Gruvbox 테마 (`:echo g:colors_name` → `gruvbox`)
- [ ] vim에서 `:vert term` 연 터미널도 Gruvbox 색 (짙은 파란색 없음), 프롬프트/`ls` 색이 바깥 터미널과 동일
- [ ] tmux 하단 상태바가 갈색 바탕 + 노란 세션명 + 주황 현재 창
- [ ] tmux 안에서 `Ctrl+b |`로 분할 → `Ctrl+h/j/k/l`로 vim ↔ 터미널 이동 (4-4 확인: tmux에 `C-w` 바인딩 없음)
- [ ] `ls` 시 폴더가 연한 하늘색
- [ ] `cd **` + `Tab` 으로 Gruvbox 색의 폴더 검색 목록이 뜸
- [ ] `Ctrl+q` 로 폴더 검색 목록이 뜨고, 선택하면 바로 그 폴더로 이동
- [ ] 새 창의 프롬프트가 `.../상위폴더/현재폴더$` 형태 (사용자@컴퓨터 없음)
- [ ] vim으로 파일을 연 상태에서 그 폴더에 `.swp`가 안 생기고 `~/.vim/swap/`에 생김
- [ ] `t4` 입력 시 4분할 tmux 세션이 열리고, 그 안에서 `v` / `h`로 좌우 / 상하 분할, `3v` → 같은 크기 3칸
- [ ] 하위 폴더에서 `git status` 시 추적 안 된 폴더가 `./`가 아니라 폴더명으로 보임
- [ ] `watch_html 파일.html` 로 Windows 브라우저에 HTML이 열림
- [ ] `viva` 입력 시 `/mnt/c/26_AI_CAMP/System_Verilog`로 이동
- [ ] PPT 폴더에서 `ppt` / `ppt 파일` / `ppt 폴더` 로 Windows PowerPoint에 PPT가 열림
- [ ] vim으로 `.v` 파일을 열고 입력하면 후보 목록이 뜨고, `:w` 저장 후에만 문법 오류 줄에 `>>` + 주석 메시지가 나옴
- [ ] PDF 폴더에서 `pdf` / `pdf 파일` / `pdf 폴더` 로 Windows에서 PDF가 열림
- [ ] `theme` 실행 시 `* catppuccin`, 터미널·vim·tmux가 Catppuccin Mocha 색
- [ ] md 폴더에서 `md` / `md 파일` / `md 폴더` 로 브라우저에 VS Code 미리보기 모양으로 열리고, 파일을 고치면 탭이 바로 바뀜
- [ ] vim에서 md 열고 `:md` → 브라우저가 열리고, 입력하는 대로(`:w` 없이) 미리보기가 바뀌고 커서를 따라 스크롤됨
- [ ] Caps Lock 켜고 vim에서 `:W` / `:WQ` / `:Q!` / `:SET NU` → 소문자 명령처럼 실행 (E492 없음), normal 모드 `A` `O` `G`는 원래대로
- [ ] tmux에서 `Ctrl+b` + 화살표로 창이 한 번 이동하고, 바로 이어서 화살표만 누르면 창이 안 바뀜
- [ ] Caps Lock 켜고 tmux에서 `Ctrl+B P` → 이전 window, `Ctrl+B W` → window 목록 (소문자와 같음)
- [ ] vim 줄번호가 회보라, 커서가 있는 줄 번호만 주황색 (`theme next`로 테마를 바꿔도 같음)
- [ ] vim으로 md를 열면 제목이 단계별 색, `**`·`` ` ``·링크 url이 숨겨지고 커서 줄에서만 보임, 표의 `|`가 흐림
- [ ] vim에서 md 열고 `:glow` → 창 분할 없이 지금 창이 vim 색으로 렌더링, `q` → 원래 편집 화면(커서 위치 그대로)으로 복귀
- [ ] vim에서 Caps Lock을 켜면 오른쪽 위에 주황 `CAPS`, `한/영`으로 한글을 켜면 그 왼쪽에 파랑 `한`이 뜨고, 끄면 사라짐
- [ ] `iv` 입력 시 `interview`로 이동해서 Claude가 열리고, 두 번째부터는 이전 토론이 이어짐
- [ ] TB 폴더(`/mnt/c` 또는 `/mnt/d` 아래)에서 `xsv <top> <파일들>` → 시뮬 출력이 터미널에 나오고, `xsv -g ...` → 파형 창이 뜸 (DUT 인스턴스 신호 자동 추가), `xsv -s <RTL top> <RTL 파일>` → Vivado 회로도 창이 뜸
- [ ] `xsv-kill` → `xsv-kill: 실행 중인 Vivado 시뮬 없음` (돌고 있으면 `xsv-kill: 종료 xsimk.exe (PID …)`)
- [ ] `simkill` → `실행 중인 시뮬 프로세스 없음` (시뮬이 돌고 있으면 끈 프로세스와 PID 출력)
- [ ] tmux에서 `Ctrl+b Ctrl+o` / `Ctrl+b Alt+o` / `Ctrl+b Space`를 눌러도 pane 배치가 안 바뀜, `Ctrl+b o`는 다음 pane으로 이동
- [ ] tmux에서 `Ctrl+b d`를 눌러도 세션에서 안 나가짐, 셸에서 `tmux detach`로는 나가짐
- [ ] vim에서 `:!pd` + `Tab` → `pdf` 자동완성, `:!pdf 없는이름` → `pdf: ... 없음` (`command not found` 아님)
- [ ] 엑셀 파일 폴더에서 `exl` / `exl 파일` / `exl 폴더` 로 Windows Excel에서 열림 (`~$` 잠금파일은 안 열림), vim `:!exl`도 동작
- [ ] vim에서 `covergroup`이 있는 TB를 열어도 `Unsupported: covergroup` 빨간 표시가 없음, 다른 오타는 그대로 표시됨
- [ ] vim으로 `.sv`를 열면 `module`/`class` 빨강, `task`/`function` 파랑, `initial` 주황, `logic` 노랑, `input` 청록, `//////` 구분선 연보라, `transaction tr;` 같은 class 핸들 타입 초록
- [ ] 터미널·vim·tmux 상태바 배경이 모두 `#45475A`(회남색)로 같고, vim 글자가 흐리지 않음
- [ ] tmux 상태바가 화면 맨 위, 왼쪽 위에 `날짜 시각`, pane 테두리가 굵은 선(`┃━`)이고 지금 pane 쪽만 파랑
- [ ] `md` 미리보기에서 목차 링크를 누르면 그 제목으로 스크롤됨
- [ ] vim에서 `/단어` 검색 시 모든 일치가 노랑, 커서 위치는 주황, `:noh`로 지워짐. Caps Lock 켜고 `Y` → 줄 복사 아닌 `y`처럼 동작
- [ ] `.sv`에서 `uvm_comp` 입력 → 목록 오른쪽에 한글 설명, `import uvm_pkg::*;` 있는 파일은 `:w` 해도 `>>` 표시 없음
- [ ] tmux `Ctrl+Shift+→` → 지금 pane이 오른쪽 pane과 자리를 바꿈
- [ ] 새 터미널에서 `mountpoint ~/center` 성공, `~/center/<폴더>`에서 `run` → `sim -n 테스트 -ll` → `verdi` 동작, `vcskill -l`로 서버 프로세스 확인

## 사용자에게 전달할 사용법 요약

| 동작 | 키 |
|---|---|
| 좌우 분할 / 위아래 분할 | `Ctrl+b` 다음 `\|` / `Ctrl+b` 다음 `-` |
| 셸 명령으로 좌우 / 위아래 분할 (tmux 안에서) | `v` / `h` (같은 크기 n칸: `3v` / `4h`, 2~9) |
| tmux 4분할 세션 한 번에 열기 | `t4` |
| 방향으로 이동 (vim 창 ↔ tmux 창 구분 없이) | `Ctrl+h/j/k/l` (`Ctrl+w w` / `Ctrl+w h` 등은 vim 창끼리만) |
| pane 자리 바꾸기 (그 방향 pane과 교환) | `Ctrl+Shift+←↓↑→` |
| 화살표 방향으로 이동 (한 번 누르면 한 번만) | `Ctrl+b` 다음 `←↑↓→` (화살표만으로는 이동 안 함) |
| 이전 window / window 목록 (Caps Lock 켜져 있어도 됨) | `Ctrl+b` 다음 `p` / `w` (`Ctrl+B`, `P` / `W`) |
| 창 확대/복원 | `Ctrl+b` 다음 `z` |
| pane 위치 맞바꾸기 (`Ctrl+b Ctrl+o` / `Alt+o` / `Space`는 꺼 둠) | `Ctrl+b` 다음 `{` / `}` |
| 셸 화면 지우기 | `Ctrl+b` 다음 `Ctrl+l` (또는 `clear`) |
| vim 안에서 PDF/그림/PPT 열기, 시뮬 실행 | `:!pdf 이름`, `:!png 이름`, `:!xsv -g top 파일.sv` (`Tab` 자동완성) |
| 폴더 검색해서 바로 이동 | `Ctrl+q` (또는 `cd **` + `Tab`) |
| Verilog 자동완성 (입력 모드) | `↑`/`↓`로 고르고 `Tab`으로 완성 (선택 없이 `Tab` = 첫 후보) |
| HTML 파일을 브라우저로 열기 | `watch_html "파일명.html"` |
| System_Verilog 작업 폴더로 이동 | `viva` |
| PPT 파일(또는 폴더 안 PPT 전부)을 PowerPoint로 열기 | `ppt` / `ppt "파일명"` / `ppt "폴더명"` |
| PDF 파일(또는 폴더 안 PDF 전부) 열기 | `pdf` / `pdf "파일명"` / `pdf "폴더명"` |
| 엑셀 파일(또는 폴더 안 엑셀 전부) 열기 | `exl` / `exl "파일명"` / `exl "폴더명"` (`.xlsx` `.xlsm` `.xls` `.csv`) |
| Markdown을 VS Code 미리보기처럼 실시간으로 보기 (탭 닫으면 자동 종료) | `md` / `md "파일명"` / `md "폴더명"` |
| vim에서 md 편집하면서 실시간 미리보기 | `:md` (끄기 `:mdstop`) |
| vim에서 md 렌더링 화면 보기 (지금 창에서) | `:glow` (돌아가기 `q` 또는 `:glow`, 테마 바꾸기 `:glow 이름` + `Tab`) |
| vim에서 md 기호(`**` 등) 전부 보이기 / 다시 숨기기 | `:set conceallevel=0` / `:set conceallevel=2` |
| Caps Lock 켜진 채 `:` 명령 | `:W` `:WQ` `:Q!` `:SET NU` 등 그대로 쳐도 소문자 명령처럼 실행 |
| 면접 포트폴리오 토론 세션 열기 (이어서) | `iv` |
| 테마 바꾸기 (터미널·vim·tmux 같이) | `theme` (목록) / `theme next` / `theme 이름` (catppuccin, onedark, everforest, gruvbox …) |
| vim 바꾸기·검색에서 단어 자동완성 | `:%s/w` 또는 `/w` 입력 후 `Tab` (계속 누르면 다음 후보) |
| Caps Lock / 한글 켜졌는지 확인 | vim 오른쪽 위에 `CAPS` / `한`이 보이면 켜진 상태 |
| Vivado 시뮬 실행 (터미널 출력) / 파형 창 | `xsv <top> <파일들>` / `xsv -g <top> <파일들>` |
| 파형 창에서 TB 다시 컴파일 + 갱신 / 마지막 xsv 다시 실행 | 창 Tcl 콘솔 `rl` / `xsv-re` |
| 백그라운드 Vivado 시뮬 전부 종료 (빌드 실패 `43-3345` 때) / 빌드 폴더까지 삭제 | `xsv-kill` / `xsv-clean` |
| RTL 회로도 보기 / 수정 후 다시 그리기 | `xsv -s <top> <RTL 파일들>` / Vivado Tcl 콘솔 `rs` |
| 안 끝나는 시뮬 강제 종료 (`xsim_build` 안 지워질 때) / Vivado까지 | `simkill` / `simkill -a` |
| vim 검색 색칠 지우기 | `:noh` |
| UVM 단어 자동완성 (설명 보기) | `.sv`에서 `uvm_` 입력 → `↑`/`↓` + `Tab` |
| 서버(center) 같은 폴더에서 명령 실행 (`~/center` 안에서) | `srun <명령>` (`smake` = `srun make`) |
| VCS 컴파일 / 시뮬 / Verdi / 결과물 삭제 | `run` / `sim [-n 테스트] [-l n\|l\|m\|h\|f\|d] [-s 시드]` / `verdi` / `clean` |
| 서버 시뮬·Verdi 확인 / 종료 | `vcskill -l` / `vcskill` (`-y` 확인 없이) |

- vim 이동 키는 **일반(Normal) 모드**에서만 동작 → 입력 모드면 `Esc` 먼저
- Claude Code도 tmux 창 안에서 실행해야 같은 키로 이동 가능

## 되돌리기
- 테마: `theme gruvbox`로 원래 색으로 (완전히 되돌리려면 `~/.vimrc.bak7`, `~/.tmux.conf.bak_theme`, `settings.json.bak_theme` 복원, `~/.bashrc`의 `theme()` 줄 삭제)
- Windows Terminal: `settings.json.bak` 복원
- vim: `~/.vimrc.bak` 복원, `rm -rf ~/.vim/pack/themes/start/gruvbox ~/.vim/pack/plugins/start/vim-tmux-navigator`
- tmux: `~/.tmux.conf`에서 해당 섹션 삭제 후 `tmux source-file ~/.tmux.conf`
- ls 색: `~/.bashrc`의 "ls 색상 (Gruvbox)", "굵은 색 → 밝은 색 코드로 통일" 섹션 삭제
- 프롬프트: `~/.bashrc`의 `PROMPT_DIRTRIM=2` 줄 삭제, PS1에 `\u@\h:` 다시 추가 (또는 `~/.bashrc.bak` 복원)
- vim swap 위치: `~/.vimrc`의 `set directory=~/.vim/swap//` 줄 삭제
- tmux 분할 alias: `~/.bashrc`의 `alias t4`, `alias v`, `alias h` 줄 삭제
- git status 경로: `git config --global --unset status.relativePaths`
- watch_html: `~/.bashrc`의 "watch_html" 섹션 삭제
- viva: `~/.bashrc`의 `alias viva` 줄 삭제
- ppt: `~/.bashrc`의 "ppt" 섹션 삭제
- pdf: `~/.bashrc`의 "pdf" 섹션 삭제
- md: `~/.bashrc`의 "md" 섹션 삭제, `~/.vimrc`의 ":Md" 섹션 삭제, `rm -rf ~/.mdview` (2026-10-24 이전 방식으로 만들어진 HTML은 Windows `%TEMP%\mdview`). 실시간 `md`만 되돌리려면 `~/.bashrc.bak_mdlive`, `~/.mdview/mdview.py.bak_mdlive` 복원
- 대문자 명령: `~/.vimrc`의 "대문자 명령 → 소문자 명령" 섹션 삭제 (또는 `~/.vimrc.bak_capscmd` 복원)
- Verilog 편집 보조: `rm -rf ~/.vim/pack/plugins/start/ale ~/.vim/dict`, `~/.vimrc`의 "Verilog 편집 보조" 섹션 삭제
- 화살표 반복 끄기: `~/.tmux.conf`의 "Ctrl+b 다음 화살표" 4줄 삭제 후 `tmux kill-server`로 재시작 (기본 `-r` 키로 돌아옴) (또는 `~/.tmux.conf.bak_arrow` 복원)
- Caps Lock `P`/`W`: `~/.tmux.conf`의 "Caps Lock 켜진 채 Ctrl+B / Ctrl+b P / W" 4줄 삭제 후 `tmux set -gu prefix2 \; unbind P \; unbind W` (또는 `~/.tmux.conf.bak_caps` 복원)
- 줄번호 색: `~/.vimrc`의 "줄번호 색" 7줄(`set cursorline` ~ `augroup END`) 삭제 (또는 `~/.vimrc.bak_linenr` 복원)
- 면접 토론 세션: `~/.bashrc`의 `iv()` 함수 삭제 (또는 `~/.bashrc.bak_iv` 복원)
- md 보기 좋게: `~/.vimrc`의 "md 파일을 vim 안에서 보기 좋게" 섹션 삭제, `rm ~/.vim/after/syntax/markdown.vim` (또는 `~/.vimrc.bak_mdview` 복원)
- glow: `~/.vimrc`의 ":Glow" 섹션 삭제, 19단계 `l:alias`에서 `'glow': 'Glow'` 삭제, `rm ~/.local/bin/glow`, `rm -rf ~/.config/glow` (`~/.vimrc.bak_glow`는 11-20 변경 직전 = 오른쪽 창 실시간 미리보기 버전)
- Caps Lock / 한글 표시: `~/.vimrc`의 "Caps Lock / 한글 표시" 섹션 삭제, `rm ~/.vim/keystate.ps1` (또는 `~/.vimrc.bak_capsind` 복원)
- xsv: `~/.bashrc`의 `[ -f ~/.xsv.sh ] && source ~/.xsv.sh` 줄 삭제, `rm ~/.xsv.sh` (또는 `~/.bashrc.bak_xsv` 복원)
- simkill: `rm ~/.local/bin/simkill`
- Verilog 키워드 색: `~/.vimrc`의 "Verilog / SV 색" 섹션 삭제, `rm ~/.vim/after/syntax/verilog.vim ~/.vim/after/syntax/systemverilog.vim` (또는 `~/.vimrc.bak_vlogcolor` 복원). class 이름 색만 빼려면 "Verilog / SV 색" 섹션의 `vlogClassName` highlight 줄과 `s:VlogClassNames()` / `vlog_classnames` augroup 삭제
- `Ctrl+b Ctrl+o` / `Alt+o` 끄기: `~/.tmux.conf`의 "Ctrl+b Ctrl+o / Ctrl+b Alt+o (pane 돌리기) 끄기" 3줄 삭제 후 `tmux bind-key C-o rotate-window; tmux bind-key M-o rotate-window -D` (또는 `~/.tmux.conf.bak_ctrlo` 복원)
- `Ctrl+b Space` 끄기: `~/.tmux.conf`의 "Ctrl+b Space (레이아웃 순환) 끄기" 2줄 삭제 후 `tmux bind-key Space next-layout`
- `Ctrl+b d` 끄기: `~/.tmux.conf`의 "Ctrl+b d (detach) 끄기" 2줄 삭제 후 `tmux bind-key d detach-client`
- vim `:!` 셸 함수: `cd ~/.local/bin && rm pdf png ppt md wh xsv exl .bashrc-fn`
- `exl`: `~/.bashrc`의 "exl [이름]" 주석 블록과 `exl()` 함수 삭제 (또는 `~/.bashrc.bak_exl` 복원), `rm ~/.local/bin/exl`
- covergroup 래퍼: `~/.vimrc`의 `augroup ale_covergroup … augroup END` 블록(주석 3줄 포함) 삭제 (또는 `~/.vimrc.bak_cgstrip` 복원), `rm ~/.local/bin/verilator-cgstrip`
- TB `VARHIDDEN` 경고 다시 켜기: `~/.vimrc` `ale_tb`의 `-Wno-VARHIDDEN` 삭제
- 배경색 `#45475A` / 글자 선명하게: `~/.vimrc`의 "배경색: 어떤 테마든 #45475a" 주석 ~ `augroup my_bg … augroup END` 블록 삭제 (또는 `~/.vimrc.bak_bg` 복원), `~/.theme/theme.py.bak_bg` 복원 후 `theme catppuccin`
- tmux 상태바 위로 / 굵은 테두리: `~/.tmux.conf`의 `pane-border-lines heavy`, `status-position top` 2줄 삭제 후 `tmux set -gu pane-border-lines \; set -gu status-position`
- `v` / `h` n칸 분할: `~/.bashrc`의 "v / h : 지금 pane 을 n칸으로" 블록(`unalias v h` ~ `unset n`)을 예전 alias 2줄로 교체 (또는 `~/.bashrc.bak4` 복원)
- md 목차 링크: `~/.mdview/mdview.py.bak_anchor` 복원
- 34단계 vim 보강: `~/.vimrc`에서 `set hlsearch incsearch`, `augroup my_bg`의 Search/CurSearch/IncSearch 3줄, `if empty(&t_8f)` 블록, `augroup netrw_color`, `call mkdir(... swap ...)`, "Caps Lock 대비: U P W Y" 섹션 삭제 (검색 색만: `~/.vimrc.bak_hls` 복원)
- 35단계 UVM: `~/.vimrc`의 `UvmComplete` 함수·`augroup ale_uvm` 블록 삭제, `complete=`에서 `FUvmComplete,` 삭제, `rm ~/.vim/dict/uvm.dict` (또는 `~/.vimrc.bak_uvmdict` 복원)
- `Ctrl+Shift+화살표`: `~/.tmux.conf`의 "pane 자리 바꾸기" 5줄 삭제 후 `tmux unbind -n C-S-Left \; unbind -n C-S-Right \; unbind -n C-S-Up \; unbind -n C-S-Down`
- center VCS: `~/.bashrc`의 `alias smake` ~ `~/center` sshfs 블록 삭제, `fusermount -u ~/center`, `rm ~/.local/bin/srun ~/.local/bin/vcskill`
