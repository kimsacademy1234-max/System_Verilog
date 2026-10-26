`timescale 1ns / 1ps
// Measurement-only TB: logs state/edge times of uart_loopback for diagram numbers
module tb_measure;
  parameter BIT = 100_000_000 / 9600 * 10;  // 104160 ns, same as tb_uart.v
  reg clk = 0, rst = 1, rx = 1;
  wire tx; wire [7:0] o_rx_data; wire o_rx_done;
  uart_loopback dut (.clk(clk), .rst(rst), .rx(rx), .tx(tx), .o_rx_data(o_rx_data), .o_rx_done(o_rx_done));
  always #5 clk = ~clk;

  task send(input [7:0] d); integer i; begin
    rx = 0; $display("[%0t] DRV start bit (rx fall) data=%h", $time, d); #(BIT);
    for (i = 0; i < 8; i = i + 1) begin rx = d[i]; #(BIT); end
    rx = 1; #(BIT);
  end endtask

  always @(dut.U_UART_RX.c_state) $display("[%0t] RX  state -> %s cnt=%0d", $time, dut.U_UART_RX.c_state.name(), dut.U_UART_RX.b_tick_cnt);
  always @(dut.U_UART_TX.c_state) $display("[%0t] TX  state -> %s", $time, dut.U_UART_TX.c_state.name());
  always @(o_rx_done) $display("[%0t] rx_done=%b data=%h", $time, o_rx_done, o_rx_data);
  always @(tx) $display("[%0t] tx=%b", $time, tx);
  always @(dut.U_UART_RX.data_reg) if (dut.U_UART_RX.c_state == 3) $display("[%0t] RX  sample data_reg=%h", $time, dut.U_UART_RX.data_reg);
  integer nt = 0; time t1 = 0, t2 = 0;
  always @(posedge clk) if (dut.w_b_tick) begin nt = nt + 1; if (nt == 1) t1 = $time; if (nt == 2) begin t2 = $time; $display("[%0t] b_tick period = %0t", $time, t2 - t1); end end

  initial begin
    #20 rst = 0;
    #(BIT) send(8'h41);
    #(BIT*12);
    $display("---- back-to-back 2 bytes ----");
    send(8'h31); send(8'h32);
    #(BIT*14);
    $finish;
  end
endmodule
