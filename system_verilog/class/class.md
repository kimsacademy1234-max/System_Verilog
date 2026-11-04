



# 1104 (수) 수업 

OOP -> event driven 방식 
**역할 분담을 해서 재사용성을 높인다**



stimulus -> drive -> **(interface)** ->  dut -> **(interface)** -> monitor -> Scb Pass/Fail 
									-> coverage( 검사를 몇 % 했는가) - 시스템 베릴로그로 오면서 추가된 기능 

* class 의 function new -> 재정의
						-> 객체의 생성 초기화 ( 동적 할당 ) 


사용자형 Task, function -> 이 객체가 무슨 일을 하는지?  




stimulus(벡터) 생성 -> streaming 
최종목표 : 이벤트(시간마다 발생하는 값 - 환경이 다양해 질 수 밖에 없음 ), 통합 검증 플랫폼을 만드는 것이 목표 


시놉시스 쓸 때 주의사항 -> $finish를 써라. 가급적이면 시뮬레이션 강제 종료 로직도 있으면 좋을 것 같다. 
	


monitor -> driver와 동시에 하면 어떨까 -> 10ns 이후에 말고 동시에 하자

driver 와 monitor를 순서대로 하니깐 시퀀셜한 타임이 2배가 된다. 


1. driver가 보낸 후 wait
2. monitor가 데이터 받은 후 event로 done 
3. 모니터 시점 -> 매번 간격으로 감지하는 것이 아니라, driver의 데이터 값이 바뀌었을 때 모니터링하는 것이 목적



```
drive run - #10 값을 업데이트 할 것이다
					
					event 

monitor  event catch : catch한 타이밍에 scb로 report( transaction 생성 , mailbox_mon2scb.put(tr))


scoreboard mon2scb.get(tr)


```


# oop에서는 자료형이 가장 중요하다.

- 정적 -> 메모리에 저장해놓고 쓰는 것

-> 만들면 메모리에 할당된다

->  HW instance ->  initial beign 실행(env 객체 동적 생성) -> task function ( 시간 제어 가능)

프로그램을 불러오기 위해서 **핸들러**가 있고, 프로그램을 **생성** 해서 프로그램을 **사용** -> 사용할 때는 접근 연산자를
사용한다. 


function new -> 함수 호출하면서 생성 



## 제약 사항 

randomize - 
범위 : inside
확률 : dist -> :/ '% 개념'
list : (특정값) 


## forever 

```
병렬 처리 방법 & 이벤트에 따라 제어 
기본적으로 non -blocking 연산이다 


```
-> 기본적으로 섞어서 사용한다. begin end 단점 : 개별 동작이 어렵다.


 * begin end는 blocking


(면접 단골 질문)


1. fork_join

시간은 가지만 동시에 처리

gen -> repeat 10번은 0ns 에 완료
drv -> forever begin 내부에 begin end, 순서대로 실행 

다만, gen과 drv간의 각각의 코드의 순서의 우선순위는 알 수 없다(규약사항도 없다)
CPU에서 동시에 처리? -> 사실상 말이 안되는 구조. 
시뮬레이터의 race condition
순서 결정은 같은 begin end 안에서 결정할 수 있지, 다른 클래스간의 코드 순서는 장담할 수 없다. 


event제어를 하거나(조합논리) , 순차논리는 clk
end fork join -> **안에 있는 프로세스가 끝나야지 끝남**

```
fork 

a -> finish
b -> finish

join

```

2. fork_join_any
- 둘 중 task  run 하나라도 끝나면 fork_join_any 탈출, next line 



3. fork_join_none
- 실행 시켜놓고 다른 건 fork_join



### shcedule 




















































