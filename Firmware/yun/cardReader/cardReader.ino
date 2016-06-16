// cardReader.ino ~ Copyright 2016  Manchester Makerspace ~ License MIT
// This sketch just bust out card ids to Yun when they are scanned

#include <SPI.h>      // local arduino library
#include <MFRC522.h>  // https://github.com/miguelbalboa/rfid

#define LED 7
#define SS_PIN 10
#define RST_PIN 9
#define CARD_WAIT 3000
#define INTERFACE Serial // quickly switch between Serial and Serial1 for testing purposes

MFRC522 cardReader = MFRC522(SS_PIN, RST_PIN);

const char hexmap[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};

void setup(){
    INTERFACE.begin(9600);  // open communication
    while(!INTERFACE){;}
    SPI.begin();            // Init SPI bus to communicate with card reader
    cardReader.PCD_Init();  // Init MFRC522 / start up card reader
    // connectionAck();        // wait for connection with yun
    pinMode(LED, OUTPUT);   // use LED
}

void loop(){
    getCardId();
    // dumpCardInfo();
}

void getCardId(){
    if(cardReader.PICC_IsNewCardPresent() && cardReader.PICC_ReadCardSerial()){
        digitalWrite(LED, HIGH);
        getRequestUrlString();
        char* response = recieve();
        while(!response){response = recieve();}      // block until response
        if(strcmp(response, "a") == 0){          // a is for acceptance
            blink(10, 50);
            digitalWrite(LED, HIGH);
        } else if (strcmp(response, "d") == 0){  // d is for denial
            blink(15, 200);
        }
        delay(CARD_WAIT); // delay to leave door open or give unathorize person a hard time
        digitalWrite(LED, LOW);
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


void dumpCardInfo(){
    if( cardReader.PICC_IsNewCardPresent() && cardReader.PICC_ReadCardSerial() ){
        digitalWrite(LED, HIGH);
        cardReader.PICC_DumpToSerial(&(cardReader.uid)); // do something with this new card
        delay(CARD_WAIT);
    } else {
        digitalWrite(LED, LOW);
    }
    dumpCardInfo();
}

void blink(int amount, int durration){
    static boolean toggle = false;
    
    toggle = ! toggle;                    // toggle LED state
    digitalWrite(LED, toggle);            // write LED state
    delay(durration);                     // block for a bit
    amount--;                             // decrement blinks
    if(amount){blink(amount, durration);} // base case is no more blinks left
}

//======================== Serial Data Transfer (INTERFACE)
#define BUFFER_SIZE 32
#define START_MARKER '<'
#define END_MARKER '>'

char* recieve(){
    static char buffer[BUFFER_SIZE];
    // remember receivedChars stays in memory just as it would globally
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

void connectionAck(){
  boolean startReceived = false;
  while (startReceived == false) {
    // the fact that this is blocking makes testing difficult
    // in other words the if the yun is already running the application
    // this while loop will block the program until a yun restart
    char* intialSignal = recieve();
    // recieve a pointer to the first byte in the buffer array of signal
    if (intialSignal) {
      if (strcmp(intialSignal, "Python ready") == 0) {
        startReceived = true;
      }
    }
  }
  // send acknowledgment
  INTERFACE.println("<Arduino is ready>");
}

