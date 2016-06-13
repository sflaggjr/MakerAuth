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
            search.find();
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
        app.display('search');
    },
    bot: function(){
        sock.et.emit('newBot', {
            fullname: $('#botName').val(),
            accountType: $('#botType').val(),
            machine: register.botID
        });
        app.display('search');
    },
    reject: function(){ // clears regerstation attempts
        app.display('search');
        register.type = null;
    }
}

var search = {
    find: function(){
        var query = $('#findName').val();
        if(query){
            sock.et.emit('find', query);                      // pass a name for sever to look up
        } else {
            $('#msg').text('enter a member to search');
        }
    },
    found: function(info){
        $('#msg').text('Found member');
        $('#findResult').show();
        $('#nameResult').text(info.fullname);
        $('#renewalResult').text(info.lastRenewal);
        var access = '';
        for(var i = 0; i < info.accesspoints.length; i++){
            access += info.accesspoints[i];
            access += ', ';
        }
        $('#accesspoints').text(access);
    }
}

var sock = {                                                   // Handle socket.io connection events
    et: io(),                                                  // start socket.io listener
    init: function(){                                          // allow chat and go when we have a name
        sock.et.on('regMember', sock.regMem);                  // recieves real time chat information
        sock.et.on('regBot', sock.newbot);                     // handles registering new accesspoints
        sock.et.on('message', sock.msg);
        sock.et.on('found', search.found);
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
    msg: function(msg){$('#msg').text(msg);},
}

var app = {
    init: function(){
        sock.init();
        $('.reject').on('click', register.reject);
        $('.submit').on('click', register.submit);
        $(document).keydown(function(event){
            if(event.which === 13){register.submit();}         // given enter button is pressed do same thing as clicking register
        });
        app.display('search');
    },
    display: function(view){
        $('.view').hide();
        $('#findResult').hide();
        if(view === "regMember"){
            $("#registerMember").show();
        } else if (view === 'regBot') {
            $("#registerBot").show();
        } else if (view === 'search'){
            $("#findMember").show();
        }
    }
}

$(document).ready(app.init);
