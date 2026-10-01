# FPGA 프로젝트 보고서 작성 지침

> **Claude에게:** 새 FPGA/Verilog 프로젝트 보고서를 요청받으면 이 지침대로 만든다.
> 지난 보고서(`report/정안성_HW1_8bit_adder.html`, 16:9 슬라이드 18장)의 HTML/CSS 구조를 그대로 재사용하고 **내용만 새 프로젝트로 바꾼다.**
> 사용자가 준 메모(`report-setup.md` 등)를 **그대로 옮기지 말고 보고서 문장으로 재구성**한다.

---

## 1. 작업 순서 (반드시 이 순서)

1. **자료 수집** — 소스(`*.v`), 테스트벤치, XDC, Vivado 리포트(`*.runs/impl_1/*_utilization_placed.rpt`, `*_timing_summary_routed.rpt`, `*_power_routed.rpt`, `runme.log`의 WARNING/CRITICAL), 사용자 PPT(그림·메모)를 먼저 모두 읽는다.
2. **사실 확인** — 보고서에 쓸 수치·핀 번호·경고 메시지는 리포트/로그에서 직접 확인한 값만 쓴다. 추측으로 채우지 않는다.
3. **AI 교차 검증** — 같은 RTL로 별도 self-checking 테스트벤치를 만들어 Verilator(`verilator --binary --timing`)로 돌리고 결과를 보고서에 넣는다. 사용자 파형과 결과가 다르면 "확인 필요" 박스로 표시한다.
4. **그림 준비** — 블록 다이어그램 PNG를 직접 만든다(아래 4장). PPT 안의 그림은 `.pptx`를 zip으로 풀어 `ppt/media/`에서 꺼내 의미 있는 이름으로 `report/images/`에 복사한다.
5. **HTML 슬라이드 작성 → 사용자 검토** — `report/<파일명>.html`(16:9 슬라이드)을 만들어 브라우저로 열어 준다. **PDF는 검토 승인 후에만** 만든다.
6. **PDF 출력** — 승인 후 Chrome headless로 출력한다 (아래 5장).

## 2. 파일 규칙

| 항목 | 규칙 |
|---|---|
| 폴더 | 저장소 루트의 `report/` (없으면 만든다) |
| 파일명 | 사용자가 지정한 이름 그대로. 예: `이름_HW번호_주제.pdf` / 같은 이름의 `.html` |
| 그림 | `report/images/` — 영문 소문자+밑줄 이름 (`block_diagram.png`, `wave_<설명>.png`, `rtl_<모듈>.png`) |
| 작업 파일 | `report/_build/` — 다이어그램 원본 HTML 등. 미리보기용 임시 파일은 끝나면 삭제 |
| 큰 사진 | 12 MB 같은 원본 사진은 Chrome 스크린샷으로 900px 폭 정도로 줄여서 넣는다 |

## 3. 형식: 16:9 슬라이드, 두괄식 (긴 문서형 금지)

> 사용자 피드백(2026-10-01): "너무 길게 적어서 AI 티가 난다. 문서가 길면 보는 사람이 힘들다. PPT로 두괄식 정리."
> → A4 문서형 보고서는 쓰지 않는다. **슬라이드 1장 = 메시지 1개.**

- **제목이 곧 결론.** 슬라이드 제목은 "검증 결과"가 아니라 "전 입력에서 오류 0, 보드에서도 정상 동작"처럼 결론 문장으로 쓴다.
- 제목 아래 회색 한 줄(`lead`)로 근거나 조건을 보충. 본문은 표·그림·숫자 카드 위주, 문장은 짧은 명사형/"~함" 체.
- 2번째 슬라이드는 **SUMMARY**: 핵심 숫자 4개 + "잘 된 것 / 보완할 것" 두 박스. 바쁜 사람은 이 장만 봐도 되게.

### 슬라이드 순서 (기본 틀, 프로젝트에 맞게 조정)
1. 표지 (진한 남색 그라데이션, 제목·부제·이름·날짜·툴/보드)
2. SUMMARY (결론 먼저)
3. 목차 (번호 원형 배지 6개 이내)
4. 개요: 환경 표 + 툴 버전 선택 이유 + 언어 특징
5. 보드·FPGA 설계 흐름 (보드 사진 + RTL→Board 흐름 칩 + 보드 사양 표)
6. 목표 (카드 3개)
7. 블록 다이어그램 (직접 만든 PNG, 슬라이드 거의 전체)
8. 모듈 구성 표 + Vivado RTL Schematic
9. 보드 I/O 매핑 (사용자 PPT 그림 crop + 핀 표)
10. 검증 계획 (TB별 입력 범위·방법 표 + 경계값 카드)
11. 파형 (2×2 그림 + 캡션 한 줄씩)
12. 보드 동작 사진
13. 심화 시나리오 표 (시나리오·방법·예상·상태 태그)
14. AI 교차 검증 표 + 잘한 점/보완할 점
15. 구현 결과 (큰 숫자 카드 + Timing/Power 해석)
16. 트러블슈팅 표 (문제·원인·해결)
17. 결론 (평가 / 아쉬운 점 → 다음에)
18. 부록: 핵심 소스 코드

