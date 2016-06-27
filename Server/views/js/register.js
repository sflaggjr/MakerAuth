// register.js ~ Copyright 2016 Manchester Makerspace ~ License MIT

var register = {
    botID: null,
    cardID: null,
    type: null,
    submit: function(){
        if      (register.type === 'member') { register.member(); }
        else if (register.type === 'bot')    { register.bot(); }
        else                                 { search.find(); }
    },
    member: function(){
        var months = $('#months').val();
        var fullname = $('#name').val();
        var startDate = $('#startDate').val();
        if(fullname && months < 14){                                               // make sure we have proper info to proceed
            if(startDate){ startDate = new Date($('#startDate').val()).getTime();} // get start time if provided
            else { startDate = new Date().getTime(); }                             // start time is now if not provided
            sock.et.emit('newMember', {                                            // emit data to server
                fullname: fullname,
                startDate: startDate,
                expireTime: expire.sAt(months, startDate),
                cardID: register.cardID,
                status: $('#account').val(),
                machine: register.botID,
            });
            app.display('search');
        } else { $('#msg').text('Please enter correct information'); }
    },
    bot: function(){
        var botName = $('#botName').val();
        var type = $('#botType').val();
        if(botName && type){              // make sure we have proper information to proceed
            sock.et.emit('newBot', {      // emit information to server
                fullname: botName,
                type: type,
                machine: register.botID
            });
            app.display('search');
        } else { $('#msg').text('Please enter correct information'); }
    }
}

var expire = {                                      // determine member expirations
    dByExactTime: function(endTime){                // determine if a member has expired
        var currentDate = new Date().getTime();
        var endDate = new Date(endTime).getTime();
        if(currentDate > endDate){
            return true;
        } else { return false; }
    },
    sAt: function(months, startDate){               // determine when a member will expire
        if(!startDate){                             // given no official start date
            startDate = new Date().getTime();       // take current time in milliseconds from epoch
        }
        months = months * 1000 * 60 * 60 * 24 * 30; // millis in a second, minute, hour, day, month = millis per x months
        return startDate + months;                  // get expiration time by adding months in millis to start time
    }
}

var search = {
    member: null,
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
        search.member = info;
        $('#findResult').show();
        $('#nameResult').text(info.fullname);
        $('#expiration').text(new Date(info.expirationTime).toDateString());
        $('#expired').text(expire.dByExactTime(info.expirationTime));
        var access = '';
        for(var i = 0; i < info.accesspoints.length; i++){
            if(i){access += ', ';}
            access += info.accesspoints[i];
        }
        $('#accesspoints').text(access);
    },
    revokeAll: function(){sock.et.emit('revokeAll', $('#nameResult').text() );},
    renew: function(){
        var months = $('#renewMonths').val();
        if(months && months < 14){                                                        // more than zero, less than 14
            var member = { fullname: $('#nameResult').text() };
            if(expire.dByExactTime(search.member.expirationTime)){                        // given membership has expired
                member.expirationTime = expire.sAt(months);                               // renew x months from current date
            } else {                                                                      // given membership has yet to expire
                member.expirationTime = expire.sAt(months, search.member.expirationTime); // renew x month from expiration
            }
            sock.et.emit('renew', member);                                                // emit renewal to server to update db
        } else {$('#msg').text("enter a valid amount of months");}                        // test admin to do it right
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
        register.cardID = data.cardID;                         // fill cardID to submit
        register.botID = data.machine;                         // fill machine value to submit TODO show which machine
        $('#memMsg').text("Register Member:" + data.cardID);   // indicated ready for submission
    },
    newbot: function(machineID){
        $('#msg').text('New bot found');
        app.display('regBot');                                 // show new bot form
        register.botID = machineID;                            // fill machine value to submit TODO name machine
        $('#botMsg').text("Register bot:" + machineID);        // indicated ready for submission
    },
    msg: function(msg){$('#msg').text(msg);},
}

var app = {
    init: function(){
        sock.init();
        $('.reject').on('click', function(){app.display('search');});
        $('.submit').on('click', register.submit);
        $('#revokeAll').on('click', search.revokeAll);
        $('#renew').on('click', search.renew);
        $(document).keydown(function(event){
            if(event.which === 13){register.submit();}         // given enter button is pressed do same thing as clicking register
        });
        app.display('search');
    },
    display: function(view){
        $('.view').hide();
        $('#findResult').hide();
        if(view === "regMember"){
            register.type = 'member';
            $("#registerMember").show();
        } else if (view === 'regBot') {
            register.type = 'bot';
            $("#registerBot").show();
        } else if (view === 'search'){
            register.type = 'find';
            $("#findMember").show();
        }
    }
}

$(document).ready(app.init);
