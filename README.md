# MakerAuth

Physical access authentication system using NFC and wifi.
 
Intended for door access points, machine access control (via power switching), and reserves/schedualing on machines and rooms.

----

This project involves multiple components some being redundant that exist as options for a custom system


* Custom board based on the ESP-12 module (esp8266) that controls a relay and can scan NFC devices (?) 
* firmware for the esp8266 code that runs on the board (/Firmware/doornfcESP/)
* An Express server that handles authentication requests against a mongo.db server (/Server/)
* An admin web page to register, renew, and revoke members (/Server/views/)
* firmware to run on any Arduino with a Serial to Sockets relaying program (/Firmware/cardReaderArduino/)
* A serial to sockets relaying program, Communicates information between and non-networked arduino and server (/Firmware/nodeRelay/)
* firmware for the Particle Spark Core (/Firmware/sparkcore/)


