// accessBot.js ~ Copyright 2016 Manchester Makerspace ~ License MIT
/*
 * General URL structure:
 * /machineid/card [?supervising=]
 * machineid is the esp8266 unique serial number associated with the machine in database
 *  this is stored so we can perform access control on each piece of equipment
 */

var expired = {                                      // determine member expirations
    byExactTime: function(endTime){
        var currentDate = new Date().getTime();
        var endDate = new Date(endTime).getTime();
        if(currentDate > endDate){
            return true;
        } else { return false; }
    }
}
 
var mongo = { // depends on: mongoose
    ose: require('mongoose'),
    init: function(){
        mongo.ose.connect(process.env.MONGODB_URI);                                   // connect to our database
        var Schema = mongo.ose.Schema; var ObjectId = Schema.ObjectId;
        mongo.member = mongo.ose.model('member', new Schema({                         // create user object property
            id: ObjectId,                                                             // unique id of document
            fullname: { type: String, required: '{PATH} is required', unique: true }, // full name of user
            cardID: { type: String, required: '{PATH} is required', unique: true },   // user card id
            accountType: {type: String},                                              // type of account, admin, mod, ect
            accesspoints: [String],                                                   // points of access member (door, machine, ect)
            expirationTime: {type: Number},                                           // pre-calculated time of expiration
            startDate: {type: Number},                                                // time of card assignment
        }));
        mongo.bot = mongo.ose.model('bot', new Schema({
            id: ObjectId,
            machineID: {type: String, required: '{PATH} is required', unique: true},  // unique identifier of point of access
            botName: {type: String, required: '{PATH} is required', unique: true},    // human given name for point of access
            botType: {type: String, required: '{PATH} is required'},                  // type (door, tool, kegerator, ect)
        }));
    },
    auth: function(machine, card, successCallback, failCallback){                     // database calls to authenticate
        mongo.bot.findOne({machineID: machine}, function(error, realBot){             // one call for machine authenticity
            if(error){
                failCallback('finding bot:' + error);
            } else if(realBot){
                mongo.member.findOne({cardID: card}, function(err, member){            // one call for member authenticity
                    if(err){
                        failCallback('finding member:' + error);
                    } else if (member && member.accesspoints.indexOf(machine) > -1){   // TODO breakout in to seperate conditions
                                                                                       // TODO ^ to account for adding access points
                        if(expired.byExactTime(member.expirationTime)){                // account for possible expiration
                            failCallback('expired');                                   // TODO notify admin of expiration
                        } else {                                                       // TODO notify when expiration is close
                            successCallback(member);                                   // LET THEM IN!!!!
                        }
                    } else {                                                           // if no access or no access to specific machine
                        sockets.io.emit('regMember', {cardID: card, machine: machine});// send socket emit to potential admin
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

var search = {
    find: function(query){
        mongo.member.findOne({fullname: query}, function(err, member){
            if(err){
                sockets.io.emit('message', 'search issue: ' + err);
            }else if(member){
                sockets.io.emit('found', member);
            } else { sockets.io.emit('message', 'no member with that name, maybe bad spelling?');}
        });
    },
    revokeAll: function(fullname){
        mongo.member.findOne({fullname: fullname}, function(err, member){
            if(err){
                sockets.io.emit('message', 'search issue: ' + err);
            }else if(member){
                member.accesspoints = []; // set no acces to anything
                member.save();
                sockets.io.emit('message', 'access denied');
            } else { sockets.io.emit('message', 'thats odd... you just searched for that person right?');}
        });
    }
}


var register = {
    member: function(maker){                                          // registration post
        if(maker.cardID && maker.machine && maker.fullname && maker.expireTime){
            var member = new mongo.member({                           // create a new member
                fullname: maker.fullname,
                cardID: maker.cardID,
                acountType: maker.accountType,
                accesspoints: [maker.machine],
                expirationTime: maker.expireTime,
                startDate: maker.startDate
            });
            member.save(register.response)                           // save method of member scheme: write to mongo!
        } else { register.incorrect(); }
    },
    bot: function(robot){
        if(robot.machine && robot.fullname && robot.accountType){
            var bot = new mongo.bot({
                machineID: robot.machine,
                botName: robot.fullname,
                botType: robot.accountType
            });
            bot.save(register.response);                              // save method of member scheme: write to mongo!
        } else { register.incorrect(); }
    },
    incorrect: function(){sockets.io.emit('message', 'information needs to be entered correctly');},
    response: function(error){
        if(error){
            sockets.io.emit('message', 'error:' + error);
        } else {
            sockets.io.emit('message', 'save success');
            console.log('saved data');
        }
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
            console.log(socket.id + " connected");
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
        } else {
            res.send('denied');
            // case other than master password case
        }
    },
    login: function(req, res){ // get request to sign into system
        res.render('signin', {csrfToken: req.csrfToken()});
    }
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
