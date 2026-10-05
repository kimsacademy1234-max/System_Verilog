#!/bin/bash
# mk.sh <cfg> <tb_top> <fault-or-none> [V3]
# sources: copy ../../vfile RTL + this folder into $W/src first
W=/mnt/c/Temp/tbclk; cfg=$1; tb=$2; fault=$3; v3=$4
d=$W/$cfg; rm -rf $d; mkdir -p $d
base="half_adder full_adder full_adder_4bit full_adder_8bit digit_splitter fnd_decoder Fnd_Controller clock_div top_adder_fnd_for_clk_test top_adder_fnd_for_clk"
files=""
for m in $base; do
  f=$m.v
  [ "$fault" = F1 ] && [ $m = full_adder_8bit ] && f=F1_full_adder_8bit.v
  [ "$fault" != none ] && [ "$fault" != F1 ] && [ $m = Fnd_Controller ] && f=${fault}_Fnd_Controller.v
  cp $W/src/$f $d/$m.v; files="$files $m.v"
done
cp $W/src/$tb.v $d/; files="$files $tb.v"
def=""; [ -n "$v3" ] && def="-d V3"
cat > $d/run.bat <<B
@echo off
cd /d C:\\Temp\\tbclk\\$cfg
call C:\\Xilinx\\Vivado\\2020.2\\bin\\xvlog.bat $def $files > xvlog.out 2>&1
call C:\\Xilinx\\Vivado\\2020.2\\bin\\xelab.bat -debug off $tb -s snap > xelab.out 2>&1
call C:\\Xilinx\\Vivado\\2020.2\\bin\\xsim.bat snap -R > sim.out 2>&1
B
