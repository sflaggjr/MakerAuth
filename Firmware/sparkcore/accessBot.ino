// accessbot.ino ~ Copyright 2016 Manchester Makerspace ~ Example implementation of door with Spark Core

#include "MFRC522.h"               // https://github.com/pkourany/MFRC522_RFID_Library
// #include "JS_Timer.h"           // https://github.com/PaulBeaudet/JS_Timer
#include "personal.h"              // contain presonal constants like host
// #define HOST "yourhosthere.com" // or comment that out and comment this in

#define RST_PIN                 D2
#define SS_PIN                  SS

#define MAX_URL_SIZE 30
#define INTERFACE Serial
#define CARD_WAIT 3000

//NFC Stuff
MFRC522 mfrc522(SS_PIN, RST_PIN); //initialize NFC reader
// TCPClient client; // TCPClient object for sparkcore

constexpr char hexmap[] = {'0', '1', '2', '3', '4', '5', '6', '7',
                           '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};
// ---------------------- setup and main loop ------------------------------
void setup() {
    RGB.control(true);
    INTERFACE.begin(9600);
    // SPI.begin(); //???
    mfrc522.setSPIConfig(); // set NFC reader up as SPI
    mfrc522.PCD_Init();     // start the NFC reader up
}

void loop() {
    grabCardID();
}

// ----------------- functions -----------------
void dumpCardInfo(){
    RGB.color(255, 0, 0);
    if( mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial() ){
        RGB.color(0, 255, 0);
        // do something with this new card
        mfrc522.PICC_DumpToSerial(&(mfrc522.uid));
        
    } else { RGB.color(0, 0, 255); }
}


void grabCardID(){
    if( mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial() ){
        RGB.color(0, 255, 0);  // green is go
        getRequestUrlString();
    } else {
        RGB.color(255, 0, 0);  // red is no go
    }
    delay(CARD_WAIT);
}

void getRequestUrlString(){ // Getting the ASCII representation of card's hex UID.
    String cardID = "";                                 
    for(int i=0;i<cardReader.uid.size;++i){
        cardID += hexmap[(cardReader.uid.uidByte[i] & 0xF0) >> 4];
        cardID += hexmap[cardReader.uid.uidByte[i] & 0x0F];
    }
    INTERFACE.println(cardID);        // success case, an id has been relayed to yun
}

void toggleColor(){
    static bool toggle = true;
    
    toggle = ! toggle;
    if(toggle){
        RGB.color(255, 0, 0);
    } else {
        RGB.color(0, 255, 0);
    }
}

void blink(byte led, int amount, int durration){
    static boolean toggle = false;
    
    toggle = ! toggle;                         // toggle LED state
    digitalWrite(led, toggle);                 // write LED state
    delay(durration);                          // block for a bit
    amount--;                                  // decrement blinks
    if(amount){blink(led, amount, durration);} // base case is no more blinks left
}


