#VCS_OPTS := -full64 -sverilog -ntb_opts uvm-1.2 -timescale=1ns/1ps -debug_access+all -kdb -lca

TC ?= I2C_rand_test
#TC ?= apb_write_read_test
SEED ?= 1234

VCS_OPTS := -full64 -sverilog
VCS_OPTS += -ntb_opts uvm-1.2 
VCS_OPTS += -timescale=1ns/1ps
VCS_OPTS += -debug_access+all -kdb -lca
VCS_OPTS += +incdir+tb
VCS_OPTS += -cm line+cond+fsm+tgl+branch+assert

SIM_OPTS := +UVM_VERBOSITY=UVM_HIGH
SIM_OPTS += +ntb_random_seed=$(SEED)
SIM_OPTS += +UVM_TESTNAME=$(TC)
SIM_OPTS += -cm line+cond+fsm+tgl+branch+assert
SIM_OPTS += -cm_dir coverage.vdb
SIM_OPTS += -cm_name sim1

VERDI_OPTS := -covdir coverage.vdb -dbdir simv.daidir -ssf novas.fsdb

.PHONY: compile sim clean

compile:
	vcs $(VCS_OPTS) -f filelist.f -o simv
#vcs $(VCS_OPTS) -o simv ./rtl/ram.sv ./tb/tb_ram.sv
	@echo "vcs 컴파일 완료!"

sim: compile
	./simv $(SIM_OPTS) | tee sim_result.log
#./simv +UVM_TESTNAME=ram_test +UVM_VERBOSITY=UVM_HIGH 

vw: sim
	verdi -dbdir simv.daidir -ssf navas.fsdb &

vc: sim
	verdi -cov -covdir coverage.vdb &
verdi:
	verdi $(VERDI_OPTS)

clean:
	rm -rf simv* csrc *.key *.h *.log *.fsdb novas* *.conf *.LOG coverage.* vdCovLog verdiLog *.xml
	@echo "결과물 정리 완료!"
