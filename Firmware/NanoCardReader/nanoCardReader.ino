// cardReader.ino ~ Copyright 2016  Manchester Makerspace ~ License MIT
// This sketch just bust out card ids to Yun when they are scanned

#include <SPI.h>      // local arduino library
#include <MFRC522.h>  // https://github.com/miguelbalboa/rfid

#define OPEN_TIME 5000
#define RELAY 3
#define RED_LED 7
#define GREEN_LED 6
#define SS_PIN 10
#define RST_PIN 9
#define CARD_WAIT 3000
#define INTERFACE Serial // quickly switch between Serial and Serial1 for testing purposes

MFRC522 cardReader = MFRC522(SS_PIN, RST_PIN);

const char hexmap[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};

void setup(){
    INTERFACE.begin(9600);      // open communication
    while(!INTERFACE){;}
    SPI.begin();                // Init SPI bus to communicate with card reader
    cardReader.PCD_Init();      // Init MFRC522 / start up card reader
    pinMode(RED_LED, OUTPUT);   // use LED
    pinMode(GREEN_LED, OUTPUT); // use LED
    pinMode(RELAY, OUTPUT);     // make relay pin an output
}

void loop(){
    getCardId();
}

void getCardId(){
    if(cardReader.PICC_IsNewCardPresent() && cardReader.PICC_ReadCardSerial()){
        digitalWrite(RED_LED, HIGH);             // indicate state of thought
        getRequestUrlString();                   // send uid to server
        char* response = recieve();              // wait for a response from server
        while(!response){response = recieve();}  // block until response
        if(strcmp(response, "a") == 0){          // a is for acceptance
            digitalWrite(RELAY, HIGH);           // open relay, so member can come in
            digitalWrite(RED_LED, LOW);          // make sure red led is off
            blink(GREEN_LED, 10, 50);            // blink green led to show success
            digitalWrite(GREEN_LED, HIGH);       // hold green led on
            delay(OPEN_TIME);                    // wait for amount of time relay needs to be open
            digitalWrite(RELAY, LOW);            // stop sending current to relay
        } else if (strcmp(response, "d") == 0){  // d is for denial
            blink(RED_LED, 15, 200);             // indicate failure w/ red led blink
        }
        delay(CARD_WAIT);                        // delay to leave door open or give unathorize person a hard time
        digitalWrite(GREEN_LED, LOW);            // make sure green is off
        digitalWrite(RED_LED, LOW);              // make sure red is off
    }
}

void getRequestUrlString(){ // Getting the ASCII representation of card's hex UID.
    String cardID = "";                                 
    for(int i=0;i<cardReader.uid.size;++i){
        cardID += hexmap[(cardReader.uid.uidByte[i] & 0xF0) >> 4];
        cardID += hexmap[cardReader.uid.uidByte[i] & 0x0F];
    }
    INTERFACE.println(cardID);        // success case, an id has been relayed to yun
}

void blink(byte led, int amount, int durration){
    static boolean toggle = false;
    
    toggle = ! toggle;                         // toggle LED state
    digitalWrite(led, toggle);                 // write LED state
    delay(durration);                          // block for a bit
    amount--;                                  // decrement blinks
    if(amount){blink(led, amount, durration);} // base case is no more blinks left
}

//======================== Serial Data Transfer (INTERFACE)
#define BUFFER_SIZE 32
#define START_MARKER '<'
#define END_MARKER '>'

char* recieve(){
    static char buffer[BUFFER_SIZE]; // remember receivedChars stays in memory just as it would globally
                                     // its just slightly more "complex" to point to where it is now
    static boolean inProgress = false;
    static byte index = 0;
    
    if(INTERFACE.available()) {
        char readChar = INTERFACE.read();
        if(inProgress) {
            if(readChar != END_MARKER) {
                buffer[index] = readChar;
                index++;
                if(index >= BUFFER_SIZE) {index = BUFFER_SIZE - 1;} // prevent overflow
            } else {
                buffer[index] = '\0'; // terminate the string
                inProgress = false;
                index = 0;
                return buffer;
            }
        } else if(readChar == START_MARKER){inProgress = true;}
    }
    return 0; // in the case the message has yet to be recieved
}

