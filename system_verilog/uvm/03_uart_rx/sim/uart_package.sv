

package uart_package;

	parameter SEQ_NUM = 10; 

	parameter BAUD_TIME = 100_000_000/9600*10;

	parameter BAUD_PERCENT = 5; // 몇 % 빠르게하는지


	typedef enum bit[1:0] {FASTER,NORMAL,SLOWER} kind_e;



endpackage
