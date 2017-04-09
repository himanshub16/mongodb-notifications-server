var express = require('express');
var app = express();
const port = 4000;
var io = require('socket.io')(app.listen(port));

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var notifier = require('./notifier');

/* Hash table of real time connections.
 * List of sockets
 * Each object is like : 
 * {
 *  socketid : username
 * }
 */
var connections = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname+'/index.html');
});

app.post('/subscribe', function (req, res) {
    let sender = req.body.sender;
    let targets = req.body.targets;
    let fields = req.body.fields;
    // subscribe will return 200 or 404
    notifier.subscribe(sender, targets, fields, function(status) {
        console.log(status);
        res.sendStatus(status);
    });
});

app.get('/userlist', function(req, res) {
    notifier.getAllUserName((doc) => {
        res.send(doc);
    });
});

io.on('connection', function (socket) {
    socket.on('identify', function(username) {
        notifier.subscribers[username].socket = socket;
        connections[socket.id] = username;
    });
    socket.on('disconnect', function(){
        console.log('disconnecting', connections[socket.id]); // get the username
        notifier.unsubscribe(connections[socket.id]);
        delete connections[socket.id];
    });
});