// accessBot.js ~ Copyright 2016 Manchester Makerspace ~ License MIT
 
var mongo = { // depends on: mongoose
    ose: require('mongoose'),
    init: function(){
        mongo.ose.connect(process.env.MONGODB_URI);                                   // connect to our database
        var Schema = mongo.ose.Schema; var ObjectId = Schema.ObjectId;
        mongo.member = mongo.ose.model('member', new Schema({                         // create user object property
            id: ObjectId,                                                             // unique id of document
            fullname: { type: String, required: '{PATH} is required', unique: true }, // full name of user
            cardID: { type: String, required: '{PATH} is required', unique: true },   // user card id
            status: {type: String, Required: '{PATH} is required'},                   // type of account, admin, mod, ect
            accesspoints: [String],                                                   // points of access member (door, machine, ect)
            expirationTime: {type: Number},                                           // pre-calculated time of expiration
            groupName: {type: String},                                                // potentially member is in a group/partner membership
            groupKeystone: {type: Boolean},                                           // notes who holds expiration date for group
            groupSize: {type: Number},                                                // notes how many members in group given in one
            password: {type: String},                                                 // for admin cards only
        }));
        mongo.bot = mongo.ose.model('bot', new Schema({
            id: ObjectId,
            machineID: {type: String, required: '{PATH} is required', unique: true},  // unique identifier of point of access
            botName: {type: String, required: '{PATH} is required', unique: true},    // human given name for point of access
            type: {type: String, required: '{PATH} is required'},                     // type (door, tool, kegerator, ect)
        }));
    },
    auth: function(machine, card, successCallback, failCallback){                     // database calls to authenticate
        mongo.bot.findOne({machineID: machine}, function(error, realBot){             // one call for machine authenticity
            if(error){ failCallback('finding bot:' + error); }                        // database error case
            else if(realBot){                                                         // given a bot this bot was found
                mongo.member.findOne({cardID: card}, function(err, member){           // one call for member authenticity
                    if(err){ failCallback('finding member:' + error); }               // database error case
                    else if (member){                                                 // given member found
                        sockets.io.emit('memberScan', member);                        // member scan.. just like going to the airport
                        if(member.status === 'Revoked'){ failCallback('Revoked'); }   // if member has dark mark.. ignore deatheaters
                        else if(member.status === 'Landlord'){                        // landlord is visiting
                            if(realBot.botName === process.env.OUR_FRONT_DOOR){       // make sure this is our front door
                                successCallback();                                    // our landlord can get in the front door
                            }                                                         // no questions asked
                        } else if (member.groupName){                                 // if this member is part of a group membership
                            if(member.groupKeystone){                                 // keystone has expiry time
                                auth.checkExpiry(member, successCallback, failCallback); // check right away
                            } else {                                                  // otherwise we need to find group Keystone member
                                mongo.member.findOne({groupName: member.groupName, groupKeystone: true}, function(er, group){
                                    if(er)         { failCallback('finding group admin:' + error); }
                                    else if (group){ auth.checkExpiry(group, successCallback, failCallback);}
                                    else           { failCallback('no group admin');}
                                });
                            }
                        } else {                                                       // given no group, no error, and good in standing
                            auth.checkExpiry(member, successCallback, failCallback);   // check if membership is okey day
                        }
                    } else {                                                           // if no access or no access to specific machine
                        sockets.io.emit('regMember', {cardID: card, machine: machine});// how registration information is emitted to admin
                        failCallback('not a member');                                  // given them proper credentials to put in db
                    }
                });
            } else {
                sockets.io.emit('regBot', machine);                                    // signal an interface prompt for registering bots
                failCallback('not a bot');
            }
        });
    }
}

var auth = {
    checkExpiry: function(member, successCallback, failCallback){
        if(new Date().getTime() > new Date(member.expirationTime).getTime()){ // if membership expired
            failCallback('expired');                                          // TODO notify admin of expiration
        } else { successCallback(member); }                                   // otherwise, LET THEM IN!!!!
    }
}

var search = {
    find: function(query){  // response to member searches in admin client
        mongo.member.findOne({fullname: query}, function(err, member){
            if(err)         { sockets.io.emit('message', 'search issue: ' + err); }
            else if(member) { sockets.io.emit('found', member); }
            else            { sockets.io.emit('message', 'no member with that name, maybe bad spelling?');}
        });
    },
    revokeAll: function(fullname){
        mongo.member.findOne({fullname: fullname}, function(err, member){
            if(err){
                sockets.io.emit('message', 'search issue: ' + err);
            }else if(member){
                member.status = 'Revoked'; // set no acces to anything
                member.save(search.updateCallback('member revoked'));
            } else { sockets.io.emit('message', 'Inconcievable!');}       // you keep using that word...
        });
    },
    renew: function(update){
        console.log(update);
        mongo.member.findOne({fullname: update.fullname}, function(err, member){
            if(err){                                                      // case of a save failure
                sockets.io.emit('message', 'renew issue: ' + err);        // report failure to admin
            } else if (member){                                           // case things are going right
                member.expirationTime = update.expirationTime;            // set new expiration time
                member.save(search.updateCallback('renewed membership')); // save and on save note success to admin
            } else { sockets.io.emit('message', 'Inconcievable!');}       // I don't think that word means what you think it means
        });
    },
    updateCallback: function(msg){ // returns a custom callback for save events
        return function(err){
            if(err){ sockets.io.emit('message', 'update issue:' + err); }
            else { sockets.io.emit('message', msg); }
        }
    },
    group: function(groupName){
        mongo.member.findOne({groupName: groupName, groupKeystone: true}, function(error, member){
            if(error){ sockets.io.emit('message', 'find group issue:' + error);}
            else if (member){
                sockets.io.emit('foundGroup', {exist: true, expirationTime: member.expirationTime});
            } else { sockets.io.emit('foundGroup', {exist: false}); }
        });
    }
}

