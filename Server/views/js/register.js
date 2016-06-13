// register.js ~ Copyright 2016 Manchester Makerspace ~ License MIT

var register = {
    botID: null,
    cardID: null,
    type: null,
    submit: function(){
        if(register.type === 'member'){
            register.member();
        } else if (register.type === 'bot'){
            register.bot();
        }
    },
    member: function(){
        sock.et.emit('newMember', {
            fullname: $('#name').val(),
            cardID: register.cardID,
            accountType: $('#account').val(),
            machine: register.botID,
            months: $('#months').val()
        })
    },
    bot: function(){
        sock.et.emit('newBot', {
            fullname: $('#name').val(),
            accountType: $('#account').val(),
            machine: register.botID
        })
    }
}

var sock = {                                                   // Handle socket.io connection events
    et: io(),                                                  // start socket.io listener
    init: function(){                                          // allow chat and go when we have a name
        sock.et.on('register', sock.passCreds);                // recieves real time chat information
        sock.et.on('newbot', sock.newbot);                     // handles registering new accesspoints
        sock.et.on('message', sock.msg)
    },
    passCreds: function(data){
        $('#monthsField').show();                              // be sure monthsField is showing
        register.type = 'member';                              // indicate this is a different type of form
        register.cardID = data.cardID;                         // fill cardID to submit
        register.botID = data.machine;                         // fill machine value to submit TODO show which machine
        $('#indicator').text("Register Member:" + data.cardID);// indicated ready for submission
        $('#nameField').text("Fullname");
        $('#accountField').text('Member type');
    },
    newbot: function(machineID){
        $('#monthsField').hide();                              // hide months feild
        register.type = 'bot';                                 // indicate this is a different type of form
        register.botID = machineID;                            // fill machine value to submit TODO name machine
        $('#indicator').text("Register bot:" + machineID);     // indicated ready for submission
        $('#nameField').text("Name: point of access");
        $('#accountField').text("Type: point of access");
    },
    msg: function(msg){$('#msg').text(msg);}
}

var app = {
    init: function(){
        sock.init();
        $('#save').on('click', register.submit);
    }
}

$(document).ready(app.init);