### AI 티 안 나게
- 줄표(—), "핵심은 ~입니다", "~를 통해 ~을 확인할 수 있었습니다" 같은 상투 표현 금지.
- 한 슬라이드에 굵은 글씨 남발 금지. 설명 문단 3줄 넘으면 표나 카드로 바꾼다.
- 사용자가 PPT에 남긴 질문/메모("이게 맞나?")는 슬라이드에 넣지 말고, 확인한 답을 반영한 뒤 채팅으로 알려준다.

## 4. 블록 다이어그램 만드는 법

- `report/_build/block_diagram.html`에 **인라인 SVG**로 그린다 (PIL·matplotlib·graphviz 없음).
- 위쪽: 최상위 모듈 박스 안에 하위 인스턴스 박스, 왼쪽에 입력(신호명 + 보드 장치), 오른쪽에 출력.
- 아래쪽: 패널 3개 — ① 모듈 계층 트리 ② 중간 모듈 내부 ③ 가장 작은 모듈 내부(진리표 포함).
- 선 색: 입력 파랑 `#2563eb`, 출력 초록 `#16a34a`, **critical path(carry 등) 주황 `#ea580c`** + 범례.
- PNG 변환 (WSL에서):
  ```bash
  CH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"; W=$(wslpath -w report)
  (cd /mnt/c && "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1.5 \
     --window-size=1600,1080 --screenshot="$W\\images\\block_diagram.png" \
     "file:///$(echo "$W\\_build\\block_diagram.html" | sed 's#\\#/#g')")
  ```
- 만든 뒤 PNG를 직접 열어 **글자 겹침**(라벨과 박스 테두리, 화살표 머리)을 확인하고 고친다.

## 5. HTML/PDF 스타일 규칙

- 슬라이드 크기 1280×720px: `.slide{width:1280px;height:720px;page-break-after:always}`, `@page{size:1280px 720px;margin:0}`.
- 글꼴 `'Malgun Gothic'`, 제목 31px, lead 17px, 본문·표 15~16px. 강조색 남색 `#3730a3` 하나 + 상태색(초록 PASS, 주황 확인 필요, 보라 자료 대기).
- 우하단 페이지 번호, 좌상단 섹션 라벨(`1. 개요` 등).
- 사용자 PPT 슬라이드 그림은 PowerShell COM으로 PNG 내보내기 후 CSS `background-position`으로 필요한 부분만 crop (PPT 안 메모 텍스트는 잘라낸다):
  ```powershell
  $app = New-Object -ComObject PowerPoint.Application
  $p = $app.Presentations.Open('<pptx 경로>', $true, $false, $false)   # 읽기 전용, 창 없음
  $p.Slides.Item(3).Export('<출력>.png', 'PNG', 1920, 1080); $p.Close()
  ```
- 검토용 미리보기: 전체 페이지 스크린샷(`--window-size=1312,<슬라이드수×752>`) 후 2장씩 잘라 확인.
- PDF 출력:
  ```bash
  (cd /mnt/c && "$CH" --headless=new --disable-gpu --no-pdf-header-footer \
     --print-to-pdf="$W\\<파일명>.pdf" "file:///$(echo "$W\\<파일명>.html" | sed 's#\\#/#g')")
  ```

## 6. 문장 규칙

- 슬라이드 본문은 짧은 명사형·"~함" 체 (긴 "~합니다" 문단 금지). 한 줄에 한 가지 내용.
- 처음 나오는 용어는 짧게 풀어 쓴다 (예: "전수 검사(exhaustive test) — 입력을 전부 넣어 보는 방식").
- 수치는 단위와 출처(어느 리포트인지)를 함께 쓴다.
- 사용자가 아직 만들지 않은 자료는 지어내지 않고 `todo` 박스로 자리만 잡아 둔다.
- AI가 확인한 부분과 사용자가 직접 한 부분을 구분해서 쓴다.
