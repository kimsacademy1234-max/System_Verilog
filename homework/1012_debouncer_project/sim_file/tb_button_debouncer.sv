`timescale 1ns / 1ps

// Async button stimulus for button_debouncer
// high width = (j-1)*i + 10 ns, i = 5~12 ns, j = 5~15  -> 30~178 ns
// low width  = 100 ns + i
// i is not a multiple of the 10 ns clock period -> edges land off the clock grid

module tb_button_debouncer;

    reg  i_clk;
    reg  i_reset;
    reg  i_btn;
    wire o_btn;

    button_debouncer DUT (
        .i_clk   (i_clk),
        .i_reset (i_reset),
        .i_btn   (i_btn),
        .o_btn   (o_btn)
    );

    always #5 i_clk = ~i_clk;   // 100 MHz

    integer i, j, k, n_press, n_tick;

    task driver;
    begin
        i = $urandom_range(5, 12);   // random step delay
        j = $urandom_range(5, 15);   // random repeat count
        #(i) i_btn = 1'b1;
        for (k = 1; k < j; k = k + 1) #(i);
        #10  i_btn = 1'b0;
        #100;
    end
    endtask

    always @(posedge i_clk) if (o_btn) begin
        n_tick = n_tick + 1;
        $display("[MARK] t=%0t o_btn tick", $time);
    end

    initial begin
        i_clk = 0; i_reset = 1; i_btn = 0; n_tick = 0;
        #10 i_reset = 0;
        #3;                          // start off the clock grid
        for (n_press = 0; n_press < 10; n_press = n_press + 1) driver;
        $display("presses=%0d ticks=%0d", n_press, n_tick);
        $finish;
    end

endmodule
