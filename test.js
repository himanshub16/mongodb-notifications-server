/* script to test the codebase
 * called by index.js
 * 
 * This script randomly changes entries in the database
 * So that notifications are sent when required
 * And then reverts those changes, to maintain integrity
 */

const config = require('./configs').config;
const MongoClient = require("mongodb").MongoClient,
    assert = require("assert");

/* This is the timer which will be used to make random changes */
var timer = null;

/* These are the sets of values from which one will be chosen at random
 * and change will be done
 */
const city = [ "San Francisco", "Washington", "New York", "Seattle",
               "New Delhi", "Mumbai", "Gorakhpur", "Bangalore",
               "London", "Zurich", "Berlin", "Munich"
];
const relationship = [ "single", "married", "engaged", "complicated" ];
const status = [
    "Busy. Can't waste time on social media!",
    "Hey friends, how are you doing?",
    "Fed up of my life",
    "I am the king of the world",
    "God bless India"
];

var usersToStalk = [];

/* These functions return random values from above datasets */
function randomCity() {
    return city[ Math.floor(Math.random()*city.length) ];
}

function randomRelationship() {
    return relationship[ Math.floor(Math.random()*relationship.length) ];
}

function randomStatus() {
    return status[ Math.floor(Math.random()*status.length) ];
}

function randomUser() {
    return usersToStalk[ Math.floor(Math.random()*usersToStalk.length) ];
}

/* These functions select a random user and then a random dataset from above functions.
 * Then, they change the attribute for required user in database
 */
function updateCity() {
    let u = randomUser();
    let c = randomCity();
    MongoClient.connect(config.peopleDB, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(config.peopleColl);
        collection.updateOne(
            {_id: u},
            { $set: { location: c } },
            function(err, result) {
                assert.equal(err, null);
                // assert.equal(1, result.result.n);
                db.close();
                console.log("updated city for", u, "to", c);
            }
        );
    });
}

function updateRelationship() {
    let u = randomUser();
    let r = randomRelationship();
    MongoClient.connect(config.peopleDB, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(config.peopleColl);
        collection.updateOne(
            {_id: u},
            { $set: { relationship: r } },
            function(err, result) {
                assert.equal(err, null);
                // assert.equal(1, result.result.n);
                db.close();
                console.log("updated relationship for", u, "to", r);                
            }
        );
    });
} 

function updateStatus() {
    let u = randomUser();
    let s = randomStatus();
    MongoClient.connect(config.peopleDB, function (err, db) {
        assert.equal(null, err);
        let collection = db.collection(config.peopleColl);
        collection.updateOne(
            {_id: u},
            { $set: { status: s } },
            function(err, result) {
                assert.equal(err, null);
                // assert.equal(1, result.result.n);
                db.close();
                console.log("updated status for", u, "to", s);
            }
        );
    });
}

/* Start test */
function startTest() {
    timer = setInterval(function() {
        let n = Math.floor(Math.random()*3);
        switch(n) {
            case 0: updateCity(); break;
            case 1: updateStatus(); break;
            case 2: updateRelationship(); break;
        }
    }, 2000);
}

/* Stop test */
function stopTest() {
    clearInterval(timer);
}

/* Set usersToStalk */
function setUsers(userArr) {
    usersToStalk = userArr;
}


module.exports = { setUsers, startTest, stopTest }