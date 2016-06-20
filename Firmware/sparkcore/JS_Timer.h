// timer.ino ~ Copyright 2015-2016 ~ Paul Beaudet MIT licence - see LICENCE
// this needs to be included before anything else happens in timer library
// we need to create a datatype that allows us to point to a function without calling it
#include "application.h"           // make sure this thing understands data types
typedef void (*funcPointer)(void); // point to our functions

#define MAX_TIMERS 10              // must be less than 255, you'll prob run out of ram w/more anyhow

class JS_Timer {
    public:
        JS_Timer(void);                                    // init class
        funcPointer todos[MAX_TIMERS];                     // todo list
        bool repeat[MAX_TIMERS];                           // does todo repeat?
        unsigned long wait[MAX_TIMERS];                    // how long to wait todo todo
        unsigned long startTime[MAX_TIMERS];               // when todo was first called
        void todoChecker(void);                            // event loop checker
        uint8_t setInterval(funcPointer, unsigned long);
        uint8_t setTimeout(funcPointer, unsigned long);
    private:
        byte addTimer(funcPointer, unsigned long, bool);
};
