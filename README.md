# System Verilog

```
System_Verilog/
├── vfile/
│   ├── lib/                  # 재사용 모듈 라이브러리
│   ├── source_file/          # 날짜·주제별 top 모듈
│   ├── sim_file/             # 테스트벤치
│   ├── constraint/           # Basys-3 XDC 제약 파일
│   └── module_information.html  # 모듈 설명 페이지
├── homework/
│   └── 8bit_fnd_clk_project/ # 과제: 8bit 가산기 + FND 표시
│       ├── sim_file/         # 과제용 테스트벤치
│       └── fault/            # 결함 주입(Fault Injection) RTL
└── ubuntu-terminal-setup/    # WSL 터미널 환경 설정 가이드
```

## 개발 환경

| 항목 | 내용 |
|---|---|
| 합성/시뮬레이션 | Xilinx Vivado 2020.2 |
| 보드 | Digilent Basys-3 (Artix-7) |
| 편집 환경 | WSL2 Ubuntu + vim + tmux |

- [x] WSL2 Ubuntu 터미널 셋업 → [가이드](ubuntu-terminal-setup/terminal-setup.md)
- [x] GitHub 연동
