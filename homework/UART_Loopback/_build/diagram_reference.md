# UART Loopback — Diagram Reference (for PPT rebuild)

> Source of truth for the block diagram / ASM chart slides in `UART_Loopback_Diagrams_정안성.pptx`.
> When the final presentation deck is built, reuse these slides (copy slide XML or call the functions in `build_diagrams.js`). Do not redraw them from scratch.

## 1. Files

| File | Role |
|---|---|
| `../UART_Loopback_Diagrams_정안성.pptx` | 10 slides, all native PowerPoint shapes (editable) |
| `../UART_Loopback_Diagrams_정안성.pdf` | PDF export of the same deck |
| `build_diagrams.js` | Generator (pptxgenjs 3.12.0). One function per slide |
| `xsim_measure.log` | xsim log that every number in the deck comes from |
| `../sim_file/tb_measure.sv` | Measurement-only TB (sends 0x41, then 0x31 + 0x32 back-to-back) |

Rebuild: `npm install pptxgenjs@3.12.0` in a scratch folder → `node build_diagrams.js out.pptx`.
QA/PDF: PowerPoint COM (`Slides(i).Export` PNG, `SaveAs(path, 32)` PDF), see homeworkguideline §6.

## 2. Slide index → function

| p. | Section | Title | Function | Content |
|---|---|---|---|---|
| 1 | — | Cover + Contents | `slideCover` | 0x41 frame motif, section list |
| 2 | 01 Architecture | uart_loopback: RX Output Feeds TX Directly | `slideBlock` | uart.v block diagram, 4 numbered cards |
| 3 | 01 | Interface: rx_done Doubles as tx_start, tx_busy Left Open | `slideInterface` | Signal / Width / From→To / 역할 table |
| 4 | 01 | top_ascii: Each Received Byte Shifts onto the 4-digit FND | `slideSystem` | top_ascii system (uart_loopback → Ascii_decoder → fnd_decoder → anode_reg → MUX, scan path) |
| 5 | 02 Timing | RX Samples Each Bit at Its Center: 8 Ticks, Then Every 16 | `slideTiming` | F_COUNT derivation chain, 0x41 frame timing, data_reg shift values, xsim result box |
| 6 | 03 ASM Chart | uart_rx ASM: Align to Start Center, Then Sample Every 16 Ticks | `slideRxAsm` | 4-column ASM chart |
| 7 | 03 | uart_rx: 8 + 128 + 16 Ticks from Start Edge to rx_done | `slideRxTable` | state table + 4 cards |
| 8 | 03 | uart_tx ASM: Hold Each Bit for 16 Ticks, LSB First | `slideTxAsm` | 4-column ASM chart |
| 9 | 03 | uart_tx: tx_start Checked Only in IDLE, Bits Held 16 Ticks | `slideTxTable` | state table + 4 cards |
| 10 | 04 Loopback Handshake | Echo Starts 2 Clocks After rx_done, Back-to-Back Margin 0 | `slideHandshake` | clock-level rx_done→tx, frame-level back-to-back |

Mapping to the user's `project_note.pptx` outline: 2. 블록 다이어그램 → p.2–4 · 3. ASM 차트 → p.6–9 · slide "start asm 차트 필요" (RX IDLE→START) → p.6 IDLE/START columns + p.5 · slide "asm 차트 필요" (Data sampling) → p.6 DATA/STOP columns · Tx 동작 slides → p.8–10.

## 3. Design system

- Canvas 1280×720 px (`px/96` = inch), LAYOUT_WIDE. Fonts: 맑은 고딕 (text), Consolas (signals, module names, numbers).
- Chrome: breadcrumb `NN · Section / sub` (11 pt) → English conclusion title (24 pt bold) → section circle (62 px) top-right → footer `정안성 · UART Loopback` + `N / 10`.
- Section accents: 01 `4338CA` · 02 `0F766E` · 03 `7C3AED` · 04 `B45309`.
- Module colors (same on every slide): uart_rx fill `FFF1F2` / line `BE123C` · uart_tx `EFF6FF` / `1D4ED8` · baud_tick_gen `FEF3C7` / `B45309` · uart_loopback(top) `EEF2FF` / `4338CA` · others `F1F5F9` / `475569`. Inline always-blocks of a top = dashed white box.
- Wires: signal blue `1D4ED8`; 1-bit 1.75 pt, 8-bit bus 3.5 pt; branch = filled dot; crossing without dot = no connection; NC = red ✕.
- ASM notation: state box = colored header (state name) + body (unconditional register transfers); decision = diamond; conditional output = rounded box; `←` = update at next clock edge; `_reg` suffix dropped except `data_reg`. Branch labels orange: `1/0` for signals, `T/F` for comparisons.
- ASM layout engine (`colGeom(k)`): column k at L = 40 + 300k, center cx = L+105, loop-back rail at L+294, inter-column gutter at L+14; all exits drop to y=566 and enter the next column's top at y=106; STOP→IDLE returns along y=600; loop-backs join the entry line at y=118 (dot).

## 4. Facts used (code + xsim)

| Item | Value | Source |
|---|---|---|
| F_COUNT | 100,000,000 / 153,600 = 651 (integer) | `baud_tick_gen` |
| b_tick period | 6.51 µs (651 clk) | xsim |
| 1 bit = 16 tick | 104.16 µs (→ 9600.6 bps) | xsim sample interval |
| RX START | 8 tick = 52.08 µs → start-bit center | xsim (156,265 − 104,185 ns) |
| RX first sample | rx fall + 156.245 µs (1.5 bit) | xsim |
| RX DATA | 833.28 µs (16 tick × 8) | xsim |
| RX STOP → rx_done | rx fall + 989.525 µs, pulse 10 ns | xsim |
| data_reg after each sample (0x41) | 80 40 20 10 08 04 82 41 | xsim |
| TX START entry | rx_done + 10 ns; tx falls rx_done + 20 ns | xsim (1,093,705 / 715 / 725 ns) |
| TX start bit | 104.15 µs (10,415 clk, 1 clk short) | xsim |
| Back-to-back (0x31→0x32) | TX STOP→IDLE and 2nd rx_done on the same edge 4,426,825 ns → margin 0 tick | xsim |
| Design notes | RX: no rx re-check at start center / stop (no false-start, framing error detection); TX: tx_start checked only in IDLE, tx_busy unconnected | code |

Note: user's project_note slide 2 says "Data – 104.6us"; code/xsim value is 104.16 µs.
