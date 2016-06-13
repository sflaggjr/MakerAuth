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
        } else {
            $('#msg').text('No reason to press enter');
        }
        register.type = null;
    },
    member: function(){
        sock.et.emit('newMember', {
            fullname: $('#name').val(),
            cardID: register.cardID,
            accountType: $('#account').val(),
            machine: register.botID,
            months: $('#months').val()
        });
        $('.view').hide();  // hide all views
    },
    bot: function(){
        sock.et.emit('newBot', {
            fullname: $('#botName').val(),
            accountType: $('#botType').val(),
            machine: register.botID
        });
        $('.view').hide();  // hide all views
    }
}

var sock = {                                                   // Handle socket.io connection events
    et: io(),                                                  // start socket.io listener
    init: function(){                                          // allow chat and go when we have a name
        sock.et.on('regMember', sock.regMem);                  // recieves real time chat information
        sock.et.on('regBot', sock.newbot);                     // handles registering new accesspoints
        sock.et.on('message', sock.msg);
    },
    regMem: function(data){
        $('#msg').text('Unknown card scanned');
        app.display('regMember')                               // show new member form
        register.type = 'member';                              // indicate this is a different type of form
        register.cardID = data.cardID;                         // fill cardID to submit
        register.botID = data.machine;                         // fill machine value to submit TODO show which machine
        $('#memMsg').text("Register Member:" + data.cardID);   // indicated ready for submission
    },
    newbot: function(machineID){
        $('#msg').text('New bot found');
        app.display('regBot');                                 // show new bot form
        register.type = 'bot';                                 // indicate this is a different type of form
        register.botID = machineID;                            // fill machine value to submit TODO name machine
        $('#botMsg').text("Register bot:" + machineID);        // indicated ready for submission
    },
    msg: function(msg){$('#msg').text(msg);}
}

var app = {
    init: function(){
        sock.init();
        $('.submit').on('click', register.submit);
        $(document).keydown(function(event){
            if(event.which === 13){register.submit();}         // given enter button is pressed do same thing as clicking register
        });
    },
    display: function(view){
        $('.view').hide();
        if(view === "regMember"){
            $("#registerMember").show();
        } else {
            $("#registerBot").show();
        }
    }
}

$(document).ready(app.init);
