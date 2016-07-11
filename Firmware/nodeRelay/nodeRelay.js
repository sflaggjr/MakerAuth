// nodeAccessControl.js ~ Copyright 2016 Manchester Makerspace ~ License MIT
// This code lives on the linux side of an arduino yun
// relaying card information from on board arduino to our access control sever via socket.io

var RETRY_DELAY = 5000; // when to try again if no connection

var socket = {
    io: require('socket.io-client')(process.env.SERVER),
    init: function(){ // notify authorization or denial: make sure arduino has start and end chars to read
        socket.io.on('auth', function(data){ arduino.connection.write("<" + data + ">"); });
    }  
}

var arduino = {
    serialLib: require('serialport'),
    serialInstance: null,
    connection: null,
    init: function(){
        arduino.serialInstance = arduino.serialLib.SerialPort
        arduino.connection = new arduino.serialInstance(process.env.SERIALPORT, {
            baudrate: 9600,
            parser: arduino.serialLib.parsers.readline('\n')
        });
        arduino.connection.on('open', arduino.open);
        arduino.connection.on('data', arduino.read);
        arduino.connection.on('close', arduino.close);
        arduino.connection.on('error', arduino.error);
    },
    open: function(){},
    read: function(data){
        data = data.slice(0, data.length-1); // exclude newline char
        socket.io.emit('auth', {machine: process.env.MACHINE_NAME, card: data});
    },
    close: function(){
        arduino.init();                        // try to re-establish if port was closed
    },
    error: function(error){                    // given something went wrong try to re-establish connection
        setTimeout(arduino.init, RETRY_DELAY); // retry every half a minute
    },
}

socket.init();
arduino.init();

