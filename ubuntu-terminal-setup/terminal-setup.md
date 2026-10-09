# WSL 터미널 환경 설정 가이드 (Gruvbox + tmux + vim)

> **Claude Code에게:** 이 문서는 다른 PC에서 만든 설정을 새 PC에 똑같이 재현하기 위한 작업 지시서다.
> 아래 순서대로 진행하되, 각 단계의 **사전 확인**으로 이미 적용된 부분은 건너뛰고(중복 추가 금지),
> 설정 파일을 수정하기 전에는 반드시 `.bak` 백업을 만든다. 모든 단계가 끝나면 **최종 검증**을 실행하고 결과를 사용자에게 보고한다.

## 업데이트 이력

### 2026-10-09 업데이트

| 구분 | 단계 | 내용 | 수정 대상 |
|---|---|---|---|
| 추가 | 17단계 | `md` / `md "파일명"` / `md "폴더명"`: Markdown을 **VS Code 미리보기처럼** 브라우저로 보기 (GitHub 스타일 + 코드 색, 인터넷 없이 동작, `pdf`와 같은 방식) | `~/.mdview/`(저장소 `ubuntu-terminal-setup/mdview.py`), `~/.bashrc` |
| 추가 | 17-3단계 | vim `:MdLive`: 편집 중인 md를 브라우저에서 **실시간 미리보기** (`:w` 안 해도 입력하는 대로 바뀜, vim 커서 위치를 따라 스크롤), `:MdLiveStop`으로 끄기 | `~/.vimrc`, `~/.mdview/mdview.py` |
| 추가 | 18단계 | `iv`: 면접 포트폴리오 토론 전용 Claude 세션 (`homework/interview` 폴더). 처음이면 `interview` 이름으로 새 세션, 이후로는 마지막 대화 이어서 열기 | `~/.bashrc` |

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
| 4 | **`Ctrl+w w`로 vim 창과 tmux 창(터미널)을 구분 없이 이동** (셸의 `Ctrl+w` 단어 지우기는 포기) | `~/.tmux.conf`, `~/.vimrc`, vim-tmux-navigator |
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
| 17 | `md` (현재 폴더 전부) / `md "파일명"` (확장자 생략 가능) / `md "폴더명"`으로 Markdown을 VS Code 미리보기처럼 브라우저에서 보기 + vim `:MdLive`로 편집하면서 실시간 미리보기 | `~/.mdview/`, `~/.bashrc`, `~/.vimrc` |

## 전제 환경

- Windows + **WSL2 (Ubuntu)** + **Windows Terminal** + **tmux 3.x** + **vim 9.x**
- 사전 확인: `vim --version | head -1`, `tmux -V`, `echo $TMUX`
- tmux가 없으면 `sudo apt install tmux` (sudo는 사용자에게 `! sudo apt install tmux`로 직접 실행하도록 안내)

### ⚠️ 중요 배경 (이전에 겪은 문제)

- **화면 분할은 반드시 tmux로 해야 한다.** Windows Terminal의 분할(`Alt+Shift+D` 등)로 나눈 창 사이는
  tmux/vim 단축키로 이동할 수 없다. 사용자에게 tmux 안에서 `Ctrl+b |` / `Ctrl+b -`로 분할하도록 안내한다.
- `Ctrl+w w`는 원래 vim 전용 키다. tmux 창까지 이동하게 하려면 tmux와 vim **양쪽 모두** 설정해야 한다.
- vim에서 `<C-w>w` 형태로 매핑하면 `timeoutlen`(1초) 안에 `w`를 안 누를 때 동작하지 않는다.
  → `<C-w>` 하나만 매핑하고 `getcharstr()`로 다음 키를 **시간 제한 없이** 기다리는 방식으로 해결했다 (4단계 코드 참고).

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

## 4단계. `Ctrl+w w`로 vim ↔ tmux 창 이동 (핵심)

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

