# WSL 터미널 환경 설정 가이드 (Gruvbox + tmux + vim)

> **Claude Code에게:** 이 문서는 다른 PC에서 만든 설정을 새 PC에 똑같이 재현하기 위한 작업 지시서다.
> 아래 순서대로 진행하되, 각 단계의 **사전 확인**으로 이미 적용된 부분은 건너뛰고(중복 추가 금지),
> 설정 파일을 수정하기 전에는 반드시 `.bak` 백업을 만든다. 모든 단계가 끝나면 **최종 검증**을 실행하고 결과를 사용자에게 보고한다.

## 목표 요약

| # | 목표 | 수정 대상 |
|---|---|---|
| 1 | Windows Terminal 색 구성표를 **Gruvbox Dark**로, 글꼴을 **D2Coding**으로 변경 | Windows Terminal `settings.json`, Windows 글꼴 |
| 2 | vim 테마를 **Gruvbox**로 변경 | `~/.vimrc`, `~/.vim/pack/` |
| 3 | tmux 상태바/테두리를 **Gruvbox** 색으로, 트루컬러 활성화 | `~/.tmux.conf` |
| 4 | **`Ctrl+w w`로 vim 창과 tmux 창(터미널)을 구분 없이 이동** (셸의 `Ctrl+w` 단어 지우기는 포기) | `~/.tmux.conf`, `~/.vimrc`, vim-tmux-navigator |
| 5 | `ls`의 **폴더 색**을 짙은 파랑 → Gruvbox 노랑(#fabd2f)으로 변경 | `~/.bashrc` |
| 6 | **fzf**로 폴더 검색 이동 (`cd **<Tab>`) | `~/.fzf`, `~/.bashrc` |
| 7 | 프롬프트를 짧게: `사용자@컴퓨터:` 제거, 경로는 **마지막 폴더 2개**만 | `~/.bashrc` |
| 8 | vim swap 파일(`.swp`)을 작업 폴더가 아닌 `~/.vim/swap/`에 저장 | `~/.vimrc` |
| 9 | tmux 분할 alias: `t4`(한 번에 4분할), `v`(좌우 분할), `h`(상하 분할) | `~/.bashrc` |
| 10 | 하위 폴더에서 `git status` 해도 폴더명이 보이게 (`./` 대신 `project_0930/`) | `~/.gitconfig` |

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

## 5단계. `ls` 폴더 색 변경 (짙은 파랑 → Gruvbox 노랑)

`~/.bashrc`에 없으면 맨 아래에 추가 (기본 `dircolors` 설정 줄보다 **뒤**에 있어야 함):
```bash
# ==========================================
#  ls 색상 (Gruvbox)
# ==========================================
# 폴더: 굵은 노란색 (#fabd2f), /mnt/c 폴더의 초록 배경도 제거
export LS_COLORS="${LS_COLORS}:di=01;38;2;250;189;47:ow=01;38;2;250;189;47:tw=01;38;2;250;189;47"
```
- `di`=일반 폴더, `ow`=다른 사용자 쓰기 가능 폴더(`/mnt/c` 아래 Windows 폴더), `tw`=sticky+쓰기 가능 폴더
- 색 바꾸려면 RGB 3개 숫자만 교체: 노랑 `250;189;47` / 주황 `254;128;25` / 연파랑 `131;165;152` / 청록 `142;192;124` / 연두 `184;187;38`

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
# → ^[[01;38;2;250;189;47mdir 가 보이면 성공
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

## 최종 검증 체크리스트

- [ ] Windows Terminal 재시작 후 배경이 Gruvbox 갈색(#282828), 글꼴이 D2Coding
- [ ] `vim` 실행 시 Gruvbox 테마 (`:echo g:colors_name` → `gruvbox`)
- [ ] vim에서 `:vert term` 연 터미널도 Gruvbox 색 (짙은 파란색 없음), 프롬프트/`ls` 색이 바깥 터미널과 동일
- [ ] tmux 하단 상태바가 갈색 바탕 + 노란 세션명 + 주황 현재 창
- [ ] tmux 안에서 `Ctrl+b |`로 분할 → `Ctrl+w w`로 vim ↔ 터미널 이동 (4-4 테스트 통과)
- [ ] `Ctrl+h/j/k/l`로도 이동 가능
- [ ] `ls` 시 폴더가 노란색
- [ ] `cd **` + `Tab` 으로 Gruvbox 색의 폴더 검색 목록이 뜸
- [ ] `Ctrl+q` 로 폴더 검색 목록이 뜨고, 선택하면 바로 그 폴더로 이동
- [ ] 새 창의 프롬프트가 `.../상위폴더/현재폴더$` 형태 (사용자@컴퓨터 없음)
- [ ] vim으로 파일을 연 상태에서 그 폴더에 `.swp`가 안 생기고 `~/.vim/swap/`에 생김
- [ ] `t4` 입력 시 4분할 tmux 세션이 열리고, 그 안에서 `v` / `h`로 좌우 / 상하 분할됨
- [ ] 하위 폴더에서 `git status` 시 추적 안 된 폴더가 `./`가 아니라 폴더명으로 보임

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

- vim 이동 키는 **일반(Normal) 모드**에서만 동작 → 입력 모드면 `Esc` 먼저
- Claude Code도 tmux 창 안에서 실행해야 같은 키로 이동 가능

## 되돌리기
- Windows Terminal: `settings.json.bak` 복원
- vim: `~/.vimrc.bak` 복원, `rm -rf ~/.vim/pack/themes/start/gruvbox ~/.vim/pack/plugins/start/vim-tmux-navigator`
- tmux: `~/.tmux.conf`에서 해당 섹션 삭제 후 `tmux source-file ~/.tmux.conf`
- ls 색: `~/.bashrc`의 "ls 색상 (Gruvbox)", "굵은 색 → 밝은 색 코드로 통일" 섹션 삭제
- 프롬프트: `~/.bashrc`의 `PROMPT_DIRTRIM=2` 줄 삭제, PS1에 `\u@\h:` 다시 추가 (또는 `~/.bashrc.bak` 복원)
- vim swap 위치: `~/.vimrc`의 `set directory=~/.vim/swap//` 줄 삭제
- tmux 분할 alias: `~/.bashrc`의 `alias t4`, `alias v`, `alias h` 줄 삭제
- git status 경로: `git config --global --unset status.relativePaths`
