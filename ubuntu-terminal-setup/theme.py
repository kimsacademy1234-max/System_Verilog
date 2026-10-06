#!/usr/bin/env python3
# theme : Windows Terminal 색 구성표 + vim colorscheme + tmux 상태바를 한 번에 바꾸기
#   theme            → 현재 테마와 목록
#   theme 이름       → 그 테마 적용 (예: theme nord)
#   theme next/prev  → 목록에서 다음/이전 테마
import glob, json, os, re, subprocess, sys

HOME = os.path.expanduser('~')
STATE = f'{HOME}/.theme/current'
VIM_OUT = f'{HOME}/.vim/theme.vim'
TMUX_OUT = f'{HOME}/.tmux/theme.conf'
# Windows Terminal 설정 파일 (Windows 사용자명은 PC마다 달라서 자동으로 찾음)
WT = (glob.glob('/mnt/c/Users/*/AppData/Local/Packages/Microsoft.WindowsTerminal_*/LocalState/settings.json') or [''])[0]

# 16색 순서: black red green yellow blue purple cyan white + bright 8색
T = {
 'catppuccin': dict(title='Catppuccin Mocha', bg='#1E1E2E', fg='#CDD6F4', cursor='#F5E0DC', sel='#585B70',
   ansi=['#45475A','#F38BA8','#A6E3A1','#F9E2AF','#89B4FA','#F5C2E7','#94E2D5','#BAC2DE',
         '#585B70','#F38BA8','#A6E3A1','#F9E2AF','#89B4FA','#F5C2E7','#94E2D5','#A6ADC8'],
   vim='colorscheme catppuccin_mocha',
   tmux=dict(bar='#181825', text='#CDD6F4', dim='#6C7086', left='#89B4FA', cur='#CBA6F7', on='#1E1E2E', box='#313244', msg='#F9E2AF')),
 'tokyonight': dict(title='Tokyo Night', bg='#1A1B26', fg='#C0CAF5', cursor='#C0CAF5', sel='#33467C',
   ansi=['#15161E','#F7768E','#9ECE6A','#E0AF68','#7AA2F7','#BB9AF7','#7DCFFF','#A9B1D6',
         '#414868','#F7768E','#9ECE6A','#E0AF68','#7AA2F7','#BB9AF7','#7DCFFF','#C0CAF5'],
   vim="let g:tokyonight_style = 'night'\nlet g:tokyonight_enable_italic = 0\ncolorscheme tokyonight",
   tmux=dict(bar='#16161E', text='#A9B1D6', dim='#565F89', left='#7AA2F7', cur='#BB9AF7', on='#15161E', box='#292E42', msg='#E0AF68')),
 'onedark': dict(title='One Dark', bg='#282C34', fg='#ABB2BF', cursor='#528BFF', sel='#3E4451',
   ansi=['#282C34','#E06C75','#98C379','#E5C07B','#61AFEF','#C678DD','#56B6C2','#ABB2BF',
         '#5C6370','#E06C75','#98C379','#E5C07B','#61AFEF','#C678DD','#56B6C2','#FFFFFF'],
   vim='colorscheme onedark',
   tmux=dict(bar='#21252B', text='#ABB2BF', dim='#5C6370', left='#61AFEF', cur='#C678DD', on='#282C34', box='#3E4451', msg='#E5C07B')),
 'nord': dict(title='Nord', bg='#2E3440', fg='#D8DEE9', cursor='#D8DEE9', sel='#434C5E',
   ansi=['#3B4252','#BF616A','#A3BE8C','#EBCB8B','#81A1C1','#B48EAD','#88C0D0','#E5E9F0',
         '#4C566A','#BF616A','#A3BE8C','#EBCB8B','#81A1C1','#B48EAD','#8FBCBB','#ECEFF4'],
   vim='colorscheme nord',
   tmux=dict(bar='#3B4252', text='#D8DEE9', dim='#616E88', left='#88C0D0', cur='#81A1C1', on='#2E3440', box='#434C5E', msg='#EBCB8B')),
 'dracula': dict(title='Dracula', bg='#282A36', fg='#F8F8F2', cursor='#F8F8F2', sel='#44475A',
   ansi=['#21222C','#FF5555','#50FA7B','#F1FA8C','#BD93F9','#FF79C6','#8BE9FD','#F8F8F2',
         '#6272A4','#FF6E6E','#69FF94','#FFFFA5','#D6ACFF','#FF92DF','#A4FFFF','#FFFFFF'],
   vim="colorscheme dracula\nhighlight Normal guibg=#282A36\nhighlight EndOfBuffer guibg=#282A36",
   tmux=dict(bar='#44475A', text='#F8F8F2', dim='#6272A4', left='#BD93F9', cur='#FF79C6', on='#282A36', box='#44475A', msg='#F1FA8C')),
 'everforest': dict(title='Everforest', bg='#2D353B', fg='#D3C6AA', cursor='#D3C6AA', sel='#475258',
   ansi=['#343F44','#E67E80','#A7C080','#DBBC7F','#7FBBB3','#D699B6','#83C092','#D3C6AA',
         '#859289','#E67E80','#A7C080','#DBBC7F','#7FBBB3','#D699B6','#83C092','#D3C6AA'],
   vim="let g:everforest_background = 'medium'\nlet g:everforest_better_performance = 1\ncolorscheme everforest",
   tmux=dict(bar='#343F44', text='#D3C6AA', dim='#859289', left='#A7C080', cur='#E69875', on='#2D353B', box='#475258', msg='#DBBC7F')),
 'rosepine': dict(title='Rosé Pine', bg='#191724', fg='#E0DEF4', cursor='#524F67', sel='#403D52',
   ansi=['#26233A','#EB6F92','#31748F','#F6C177','#9CCFD8','#C4A7E7','#EBBCBA','#E0DEF4',
         '#6E6A86','#EB6F92','#31748F','#F6C177','#9CCFD8','#C4A7E7','#EBBCBA','#E0DEF4'],
   vim='colorscheme rosepine',
   tmux=dict(bar='#1F1D2E', text='#E0DEF4', dim='#6E6A86', left='#C4A7E7', cur='#EBBCBA', on='#191724', box='#26233A', msg='#F6C177')),
 # 원래 쓰던 테마 (배경만 검은색)
 'gruvbox': dict(title='Gruvbox Dark', bg='#000000', fg='#EBDBB2', cursor='#EBDBB2', sel='#665C54',
   ansi=['#282828','#CC241D','#98971A','#D79921','#458588','#B16286','#689D6A','#A89984',
         '#928374','#FB4934','#B8BB26','#FABD2F','#83A598','#D3869B','#8EC07C','#EBDBB2'],
   vim=("let g:gruvbox_contrast_dark = 'medium'\n"
        "augroup BlackBackground\n    autocmd!\n"
        "    autocmd ColorScheme gruvbox highlight Normal guibg=#000000 | highlight EndOfBuffer guibg=#000000 | highlight SignColumn guibg=#000000\n"
        "augroup END\ncolorscheme gruvbox"),
   tmux=dict(bar='#3C3836', text='#EBDBB2', dim='#A89984', left='#D79921', cur='#FE8019', on='#282828', box='#504945', msg='#FABD2F')),
}
ORDER = ['catppuccin', 'tokyonight', 'onedark', 'nord', 'dracula', 'everforest', 'rosepine', 'gruvbox']
WT_KEYS = ['black','red','green','yellow','blue','purple','cyan','white',
           'brightBlack','brightRed','brightGreen','brightYellow','brightBlue','brightPurple','brightCyan','brightWhite']