# Ctrl+w w 로 tmux 창 이동 (셸의 Ctrl+w 단어 지우기는 사용 안 함)
#  - vim 창이면 Ctrl+w 를 vim 에게 전달 (vim 쪽 .vimrc 가 처리)
#  - 그 외 창이면 ctrlw 키 테이블로 전환 → w / h / j / k / l 로 이동
bind-key -n C-w if-shell "$is_vim" 'send-keys C-w' 'switch-client -T ctrlw'
bind-key -T ctrlw w   select-pane -t :.+
bind-key -T ctrlw C-w select-pane -t :.+
bind-key -T ctrlw h   select-pane -L
bind-key -T ctrlw j   select-pane -D
bind-key -T ctrlw k   select-pane -U
bind-key -T ctrlw l   select-pane -R
```
> `is_vim` 정의가 `C-w` 바인딩보다 **위에** 있어야 한다.

적용: `tmux source-file ~/.tmux.conf` (트루컬러 설정은 `tmux kill-server` 후 재시작해야 완전히 적용)

### 4-3. `~/.vimrc` 맨 아래에 추가
```vim
" ==========================================
"  Ctrl+w w 로 tmux 창까지 이동
" ==========================================
" vim 창을 한 바퀴 다 돌면 다음 tmux 창(터미널 등)으로 넘어감
if exists('$TMUX')
    function! s:CycleWindow()
        if winnr() < winnr('$')
            wincmd w
        elseif str2nr(system("tmux display -p '#{window_panes}'")) > 1
            " 나가기 전에 첫 번째 vim 창으로 돌려놓음 → 돌아왔을 때 처음 창부터 다시 순환
            wincmd t
            call system('tmux select-pane -t :.+')
        else
            wincmd w
        endif
    endfunction

    " Ctrl+w 다음 키를 시간 제한 없이 기다림 (vim 기본 동작과 동일)
    function! s:CtrlW()
        let l:key = getcharstr()
        if l:key ==# 'w' || l:key ==# "\<C-w>"
            call s:CycleWindow()
        elseif l:key !=# "\<Esc>"
            execute 'wincmd ' . l:key
        endif
    endfunction
    nnoremap <silent> <C-w> :<C-u>call <SID>CtrlW()<CR>
