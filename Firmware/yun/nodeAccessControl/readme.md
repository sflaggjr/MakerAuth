 #Shell script needs to be created does the following
    
    #!/bin/bash

    MACHINE_NAME="whatever"
    export MACHINE_NAME

    SERVER="http://YourServer"
    export SERVER

    SERIALPORT="/dev/ttyUSB0"  # for the arduino nano
    export SERIALPORT

    node nodeAccessControl.js
