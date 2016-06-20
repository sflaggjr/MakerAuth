// accessbot.ino ~ Copyright 2016 Manchester Makerspace ~ Example implementation of door with Spark Core

#include "MFRC522.h" // This #include statement was automatically added by the Particle IDE.
// #include "JS_Timer.h"           // library for set timout and set interval

#define RST_PIN                 D2
#define SS_PIN                  SS

#define HOST "manchmakerspace.herokuapp.com"
#define MAX_URL_SIZE 30

//NFC Stuff
MFRC522 mfrc522(SS_PIN, RST_PIN); //initialize NFC reader
// JS_Timer jsTimer = JS_Timer();
// TCPClient client;

constexpr char hexmap[] = {'0', '1', '2', '3', '4', '5', '6', '7',
                           '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};
// ---------------------- setup and main loop ------------------------------

void setup() {
    RGB.control(true);
    Serial.begin(9600);
    
    mfrc522.setSPIConfig(); // set NFC reader up as SPI
    mfrc522.PCD_Init();     // start the NFC reader up
    
    // jsTimer.setInterval(toggleColor, 2000);
    // if (client.connect(HOST, 80)){
        Serial.println(F("scan your card"));    
    // }
    // jsTimer.setTimeout(getToHeroku, 30);
    // getToHeroku();
    grabCardID();
}

void loop() {
    // jsTimer.todoChecker();
}


void dumpCardInfo(){
    RGB.color(255, 0, 0);
    if( mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial() ){
        RGB.color(0, 255, 0);
        // do something with this new card
        mfrc522.PICC_DumpToSerial(&(mfrc522.uid));
        
    } else { RGB.color(0, 0, 255); }
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

/*
char * getRequestUrl(){
    static char requestUrl[MAX_URL_SIZE]; // almost not different from being global
    
    strcpy(requestUrl, "/fakedoorbot");
    
    // concat cardID into static array 
    for(int i=0;i<mfrc522.uid.size;++i){
        cardId += hexmap[(mfrc522.uid.uidByte[i] & 0xF0) >> 4];
        cardId += hexmap[mfrc522.uid.uidByte[i] & 0x0F];
    }  
    strcat()
    
    // return pointer to static array
} */

void grabCardID(){
    if( mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial() ){
        RGB.color(0, 255, 0);
    
        String cardId = "";                                 // Getting the ASCII representation of card's hex UID.
        for(int i=0;i<mfrc522.uid.size;++i){
          cardId += hexmap[(mfrc522.uid.uidByte[i] & 0xF0) >> 4];
          cardId += hexmap[mfrc522.uid.uidByte[i] & 0x0F];
        }
        String requestUrl = "/fakedoorbot/";
        requestUrl += cardId;
        
        Serial.print(F("potential get:"));
        Serial.println(requestUrl);
        
        // jsTimer.setTimeout(grabCardID, 4000);
        delay(4000);
        grabCardID();
    } else {
        RGB.color(255, 0, 0);
        // jsTimer.setTimeout(grabCardID, 30);
        delay(40);
        grabCardID();
    }
}

/*
void getToHeroku(){
    if( mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial() ){
        RGB.color(0, 255, 0);
    
        String cardId = "";                                 // Getting the ASCII representation of card's hex UID.
        for(int i=0;i<mfrc522.uid.size;++i){
          cardId += hexmap[(mfrc522.uid.uidByte[i] & 0xF0) >> 4];
          cardId += hexmap[mfrc522.uid.uidByte[i] & 0x0F];
        }
        String requestUrl = "/fakedoorbot/";
        requestUrl += cardId;
        
        Serial.print("potential get:");
        Serial.println(requestUrl);
        client.println("GET " + requestUrl + " HTTP/1.0");
        client.println("Host: " HOST);
        client.println("Content-Length: 0");
        client.println();
        
        // jsTimer.setTimeout(getToHeroku, 4000);
        delay(4000);
        getToHeroku();
    } else {
        RGB.color(255, 0, 0);
        // jsTimer.setTimeout(getToHeroku, 30);
        delay(40);
        getToHeroku();
    }
}*/

/*
void clientResponse(){
    if (client.available()){
        char c = client.read();
        Serial.print(c);
    } else {
        Serial.println();
        Serial.println("disconnecting.");
        client.stop();
    }
}*/

