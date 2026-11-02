`timescale 1ns / 1ps


module tb_fnd_clk_top();


reg i_clk;
reg i_reset;


wire o_fnd_com11 ; 
wire o_fnd_com12 ;
wire o_fnd_com14 ;
wire o_fnd_com41 ;

wire o_clk_duty11 ;
wire o_clk_duty12 ;
wire o_clk_duty14 ;
wire o_clk_duty41 ;


top_adder_fnd_for_clk U_FND_CLK(

     .i_clk(i_clk),
     .i_reset_n(~i_reset),
     .i_a(),
     .i_b(),
     .i_cin(),
     .o_cout(),
     .o_fnd_com(o_fnd_com11),
     .o_fnd_data(),
	 .o_clk(o_clk_duty11)
);

   


top_adder_fnd_for_clk12 U_FND_CLK12(

     .i_clk(i_clk),
     .i_reset_n(~i_reset),
     .i_a(),
     .i_b(),
     .i_cin(),
     .o_cout(),
     .o_fnd_com(o_fnd_com12),
     .o_fnd_data(),
	 .o_clk(o_clk_duty12)
);



top_adder_fnd_for_clk14 U_FND_CLK14(

     .i_clk(i_clk),
     .i_reset_n(~i_reset),
     .i_a(),
     .i_b(),
     .i_cin(),
     .o_cout(),
     .o_fnd_com(o_fnd_com14),
     .o_fnd_data(),
	 .o_clk(o_clk_duty14)
);


top_adder_fnd_for_clk41 U_FND_CLK41(

     .i_clk(i_clk),
     .i_reset_n(~i_reset),
     .i_a(),
     .i_b(),
     .i_cin(),
     .o_cout(),
     .o_fnd_com(o_fnd_com41),
     .o_fnd_data(),
	 .o_clk(o_clk_duty41)
);










    always #5 i_clk = ~i_clk;




initial begin

    
    i_clk = 1'b1;
    i_reset = 1'b0;
    
    #10;
    
    i_reset = 1'b1;

    #10; 

    i_reset = 1'b0;

   
	#1000000;

	$finish;
end
endmodule
