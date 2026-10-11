#!/bin/bash
# mk.sh : run old TB (with measurement hooks) and new TB on original + fault RTL
# usage : bash mk.sh   (needs Windows Vivado 2020.2 xsim)
H=$(cd "$(dirname "$0")/.." && pwd)
SRC=/mnt/c/26_AI_CAMP/System_Verilog/vfile/source_file/1008_source_file/FSM_RUN_STOP.sv
W=/mnt/c/Temp/fsm/run
for cfg in orig F1 F2 F3 F4 F5 F6 F7; do
  for tb in tb_FSM_RUN_STOP_cov tb_FSM_RUN_STOP_v2; do
    d=$W/${cfg}_$tb; rm -rf $d; mkdir -p $d
    if [ $cfg = orig ]; then cp $SRC $d/FSM_RUN_STOP.sv; else cp $H/fault/${cfg}_FSM_RUN_STOP.sv $d/FSM_RUN_STOP.sv; fi
    [ $tb = tb_FSM_RUN_STOP_v2 ] && cp $H/sim_file/$tb.sv $d/ || cp $H/fault/$tb.sv $d/
    wd=$(wslpath -w $d)
    printf '@echo off\r\ncd /d %s\r\ncall C:\\Xilinx\\Vivado\\2020.2\\bin\\xvlog.bat -sv FSM_RUN_STOP.sv %s.sv > xvlog.out 2>&1\r\ncall C:\\Xilinx\\Vivado\\2020.2\\bin\\xelab.bat -debug off %s -s snap > xelab.out 2>&1\r\ncall C:\\Xilinx\\Vivado\\2020.2\\bin\\xsim.bat snap -R > sim.out 2>&1\r\n' "$wd" $tb $tb > $d/run.bat
    (cd $d && cmd.exe /c "$wd\\run.bat") &
  done
done
wait
