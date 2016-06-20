/* timer.ino ~ Copyright 2015-2016 ~ Paul Beaudet MIT licence - see LICENCE
 * Requires functionPointer.h -> #include "functionPointer.h" (in main sketch)
 * (add file "functionPointer.h" to project that includes following line)
 * typedef void (*funcPointer)(void);
 *
 * Javascript style async event handling - gives three main functions
 * todoChecker();               // checks if todos need to be run place in main loop: NON BLOCKING, event handler
 * setTimeout(callback, time);  // pass function and durration of todo: runs onces, returns timerID
 * setInterval(callback, time); // pass function and durration of todo: runs repetitively, returns timerID
 * todos[timerID] = 0;          // cancels timer
 */
#include <JS_Timer.h>

JS_Timer::JS_Timer(void){;}     // object setup

void JS_Timer::todoChecker(){     // checks timer to see if a timeout or set interval event need to be executed
  unsigned long currentTime = millis();          // measure current time in milliseconds once
  for(byte i = 0; i < MAX_TIMERS; i++){          // for all timers
    if(todos[i]){                                // if there is a todo for this element of list
      if(currentTime - startTime[i] >= wait[i]){ // and time has elapsed from start
        (*todos[i])();                           // run this todo!
        if(repeat[i]){                           // if its repeating
          startTime[i] = currentTime;            // set the clock to do it again
        } else {                                 // run once case
          todos[i] = 0;                          // remove timer data
        }
      }
    }
  }
}

// Following functions take parameters opposite to that of "simpleTimer" library
// Reason for this is because these functions are really derived from javascript functions
// where those parameters are actually taken in the following order

// alias user facing functions to avoid passing extra param 
uint8_t JS_Timer::setTimeout(funcPointer todo, unsigned long durration){return addTimer(todo, durration, false);}
uint8_t JS_Timer::setInterval(funcPointer todo, unsigned long durration){return addTimer(todo, durration, true);}

// --- lower level --
uint8_t JS_Timer::addTimer(funcPointer todo, unsigned long durration, boolean recurring){
  static byte startup = true;                           // yes, a set-up function would be better..
  if(startup){                                          // if this is first timer function call
    for(byte i = 0; i < MAX_TIMERS; i++){todos[i] = 0;} // make sure all timers are blank
    startup = false;                                    // never run this again
  }
  for(byte i = 0; i < MAX_TIMERS; i++){ // for all timers
    if(todos[i] == 0){                  // given this todo is empty
      todos[i] = todo;                  // give this todo a space on todo list
      repeat[i] = recurring;            // note if this todo recurs
      wait[i] = durration;              // remember what we are counting down to
      startTime[i] = millis();          // need something to countdown against
      return i;                         // return timer ID
    }    
  }
  return 0xff;                          // timer not set case / too many timers (0xff == 255)
}

