const dbURL = require("./configs").config.subscriptionsDB;
const peopleDB = require('./configs').config.mainDB;
const MongoClient = require("mongodb").MongoClient,
    assert = require("assert");

var MongoOplog = require('mongo-oplog');
const oplog = MongoOplog(peopleDB, {
    ns: "test.people"
});

// var socketio = require("socketio");

/* The hashtable of connections, where the key is user_id
 * List of sockets
 */
var connections = {};

function getUserData(username, callback) {
    MongoClient.connect(dbURL, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection("subscribers");
        collection.find({'_id': username}).toArray(function (err, docs) {
            assert.equal(err, null);
            db.close();
            callback(docs[0]);
        });
    });
}

function updateUserData(username, data, callback) {
    assert.notEqual(undefined, data.historyId);
    assert.notEqual(undefined, data.targets);
    MongoClient.connect(dbURL, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection("subscribers");
        collection.deleteOne({_id: username}, () => {
            collection.insertOne(data, function(err, result) {
                    assert.equal(err, null);
                    assert.equal(1, result.result.n);
                    db.close();
                    callback(result.modifiedCount);
                });
        });
    });
}

function setAlive(username, aliveStatus, callback) {
    MongoClient.connect(dbURL, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection("subscribers");
        collection.updateOne(
            {_id: username},
            { $set: { alive: aliveStatus } },
            function(err, result) {
                assert.equal(err, null);
                // assert.equal(1, result.result.n);
                db.close();
                callback(result.modifiedCount);
            }
        );
    });
}

function subscribe(username, targets, callback) {
    getUserData(username, (docs) => {
        if (docs !== undefined) {
            connections[username] = docs;
            connections[username].alive = true;
            setAlive(username, true, (nModified) => {
                console.log("alive : true for " + username + " : modified " + nModified);
            });
        }
        else
            console.log(username + ' not found');
        callback(docs);
    });
}

function unsubscribe(username, callback) {
    if (username in connections) {
        connections[username].alive = false;
        setAlive(username, false, (nModified) => {
            console.log("alive : false for " + username + " : modified " + nModified);
            delete connections[username];
        });
    }

}

oplog.tail().then( () => {
    console.log("tailing started");
});

oplog.on("insert", doc => {
    console.log(doc);
});

module.exports = { getUserData, updateUserData, subscribe, unsubscribe, connections }