endif
```
> - `nnoremap <C-w>w ...` 방식은 쓰지 말 것 (1초 timeout 문제).
> - `getcharstr()`는 vim 8.2.3xxx 이상 필요. 구버전이면 `nr2char(getchar())`로 대체.
> - **이미 실행 중인 vim은 재시작해야 적용**된다.

> - **`wincmd t`가 꼭 필요하다** (2026-10-03 수정). 없으면 vim을 `:vsplit`한 뒤 마지막 vim 창에서 tmux로 나갔다가 돌아왔을 때 커서가 그대로 마지막 창에 있어서, 다음 `Ctrl+w w`가 또 바로 tmux로 나가 버림 → 첫 번째 vim 창으로 다시는 못 감. 확인 순서: vim창 1 → 2 → tmux 터미널 → vim창 1 → 2 …

### 4-4. 동작 검증 (자동 테스트)
`tmux send-keys`는 tmux 키 바인딩을 **거치지 않으므로** tmux 쪽 테스트에는 쓸 수 없다.
실제 클라이언트를 붙이고 fifo로 원시 키 바이트(`\027` = Ctrl+w)를 넣어야 정확히 테스트된다:
```bash
SP=<스크래치패드>; rm -f $SP/kbd; mkfifo $SP/kbd
tmux new-session -d -s cwtest -x 160 -y 40 "vim"; sleep 1; tmux split-window -h -t cwtest 'bash'; sleep 0.5
(script -qfc "tmux attach -t cwtest" /dev/null < $SP/kbd >/dev/null 2>&1) &
exec 7>$SP/kbd; sleep 1.5
a(){ tmux display -p -t cwtest '#{pane_index}:#{pane_current_command}'; }
echo "start -> $(a)"
for g in 0.1 0.5 2; do for i in 1 2; do printf '\027' >&7; sleep $g; printf 'w' >&7; sleep 1.2; echo "C-w (gap $g) w -> $(a)"; done; done
exec 7>&-; tmux kill-session -t cwtest; rm -f $SP/kbd
```
기대 결과: `1:bash`와 `0:vim`이 번갈아 나와야 한다 (간격 2초에서도).
> 주의: `script`의 stdin이 비어 있으면(EOF) tmux에 Ctrl+D가 전달되어 bash 창이 닫힌다. 반드시 fifo를 열어둔 채로 테스트할 것.

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

`~/.bashrc` 맨 아래에 없으면 추가:
```bash
# tmux 4-pane layout
alias t4='tmux new-session \; split-window -h \; split-window -v \; select-pane -t 0 \; split-window -v \; select-layout tiled'
alias v='tmux split-window -h -c "$PWD"'   # 좌우 분할
alias h='tmux split-window -v -c "$PWD"'   # 상하 분할
```
> - `t4`: tmux 세션을 새로 만들면서 2×2로 4분할한다. **tmux 밖에서** 실행한다.
> - `v` / `h`: 현재 창을 분할한다. 새 창은 현재 폴더에서 시작한다. **tmux 안에서만** 동작한다 (밖에서는 에러).
> - 이름 규칙은 vim의 `:vsplit`(좌우) / `:split`(상하)과 같다. tmux 옵션 이름(`-h`=좌우, `-v`=상하)과는 반대이니 헷갈리지 말 것.

검증:
```bash
bash -ic 'alias t4 v h'
# → 세 alias가 모두 출력되면 성공
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
}```
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
```
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
- 동작: `~/.mdview/mdview.py`가 md 내용 + 렌더러(marked, github-markdown-css, highlight.js)를 **HTML 한 파일에 모두 넣어** Windows `%TEMP%\mdview\이름.html`로 만들고 `cmd.exe /c start`로 연다 → 인터넷 없이 동작, 저장소 폴더에 파일이 안 생김.
- 밝은/어두운 색은 Windows 테마를 따라간다. 코드 블록 ` ```verilog ` / ` ```v ` / ` ```sv `는 Verilog 색으로 나온다. md 안의 상대 경로 그림도 보인다 (`<base>`를 md 폴더로 지정).
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

### 17-2. `~/.bashrc`의 `pdf()` 아래에 추가
```bash
# ==========================================
#  md [이름] : 현재 폴더의 Markdown을 VS Code 미리보기처럼 브라우저로 보기
#   - md            → 현재 폴더의 .md 전부
#   - md 이름       → 현재 폴더의 "이름" / "이름.md" (확장자 생략 가능)
#   - md 폴더명     → 그 폴더 안의 .md 전부
#   - ~/.mdview/mdview.py 가 Windows 임시 폴더(%TEMP%\mdview)에 HTML을 만들어 기본 브라우저로 염
# ==========================================
md() {
    local target="${1:-.}" files=() f c out dir
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
    dir=$(wslpath "$(cd /mnt/c && cmd.exe /c echo %TEMP% 2>/dev/null | tr -d '\r')")/mdview || return 1
    for f in "${files[@]}"; do
        f=$(realpath "$f")
        out="$dir/$(basename "${f%.*}").html"
        python3 ~/.mdview/mdview.py "$f" "$out" || return 1
        echo "열기: $f"
        (cd /mnt/c && cmd.exe /c start "" "$(wslpath -w "$out")")
    done
}
```
> - 파일 이름에 공백이 있으면 따옴표로 감싼다: `md "회의 메모"`
> - md 파일을 고친 뒤에는 `md 이름`을 다시 실행하면 새 내용으로 열린다 (브라우저 새로고침만으로는 안 바뀜).

검증:
```bash
bash -ic 'type -t md; md 없는파일; echo "exit=$?"'
# → function, "없음" 안내 메시지, exit=1
```
실제 사용: `cd <저장소>/ubuntu-terminal-setup && md terminal-setup` → 브라우저에 제목·표·코드 블록이 VS Code 미리보기처럼 보이는지 사용자에게 확인받는다.
적용: `source ~/.bashrc` (이미 열린 창에서는 이걸 실행해야 함)

### 17-3. vim `:MdLive`: 편집하면서 실시간 미리보기
vim에서 md를 고치는 동안 브라우저 미리보기가 **입력하는 대로 바로** 바뀐다 (`:w` 저장 안 해도 됨). 브라우저는 vim 커서가 있는 줄을 따라 스크롤된다 (VS Code 미리보기처럼).
- 동작: vim이 입력·커서 이동 때마다 버퍼 내용을 `~/.mdview/live/<vim pid>_<버퍼번호>.md`(+ `.pos`에 커서 줄)에 쓰고, `mdview.py serve`가 `http://localhost:<빈 포트>/`로 브라우저에 바로 보낸다 (SSE). 원본 md 파일은 건드리지 않는다.
- 서버는 vim job이라 `:MdLiveStop`, 버퍼 닫기, vim 종료 때 같이 꺼진다. 꺼지면 브라우저 탭 제목에 `(연결 끊김)`이 붙는다.
- md 안의 상대 경로 그림은 서버가 md 폴더 아래 파일만 보내준다 (`127.0.0.1`에서만 열림).
- 키 매핑은 추가하지 않는다 (명령만). 미리보기를 켠 버퍼에서만 동작하고, 다른 파일 편집에는 영향 없음.

