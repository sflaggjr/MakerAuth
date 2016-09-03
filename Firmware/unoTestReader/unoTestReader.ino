/* cardReader.ino ~ Copyright 2016  Manchester Makerspace ~ License MIT
 * Sends NFC card data to be authenticated to MakerAuth Server
 * Typical Pinout Diagram
 *             MFRC522      Arduino       Arduino   Arduino    Arduino          Arduino
 *             Reader/PCD   Uno           Mega      Nano v3    Leonardo/Micro   Pro Micro
 * Signal      Pin          Pin           Pin       Pin        Pin              Pin
 * -----------------------------------------------------------------------------------------
 * RST/Reset   RST          9             5         D9         RESET/ICSP-5     RST
 * SPI SS      SDA(SS)      10            53        D10        10               10
 * SPI MOSI    MOSI         11 / ICSP-4   51        D11        ICSP-4           16
 * SPI MISO    MISO         12 / ICSP-1   50        D12        ICSP-1           14
 * SPI SCK     SCK          13 / ICSP-3   52        D13        ICSP-3           15
 * 
 */

#include <SPI.h>      // local arduino library
#include <MFRC522.h>  // https://github.com/miguelbalboa/rfid

#define OPEN_TIME 5000
#define RELAY 3
#define BLUE_LED 7
#define SS_PIN 10
#define RST_PIN 9
#define CARD_WAIT 3000
#define INTERFACE Serial // quickly switch between Serial and Serial1 for testing purposes
#define BUFFER_SIZE 18   // size of write buffer

MFRC522 cardReader = MFRC522(SS_PIN, RST_PIN); // create object for reader
MFRC522::MIFARE_Key Key;                       // create instence of mifare key object

const char hexmap[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};

void setup(){
    INTERFACE.begin(9600);      // open communication
    while(!INTERFACE){;}
    SPI.begin();                // Init SPI bus to communicate with card reader
    cardReader.PCD_Init();      // Init MFRC522 / start up card reader
    pinMode(BLUE_LED, OUTPUT);  // use LED
    // pinMode(RELAY, OUTPUT);     // make relay pin an output
}

void loop(){
    if(cardReader.PICC_IsNewCardPresent() && cardReader.PICC_ReadCardSerial()){ // detect card
        // syncGetCardId();
        writeCardTest();
    }
}

void writeCardTest(){
    MFRC522::PICC_Type piccType = mfrc522.PICC_GetType(mfrc522.uid.sak); // grab card type
    if (    piccType != MFRC522::PICC_TYPE_MIFARE_MINI                   // Check for compatibility
        &&  piccType != MFRC522::PICC_TYPE_MIFARE_1K
        &&  piccType != MFRC522::PICC_TYPE_MIFARE_4K) {
        return;                                          // TODO probably should handle this error
    }
    byte sector         = 1; // In this sample we use the second sector,
    byte blockAddr      = 4; // that is: sector #1, covering block #4 up to and including block #7
    byte dataBlock[]    = {
        0x01, 0x02, 0x03, 0x04, //  1,  2,   3,  4,
        0x05, 0x06, 0x07, 0x08, //  5,  6,   7,  8,
        0x08, 0x09, 0xff, 0x0b, //  9, 10, 255, 12,
        0x0c, 0x0d, 0x0e, 0x0f  // 13, 14,  15, 16
    };
    byte trailerBlock   = 7;
    MFRC522::StatusCode status;
    byte buffer[BUFFER_SIZE];
}

void syncGetCardId(){                        // sync get id
    getRequestUrlString();                   // send uid to server
    char* response = recieve();              // wait for a response from server
    while(!response){response = recieve();}  // block until response
    if(strcmp(response, "a") == 0){          // a is for acceptance
        // digitalWrite(RELAY, HIGH);        // open relay, so member can come in
        blink(BLUE_LED, 10, 50);             // blink led to show success
        digitalWrite(BLUE_LED, HIGH);        // hold led on
        delay(OPEN_TIME);                    // wait for amount of time relay needs to be open
        digitalWrite(RELAY, LOW);            // stop sending current to relay
    } else if (strcmp(response, "d") == 0){  // d is for denial
        blink(BLUE_LED, 15, 200);            // indicate failure w/ red led blink
    }
    delay(CARD_WAIT);                        // delay to leave door open or give unathorize person a hard time
    digitalWrite(BLUE_LED, LOW);             // make sure led is off
}

void getRequestUrlString(){                  // Getting the ASCII representation of card's hex UID.
    String cardID = "";                                 
    for(int i=0;i<cardReader.uid.size;++i){
        cardID += hexmap[(cardReader.uid.uidByte[i] & 0xF0) >> 4];
        cardID += hexmap[cardReader.uid.uidByte[i] & 0x0F];
    }
    INTERFACE.println(cardID);               // success case, an id is relayed
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

