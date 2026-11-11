#!/usr/bin/env bash
# tb_fifo_copy.sv (원본, run count 1000) / tb_fifo_pre_copy.sv (coverage 종료)
# 를 Option-0~4 모두 돌려서 report 박스만 모아 report_all.txt 로 저장
#   사용 : ./run_report.sh   (sim_file 폴더에서)
VIV='C:\Xilinx\Vivado\2020.2\bin'
HERE="$(cd "$(dirname "$0")" && pwd)"
LIB="$(dirname "$HERE")"
OUT="$HERE/report_all.txt"
WORK=/mnt/c/Users/kccistc/AppData/Local/Temp/fifo_report

: > "$OUT"
for t in tb_fifo_copy tb_fifo_pre_copy; do
  rm -rf "$WORK" && mkdir -p "$WORK" && cp "$LIB/fifo.sv" "$HERE/$t.sv" "$WORK/" || exit 1
  (
    cd "$WORK" || exit 1
    cmd.exe /c "$VIV\\xvlog.bat" -sv fifo.sv "$t.sv" > /dev/null 2>&1 || { echo "[$t] compile FAIL ($WORK/xvlog.log)"; exit 1; }
    cmd.exe /c "$VIV\\xelab.bat" tb_fifo -s sim > /dev/null 2>&1      || { echo "[$t] elaborate FAIL ($WORK/elaborate.log)"; exit 1; }
    echo ""
    echo "################################################################"
    echo "#  $t.sv"
    echo "################################################################"
    cmd.exe /c "$VIV\\xsim.bat" sim -R 2>/dev/null | tr -d '\r' | grep -E '^[|+]|FAIL|assert|Error'
  ) >> "$OUT" 2>&1
done
rm -rf "$WORK"
cat "$OUT"
