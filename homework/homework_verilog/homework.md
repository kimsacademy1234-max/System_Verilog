


# 개념 이해 

## D-FF

```
1. D-Latch Master 관점에서의 Setup time 
- Master의 Gate가 올라가는 순간 D값이 전달되므로
- Gate의 delay를 반영하여 Data가 미리 준비되어 있어야 한다.
- D-Latch Master는 ~CLK 이므로 이미 D값을 계속 받고 있음



2. D-Latch Slave 관점에서 Hold time
-  D값이 전달된 후 Slave의 gate가 enable 되면서 Master로 부터 인가받은 Q값을 보낸다.

- 의문점
1-1 ideal한 상황에서 Mater gate 닫힐 때, D값은 값을 유지하게 되고 Slave에서는 유지한 값을 받게 되므로 edge 이후 data 변화에 대한 risk가 없을 텐데 왜 hold time을 지키는 것인지 의문.

hold time과 setup time이 어떻게 결정되는지 궁금 
1-2 positive D-FF 의 Master Slave에서 invert된Clock이 들어오면 필연적으로 지연이 발생하게 되고 , Data가 Slave의 Clock enable 상황에서 delay시간 동안 변경이 될텐데
그래서 Setup타임은 이 delay까지 고려한 시간인건지 Tskew 있던 걸로 앎 

-> 고민 : Set up time -> Tskew(~Clk) + D_delay 반영한 시간인지



3. 동작 주파수 결정

조합 논리 회로간의 FF 구조에서 T = Tworst(조합논리 최대시간)+Tps + Th + Ts 가 동작 클럭의 최소 주기가 된다. 



```

## Metastability












