def current():
    try:
        return open(STATE).read().strip()
    except OSError:
        return 'gruvbox'


def write_vim(t):
    ansi = ', '.join(f"'{c.lower()}'" for c in t['ansi'])
    s = (f"\" 자동 생성 파일 (theme 명령) : {t['title']}\n"
         "augroup BlackBackground\n    autocmd!\naugroup END\n"
         "set background=dark\n"
         f"{t['vim']}\n"
         f"let g:terminal_ansi_colors = [{ansi}]\n")
    os.makedirs(os.path.dirname(VIM_OUT), exist_ok=True)
    open(VIM_OUT, 'w').write(s)


def write_tmux(t):
    c = t['tmux']
    s = f"""# 자동 생성 파일 (theme 명령) : {t['title']}
set -g status-style "bg={c['bar']},fg={c['text']}"
set -g status-left "#[bg={c['left']},fg={c['on']},bold] #S #[default] "
set -g status-right "#[fg={c['dim']}]%Y-%m-%d #[bg={c['box']},fg={c['text']}] %H:%M "
set -g status-left-length 30
set -g window-status-format "#[fg={c['dim']}] #I:#W "
set -g window-status-current-format "#[bg={c['cur']},fg={c['on']},bold] #I:#W "
set -g pane-border-style "fg={c['box']}"
set -g pane-active-border-style "fg={c['left']}"
set -g message-style "bg={c['box']},fg={c['msg']}"
set -g mode-style "bg={c['box']},fg={c['text']}"
"""
    os.makedirs(os.path.dirname(TMUX_OUT), exist_ok=True)
    open(TMUX_OUT, 'w').write(s)
    subprocess.run(['tmux', 'source-file', TMUX_OUT], stderr=subprocess.DEVNULL)


def write_wt(t):
    raw = open(WT, encoding='utf-8').read()
    d = json.loads(re.sub(r'^\s*//.*$', '', raw, flags=re.M))
    if not os.path.exists(WT + '.bak_theme'):
        open(WT + '.bak_theme', 'w', encoding='utf-8').write(raw)
    scheme = {'name': t['title'], 'background': t['bg'], 'foreground': t['fg'],
              'cursorColor': t['cursor'], 'selectionBackground': t['sel']}
    scheme.update(dict(zip(WT_KEYS, t['ansi'])))
    d['schemes'] = [s for s in d.get('schemes', []) if s.get('name') != t['title']] + [scheme]
    d['profiles'].setdefault('defaults', {})['colorScheme'] = t['title']
    open(WT, 'w', encoding='utf-8').write(json.dumps(d, indent=4, ensure_ascii=False))


def apply(name):
    t = T[name]
    write_vim(t); write_tmux(t); write_wt(t)
    open(STATE, 'w').write(name)
    i = ORDER.index(name) + 1
    print(f"[{i}/{len(ORDER)}] {t['title']} 적용됨  (터미널·tmux 바로 반영, 열린 vim 은 :so ~/.vim/theme.vim)")


def main():
    a = sys.argv[1] if len(sys.argv) > 1 else ''
    cur = current()
    if a in ('next', 'prev'):
        i = ORDER.index(cur) if cur in ORDER else -1
        apply(ORDER[(i + (1 if a == 'next' else -1)) % len(ORDER)])
    elif a in T:
        apply(a)
    else:
        if a:
            print(f"없는 테마: {a}")
        for n in ORDER:
            print(f"  {'*' if n == cur else ' '} {n:<11} {T[n]['title']}")
        print("사용법: theme 이름 | theme next | theme prev")


if __name__ == '__main__':
    main()