`~/.vimrc` 맨 아래에 추가 (17-1의 `mdview.py`가 `serve` 기능이 있는 최신 버전이어야 함):
```vim
" ==========================================
"  :MdLive : 편집 중인 md 를 브라우저에서 실시간 미리보기 (VS Code 처럼)
" ==========================================
" 입력할 때마다 버퍼 내용을 ~/.mdview/live/ 에 쓰면 mdview.py 서버가 브라우저로 바로 보냄 (:w 안 해도 됨)
" 브라우저는 vim 커서 위치를 따라 스크롤. :MdLiveStop 또는 버퍼/vim 을 닫으면 서버 종료
function! s:MdLivePush(force)
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
function! s:MdLiveUrl(d, ch, msg)
    let a:d.url = a:msg
    echo 'MdLive: ' . a:msg . ' (브라우저에서 열림, 끄기 :MdLiveStop)'
endfunction
function! s:MdLiveStop(buf)
    let l:d = getbufvar(a:buf, 'mdlive', {})
    if empty(l:d) | return | endif
    call job_stop(l:d.job)
    call delete(l:d.file) | call delete(l:d.file . '.pos')
    call setbufvar(a:buf, 'mdlive', {})
    execute 'autocmd! mdlive * <buffer=' . a:buf . '>'
endfunction
function! s:MdLiveStart()
    if !empty(get(b:, 'mdlive', {})) && job_status(b:mdlive.job) ==# 'run'
        echo 'MdLive: 이미 실행 중 ' . b:mdlive.url | return
    endif
    call mkdir(expand('~/.mdview/live'), 'p')
    let b:mdlive = {'file': expand('~/.mdview/live/') . getpid() . '_' . bufnr() . '.md', 'tick': -1, 'line': -1, 'url': ''}
    call s:MdLivePush(1)
    let b:mdlive.job = job_start(['python3', expand('~/.mdview/mdview.py'), 'serve',
        \ b:mdlive.file, expand('%:p:h'), expand('%:t')],
        \ {'out_cb': function('s:MdLiveUrl', [b:mdlive]), 'err_io': 'null'})
    augroup mdlive
        autocmd! * <buffer>
        autocmd TextChanged,TextChangedI,CursorMoved,CursorMovedI <buffer> call s:MdLivePush(0)
        autocmd BufUnload <buffer> call s:MdLiveStop(str2nr(expand('<abuf>')))
    augroup END
endfunction
command! MdLive call s:MdLiveStart()
command! MdLiveStop call s:MdLiveStop(bufnr())
```
> - **이미 실행 중인 vim에는 적용되지 않는다.** vim을 새로 열도록 안내한다.
> - 브라우저 창을 Windows에서 터미널 옆에 놓고 쓰면 된다 (`Win+←` / `Win+→`로 화면 반씩).