var register = {
    member: function(registration){                   // registration event
        var member = new mongo.member(registration);  // create member from registration object
        member.save(register.response)                // save method of member scheme: write to mongo!
    },
    bot: function(robot){
        var bot = new mongo.bot(robot);               // create a new bot w/info recieved from client/admin
        bot.save(register.response);                  // save method of bot scheme: write to mongo!
    },
    response: function(error){
        if(error){ sockets.io.emit('message', 'error:' + error); } // given a write error
        else { sockets.io.emit('message', 'save success'); }       // show save happened to client
    }
}

var sockets = {
    io: require('socket.io'),
    listen: function(server){
        sockets.io = sockets.io(server);
        sockets.io.on('connection', function(socket){
            socket.on('newMember', register.member);
            socket.on('newBot', register.bot);
            socket.on('find', search.find);
            socket.on('revokeAll', search.revokeAll);
            socket.on('auth', function(data){
                mongo.auth( data.machine,                                                // pass machine information
                            data.card,                                                   // pass card information
                            function(){sockets.io.to(socket.id).emit('auth', 'a');},     // success case callback
                            function(msg){sockets.io.to(socket.id).emit('auth', 'd');}); // fail case callback (custom message reasons)
            });
            socket.on('renew', search.renew);
            socket.on('findGroup', search.group);
        });
    }
}

var routes = {                 // singlton for adressing express route request: depends on mongo
    wild: function(req, res){  // when random routes are called
        console.log('got request at' + req.url);
        res.status(404).send('this is not the bot you are looking for');
    },
    auth: function(req, res){                                               // get route that acccess control machine pings
        mongo.auth( req.params.machine,                                     // pass machine information
                    req.params.card,                                        // pass card information
                    function(){res.status(200).send('Make!');},             // success case callback
                    function(msg){res.status(403).send(msg);});             // fail case callback (custom message reasons)
    },
    admin: function(req, res){                                              // post by potential admin request to sign into system
        if(req.body.fullname === 'admin' && req.body.password === process.env.MASTER_PASS){
            res.render('register', {csrfToken: req.csrfToken()});
        } else { res.send('denied'); }                                      // YOU SHALL NOT PASS
    },
    login: function(req, res){ res.render('signin', {csrfToken: req.csrfToken()}); } // get request to sign into system
}

var cookie = {                                               // Admin authentication / depends on client-sessions
    session: require('client-sessions'),                     // mozilla's cookie library
    ingredients: {                                           // personally I prefer chocolate chips
        cookieName: 'session',                               // guess we could call this something different
        secret: process.env.SESSION_SECRET,                  // do not track secret in version control
        duration: 7 * 24  * 60 * 60 * 1000,                  // cookie times out in x amount of time
    },
    meWant: function(){return cookie.session(cookie.ingredients);}, // nom nom nom!
    decode: function(content){return cookie.session.util.decode(cookie.ingredients, content);},
}

var serve = {                                                // singlton for server setup
    express: require('express'),                             // server framework library 
    parse: require('body-parser'),                           // JSON parsing library
    theSite: function (){                                    // methode call to serve site
        var app = serve.express();                           // create famework object
        var http = require('http').Server(app);              // http server for express framework
        app.set('view engine', 'jade');                      // use jade to template html files, because bad defaults
        app.use(require('compression')());                   // gzipping for requested pages
        app.use(serve.parse.json());                         // support JSON-encoded bodies
        app.use(serve.parse.urlencoded({extended: true}));   // support URL-encoded bodies
        app.use(cookie.meWant());                            // support for cookies (admin auth)
        app.use(require('csurf')());                         // Cross site request forgery tokens (admin auth)
        app.use(serve.express.static(__dirname + '/views')); // serve page dependancies (sockets, jquery, bootstrap)
        var router = serve.express.Router();                 // create express router object to add routing events to
        router.get('/', routes.login);                       // log in page
        router.post('/', routes.admin);                      // request registration page
        router.get('/:machine/:card', routes.auth);          // authentication route
        router.get('/*', routes.wild);                       // catches malformed request and logs them
        app.use(router);                                     // get express to user the routes we set
        sockets.listen(http);                                // listen and handle socket connections
        http.listen(process.env.PORT);                       // listen on specified PORT enviornment variable
    }
}

mongo.init();    // conect to our mongo server
serve.theSite(); // Initiate site!
