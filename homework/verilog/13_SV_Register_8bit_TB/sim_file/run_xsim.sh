#!/bin/bash
# run_xsim.sh : run both driver-order TBs on Windows Vivado 2020.2 xsim, dump log + VCD
# usage : bash run_xsim.sh   -> C:\Temp\reg8\<tb>\sim.out, wave.vcd
H=$(cd "$(dirname "$0")" && pwd)
DUT=/mnt/c/26_AI_CAMP/System_Verilog/system_verilog/lib/register_8bit.sv
W=/mnt/c/Temp/reg8
for tb in tb_register_8bit_posedge_get tb_register_8bit_get_posedge; do
  d=$W/$tb; rm -rf $d; mkdir -p $d
  cp $DUT $d/; cp $H/$tb.sv $d/
  printf 'open_vcd wave.vcd\r\nlog_vcd /%s/*\r\nlog_vcd /%s/reg_if/*\r\nrun all\r\nclose_vcd\r\nquit\r\n' $tb $tb > $d/vcd.tcl
  wd=$(wslpath -w $d)
  printf '@echo off\r\ncd /d %s\r\ncall C:\\Xilinx\\Vivado\\2020.2\\bin\\xvlog.bat -sv register_8bit.sv %s.sv > xvlog.out 2>&1\r\ncall C:\\Xilinx\\Vivado\\2020.2\\bin\\xelab.bat -debug typical %s -s snap > xelab.out 2>&1\r\ncall C:\\Xilinx\\Vivado\\2020.2\\bin\\xsim.bat snap -tclbatch vcd.tcl > sim.out 2>&1\r\n' "$wd" $tb $tb > $d/run.bat
  (cd $d && cmd.exe /c "$wd\\run.bat") &
done
wait