검증 (별도 tmux 서버 + 가짜 `cmd.exe`로 브라우저를 띄우지 않고 확인):
```bash
SP=<스크래치패드>; mkdir -p $SP/fakebin; rm -f $SP/open.log
printf '#!/bin/sh\necho "$@" >> %s/open.log\n' $SP > $SP/fakebin/cmd.exe; chmod +x $SP/fakebin/cmd.exe
printf '# 테스트\n\n첫 문단\n' > $SP/test.md
T="tmux -L mdtest"
$T new-session -d -s m -x 120 -y 30 "env PATH=\"$SP/fakebin:\$PATH\" vim $SP/test.md"; sleep 1.5
$T send-keys -t m ':MdLive' Enter; sleep 1.5
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

`homework/interview/` 폴더(`inter_view.md` + 토론 규칙 `CLAUDE.md`)에서만 Claude를 실행해서 토론 세션을 하나로 유지한다.
`claude -c`는 **현재 폴더**의 마지막 대화를 이어 열기 때문에, 전용 폴더에서 실행하면 다른 작업 세션과 섞이지 않는다.

사전 확인: `type -t iv` → 출력이 없어야 한다. `homework/interview/` 폴더가 있어야 한다 (저장소에 포함).
경로는 PC마다 다를 수 있으니, 다른 PC에서는 `D`를 실제 경로로 바꾼다.

`~/.bashrc` 맨 아래에 없으면 추가:
```bash
# iv : 면접 포트폴리오 토론 전용 Claude 세션 (homework/interview 폴더)
#   처음이면 'interview' 이름으로 새 세션, 이후로는 그 폴더의 마지막 대화를 이어서 열기
iv() {
    local D=/mnt/c/26_AI_CAMP/System_Verilog/homework/interview
    local S="$HOME/.claude/projects/$(echo "$D" | sed 's#[/_]#-#g')"
    cd "$D" || return
    if ls "$S"/*.jsonl >/dev/null 2>&1; then
        claude -c --add-dir .. "$@"
    else
        claude -n interview --add-dir .. "$@"
    fi
}
```
- `--add-dir ..`: 상위 `homework/`의 숙제 PDF, `homework.md`를 권한 확인 없이 읽기 위함
- Claude Code는 세션 기록을 `~/.claude/projects/<경로의 / 와 _ 를 - 로 바꾼 이름>/`에 저장 → 그 폴더에 기록이 있으면 이어 열기

검증:
```bash
bash -ic 'type -t iv'
# → function
```
적용: `source ~/.bashrc`

---

## 최종 검증 체크리스트

- [ ] Windows Terminal 재시작 후 배경이 Gruvbox 갈색(#282828), 글꼴이 D2Coding
- [ ] `vim` 실행 시 Gruvbox 테마 (`:echo g:colors_name` → `gruvbox`)
- [ ] vim에서 `:vert term` 연 터미널도 Gruvbox 색 (짙은 파란색 없음), 프롬프트/`ls` 색이 바깥 터미널과 동일
- [ ] tmux 하단 상태바가 갈색 바탕 + 노란 세션명 + 주황 현재 창
- [ ] tmux 안에서 `Ctrl+b |`로 분할 → `Ctrl+w w`로 vim ↔ 터미널 이동 (4-4 테스트 통과)
- [ ] `Ctrl+h/j/k/l`로도 이동 가능
- [ ] `ls` 시 폴더가 연한 하늘색
- [ ] `cd **` + `Tab` 으로 Gruvbox 색의 폴더 검색 목록이 뜸
- [ ] `Ctrl+q` 로 폴더 검색 목록이 뜨고, 선택하면 바로 그 폴더로 이동
- [ ] 새 창의 프롬프트가 `.../상위폴더/현재폴더$` 형태 (사용자@컴퓨터 없음)
- [ ] vim으로 파일을 연 상태에서 그 폴더에 `.swp`가 안 생기고 `~/.vim/swap/`에 생김
- [ ] `t4` 입력 시 4분할 tmux 세션이 열리고, 그 안에서 `v` / `h`로 좌우 / 상하 분할됨
- [ ] 하위 폴더에서 `git status` 시 추적 안 된 폴더가 `./`가 아니라 폴더명으로 보임
- [ ] `watch_html 파일.html` 로 Windows 브라우저에 HTML이 열림
- [ ] `viva` 입력 시 `/mnt/c/26_AI_CAMP/System_Verilog`로 이동
- [ ] PPT 폴더에서 `ppt` / `ppt 파일` / `ppt 폴더` 로 Windows PowerPoint에 PPT가 열림
- [ ] vim으로 `.v` 파일을 열고 입력하면 후보 목록이 뜨고, `:w` 저장 후에만 문법 오류 줄에 `>>` + 주석 메시지가 나옴
- [ ] PDF 폴더에서 `pdf` / `pdf 파일` / `pdf 폴더` 로 Windows에서 PDF가 열림
- [ ] `theme` 실행 시 `* catppuccin`, 터미널·vim·tmux가 Catppuccin Mocha 색
- [ ] md 폴더에서 `md` / `md 파일` / `md 폴더` 로 브라우저에 VS Code 미리보기 모양으로 열림
- [ ] vim에서 md 열고 `:MdLive` → 브라우저가 열리고, 입력하는 대로(`:w` 없이) 미리보기가 바뀌고 커서를 따라 스크롤됨
- [ ] `iv` 입력 시 `homework/interview`로 이동해서 Claude가 열리고, 두 번째부터는 이전 토론이 이어짐

## 사용자에게 전달할 사용법 요약

| 동작 | 키 |
|---|---|
| 좌우 분할 / 위아래 분할 | `Ctrl+b` 다음 `\|` / `Ctrl+b` 다음 `-` |
| 셸 명령으로 좌우 / 위아래 분할 (tmux 안에서) | `v` / `h` |
| tmux 4분할 세션 한 번에 열기 | `t4` |
| 창 순서대로 이동 (vim 창 → tmux 창) | `Ctrl+w w` |
| 방향으로 이동 | `Ctrl+h/j/k/l` 또는 `Ctrl+w` 다음 `h/j/k/l` |
| 창 확대/복원 | `Ctrl+b` 다음 `z` |
| 셸 화면 지우기 | `Ctrl+b` 다음 `Ctrl+l` (또는 `clear`) |
| 폴더 검색해서 바로 이동 | `Ctrl+q` (또는 `cd **` + `Tab`) |
| Verilog 자동완성 (입력 모드) | `↑`/`↓`로 고르고 `Tab`으로 완성 (선택 없이 `Tab` = 첫 후보) |
| HTML 파일을 브라우저로 열기 | `watch_html "파일명.html"` |
| System_Verilog 작업 폴더로 이동 | `viva` |
| PPT 파일(또는 폴더 안 PPT 전부)을 PowerPoint로 열기 | `ppt` / `ppt "파일명"` / `ppt "폴더명"` |
| PDF 파일(또는 폴더 안 PDF 전부) 열기 | `pdf` / `pdf "파일명"` / `pdf "폴더명"` |
| Markdown을 VS Code 미리보기처럼 보기 | `md` / `md "파일명"` / `md "폴더명"` |
| vim에서 md 편집하면서 실시간 미리보기 | `:MdLive` (끄기 `:MdLiveStop`) |
| 면접 포트폴리오 토론 세션 열기 (이어서) | `iv` |
| 테마 바꾸기 (터미널·vim·tmux 같이) | `theme` (목록) / `theme next` / `theme 이름` (catppuccin, onedark, everforest, gruvbox …) |
| vim 바꾸기·검색에서 단어 자동완성 | `:%s/w` 또는 `/w` 입력 후 `Tab` (계속 누르면 다음 후보) |

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
- md: `~/.bashrc`의 "md" 섹션 삭제, `~/.vimrc`의 ":MdLive" 섹션 삭제, `rm -rf ~/.mdview` (만들어진 HTML은 Windows `%TEMP%\mdview`)
- Verilog 편집 보조: `rm -rf ~/.vim/pack/plugins/start/ale ~/.vim/dict`, `~/.vimrc`의 "Verilog 편집 보조" 섹션 삭제
- 면접 토론 세션: `~/.bashrc`의 `iv()` 함수 삭제 (또는 `~/.bashrc.bak_iv` 복원)
