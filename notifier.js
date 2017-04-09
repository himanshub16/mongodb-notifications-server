const config = require('./configs').config;
const MongoClient = require("mongodb").MongoClient,
    assert = require("assert");

const mongoWatch = require('mongo-oplog-watch');
const watcher = mongoWatch(config.peopleDB, {
    ns: config.peopleNS
});

watcher.on("update", function(doc) {
    let username = doc.query._id;
    console.log(username, 'updated', doc.object.set);
    for (let userid in subscribers) {
        /* for each user who is available, 
         * prepare the message string and emit it
         * 
         * The alive key should be true and
         * the target list should contain the target, or
         * should be empty which means, monitor all users   
         */
        if (subscribers[userid].alive &&
             ( (subscribers[userid].targets.indexOf(username) !== -1) || 
               (subscribers[userid].targets.length === 0)
             )
            ) {
                for (let changedKey in doc.object.set) {
                    for (let i = 0; i < subscribers[userid].fields.length; i++) {
                        if (subscribers[userid].fields[i] == changedKey)
                            if (subscribers[userid].socket !== undefined) { 
                                subscribers[userid].socket.emit("notification", 
                                    username + ' changed ' + changedKey + ' to ' + doc.object.set[changedKey] );
                            } else {
                                console.log("socket not available for", userid);
                            }
                        }
                    }
            }
    }
});

/* The hashtable of subscribers, where the key is user_id
 * List of subscribers
 * Structure :
 * {
 *  userid: {
 *      targets    (users) (array of usernames),
 *      fields     (array of fields),
 *      alive      (boolean),
 *      queue      (unsent notifications)
 *      socketid   (id of the current socket in use)
 *  } ...
 * }
 * 
 */
var subscribers = {};

/* get all user names and ids from peopleDB */
function getAllUserName(callback) {
    MongoClient.connect(config.peopleDB, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(config.peopleColl);
        collection.find( {}, 
                         { '_id': 1, 'fullName': 1 }
            ).toArray(function(err, docs) {
            assert.equal(null, err);
            console.log("Found", docs.length, "user!");
            callback(docs);
        });
    });
}

/* get data for a user from subscribers' database */
function getUserData(username, callback) {
    console.log(username, 'getuserdata');
    MongoClient.connect(config.subscriptionsDB, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(config.subscribersColl);
        collection.find({'_id': username}).toArray(function (err, docs) {
            assert.equal(err, null);
            db.close();
            callback(docs[0]);
        });
    });
}

/* update data in subscribers' database */
function updateUserData(username, data, callback) {
    assert.notEqual(undefined, data.targets);
    MongoClient.connect(config.subscriptionsDB, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(config.subscribersColl);
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

/* set alive status for the subscriber */
function setAlive(username, aliveStatus, callback) {
    MongoClient.connect(config.subscriptionsDB, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(config.subscribersColl);
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

/* subscribe a user to notifications */
function subscribe(username, targets, fields, callback) {
    getUserData(username, (docs) => {
        if (docs !== undefined) {
            subscribers[username] = docs;
            subscribers[username].alive = true;
            subscribers[username].fields = fields;
            console.log(fields);
            if (targets != null) {
                subscribers[username].targets = targets;
                updateUserData(username, subscribers[username], () => {});
            }
            // else use the targets available in subscribers database
            setAlive(username, true, (nModified) => {
                console.log("alive : true for " + username + " : modified " + nModified);
            });
            callback(200);
        }
        else
            callback(404);
    });
}

/* unsubscribe a user */
function unsubscribe(username) {
    if (username in subscribers) {
        subscribers[username].alive = false;
        setAlive(username, false, (nModified) => {
            console.log("alive : false for " + username + " : modified " + nModified);
            delete subscribers[username];
        });
    }
}

module.exports = { subscribe, unsubscribe, subscribers, getAllUserName }