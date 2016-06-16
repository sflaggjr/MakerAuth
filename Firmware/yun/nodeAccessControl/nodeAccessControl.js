// nodeAccessControl.js ~ Copyright 2016 Manchester Makerspace ~ License MIT
// This code lives on the linux side of an arduino yun
// relaying card information from on board arduino to our access control sever via socket.io

var SERVER = "http://192.168.1.113:3000";
// var SERVER = "http://manchestermakerspace.herokuapp.com";

// var SERIALPORT = "/dev/ttyATH0" // for the Yun
var SERIALPORT = "/dev/ttyACM0"  // Ubuntu/mint Linux

var socket = {
    io: require('socket.io-client')(SERVER),
    init: function(){
        socket.io.on('auth', function(data){
            var pkg = "<" + data + ">"; // make sure arduino has start and end chars to read
            console.log('send to arduino:' + pkg);
            arduino.connection.write(pkg);
        });
    }  
}

var arduino = {
    serialLib: require('serialport'),
    serialInstance: null,
    connection: null,
    init: function(){
        arduino.serialInstance = arduino.serialLib.SerialPort
        arduino.connection = new arduino.serialInstance(SERIALPORT, {
            baudrate: 9600,
            parser: arduino.serialLib.parsers.readline('\n')
        });
        arduino.connection.on('open', arduino.open);
        arduino.connection.on('data', arduino.read);
        arduino.connection.on('close', arduino.close);
        arduino.connection.on('error', arduino.error);
    },
    open: function(){console.log('port open');},
    read: function(data){
        console.log(data);
        data = data.slice(0, data.length-1); // exclude newline char
        socket.io.emit('auth', {machine: 'doorbot', card: data});
    },
    close: function(){console.log('port closed');},
    error: function(error){console.log('error:' + error);},
}

socket.init();
arduino.init();
