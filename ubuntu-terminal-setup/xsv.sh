_xsv_kill_gui() {
  powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { (\$_.Name -eq 'xsim.exe' -and \$_.CommandLine -match 'sim -gui') -or (\$_.Name -eq 'xsimk.exe' -and \$_.CommandLine -match 'xsim\.dir/sim/xsimk') } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue; \$_.ProcessId }" 2>/dev/null | tr -d '\r' | grep -q . && sleep 1
}

xsv() {
  local VIV='C:\Xilinx\Vivado\2020.2\bin'
  local mode="-R"
  if [ "$1" = "-re" ]; then xsv-re; return; fi
  local args=("$@")
  if [ "$1" = "-g" ]; then mode="-gui"; shift; fi
  if [ $# -lt 2 ]; then
    echo "usage: xsv [-g] <top_module> <file1.sv> [file2.sv ...]"
    return 1
  fi
  case "$(pwd -P)" in
    /mnt/[a-z]|/mnt/[a-z]/*) ;;
    *) echo "xsv: /mnt/c, /mnt/d 같은 Windows 드라이브 경로에서 실행하세요"; return 1 ;;
  esac
  local top="$1"; shift
  local srcs=() f
  for f in "$@"; do
    [ -f "$f" ] || { echo "xsv: 파일 없음: $f"; return 1; }
    srcs+=("$(wslpath -w "$(realpath "$f")")")
  done
  _XSV_LAST=("${args[@]}")
  _XSV_DIR="$PWD"
  local snap="sim_r"
  if [ "$mode" = "-gui" ]; then snap="sim"; _xsv_kill_gui; fi
  mkdir -p xsim_build
  (
    cd xsim_build || exit 1
    echo "=== [1/3] xvlog ==="
    cmd.exe /c "$VIV\\xvlog.bat" -sv "${srcs[@]}" | tr -d '\r' | grep -E "ERROR|WARNING" ; [ "${PIPESTATUS[0]}" -eq 0 ] || { echo "xsv: 컴파일 실패 (xsim_build/xvlog.log 확인)"; exit 1; }
    echo "=== [2/3] xelab ==="
    local dbg=()
    [ "$mode" = "-gui" ] && dbg=(-debug typical)
    cmd.exe /c "$VIV\\xelab.bat" "$top" -s "$snap" "${dbg[@]}" | tr -d '\r' | grep -E "ERROR|WARNING" ; [ "${PIPESTATUS[0]}" -eq 0 ] || { echo "xsv: 엘라보레이션 실패 (xsim_build/elaborate.log 확인)"; exit 1; }
    echo "=== [3/3] xsim $mode ==="
    if [ "$mode" = "-gui" ]; then
      local tsrcs="" s
      for s in "${srcs[@]}"; do tsrcs+=" {${s//\\//}}"; done
      cat > wave.tcl <<EOF
# 파형에 신호 자동 추가: top 신호 + 바로 아래 scope(interface, DUT 등)마다 구분선 + 신호
# (class 기반 TB 는 top 에 class 핸들만 있어서 top 만 넣으면 파형이 비어 있음)
proc xsv_add_waves {} {
  catch {add_wave /$top}
  foreach s [get_scopes /$top/*] {
    if {[llength [get_objects \$s/*]] == 0} continue
    add_wave_divider [file tail \$s]
    catch {add_wave \$s}
  }
}
proc rl {} {
  set bin {C:/Xilinx/Vivado/2020.2/bin}
  catch {save_wave_config xsv.wcfg}
  catch {close_sim -force}
  puts "rl: compile"
  if {[catch {exec -ignorestderr \$bin/xvlog.bat -sv$tsrcs} m]} { puts \$m; puts "rl: compile FAIL (xvlog.log)"; return }
  puts "rl: elaborate"
  if {[catch {exec -ignorestderr \$bin/xelab.bat $top -s sim -debug typical} m]} { puts \$m; puts "rl: elaborate FAIL (elaborate.log)"; return }
  xsim sim
  if {![file exists xsv.wcfg] || [catch {open_wave_config xsv.wcfg}]} { xsv_add_waves }
  log_wave -recursive *
  run all
  puts "rl: done"
}
file delete -force xsv.wcfg
log_wave -recursive *
xsv_add_waves
run all
puts "xsv: edit TB, then type 'rl' here to reload"
EOF
      nohup cmd.exe /c "$VIV\\xsim.bat" sim -gui -tclbatch wave.tcl > xsim_gui.log 2>&1 &
      echo "xsv: 파형 창을 띄웠어요. TB 수정 후 xsim 창 Tcl 콘솔에 'rl' 입력 (창 새로 띄우기: xsv -re)"
    else
      cmd.exe /c "$VIV\\xsim.bat" "$snap" -R | tr -d '\r'
    fi
  )
}

xsv-re() {
  if [ ${#_XSV_LAST[@]} -eq 0 ] || [ "${_XSV_LAST[0]}" = "-re" ]; then
    _XSV_LAST=()
    echo "xsv-re: 이 터미널에서 실행한 xsv 기록이 없어요"
    return 1
  fi
  cd "$_XSV_DIR" && xsv "${_XSV_LAST[@]}"
}

alias xsv-kill='_xsv_kill_gui'
alias xsv-clean='_xsv_kill_gui; rm -rf xsim_build'
