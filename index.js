var express = require('express');
var app = express();
const port = 4000;
var io = require('socket.io')(app.listen(port));

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var notifier = require('./notifier');
var test = require('./test');

/* check if test has to be done */
var doTest = false;
process.argv.forEach(function (val, index, array){
    if (val == 'test')
        doTest = true;
});


/* Hash table of real time connections.
 * List of sockets
 * Each object is like : 
 * {
 *  socketid : username
 * }
 */
var connections = {};


/* returns the index.html page */
app.get('/', function (req, res) {
    res.sendFile(__dirname+'/index.html');
});

/* subscribes the user to changes as desired */
app.post('/subscribe', function (req, res) {
    let sender = req.body.sender;
    let targets = req.body.targets;
    let fields = req.body.fields;
    // subscribe will return 200 or 404
    notifier.subscribe(sender, targets, fields, function(status) {
        console.log(status);
        /* if test has to be done, then start test */
        if (doTest) {
            test.setUsers(req.body.targets);
            test.startTest();
        }
        res.sendStatus(status);
    });
});

/* returns the list of users available
 * required for selection of users from a list to monitor
 */
app.get('/userlist', function(req, res) {
    notifier.getAllUserName((doc) => {
        res.send(doc);
    });
});


/* configure socket connections for realtime notifications */
io.on('connection', function (socket) {
    socket.on('identify', function(username) {
        notifier.subscribers[username].socket = socket;
        connections[socket.id] = username;
    });
    socket.on('disconnect', function(){
        console.log('disconnecting', connections[socket.id]); // get the username
        notifier.unsubscribe(connections[socket.id]);
        delete connections[socket.id];

        /* if a test was running, then stop it */
        if (doTest)
            test.stopTest();
    });
});