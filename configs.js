// This file contains all the configurations
/* peopleDB :        the URL of main database
 * subscriptionsDB:  the url of subscritions database
 * peopleColl:       the name of collection of users
 * subscribersColl:  the name of collection of subscribers
 * peopleNS:         namespace of people collection
 * subscribersNS:    namespace of people collection
 */

var config = {
    peopleDB: "mongodb://localhost:27017/test",
    peopleColl: "people",
    peopleNS: "test.people",
    subscriptionsDB: "mongodb://localhost:27017/test",
    subscribersNS: "test.subscribers",
    subscribersColl: "subscribers"
};

module.exports = { config };