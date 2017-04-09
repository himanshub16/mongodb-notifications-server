## Realtime MongoDB database monitoring
#### Author: Himanshu Shekhar
---

* [Development platform](#development-platform)
* [Running TLDR](#tldr)
* [Running Detailed description](#detailed-description)
* [Problem solving tactics](#the-problems)
* [Code Structure](#code-structure)
* [References](#references)

### Development platform
| Operating system | Linux |
| Distribution | Ubuntu 16.04 (KDE) |
| Node Version | 6.10.2 |
| MongoDB Version | 3.4.3 |
| Architecture | 64 bit Intel |

### Preparing to run
#### TLDR
Inside the folder having this code
```
mongoimport --db test --collection subscribers --drop --file subscribers.json
mongoimport --db test --collection people --drop --file people.json
npm install
sudo mongod --port 27017 --dbpath /var/lib/mongodb --replSet rs0
node index.js test
```
Open http://localhost:4000/

#### Detailed explanation
* Sample datasets are available in files *people.json*, and *subscribers.json*.
* Use the following commands to import the collections to MongoDB. You can change the name of database and collection as required, but remember to make the corresponding changes in *configs.js*.

```
mongoimport --db test --collection subscribers --drop --file subscribers.json
mongoimport --db test --collection people --drop --file people.json
```
* Install required node modules using *package.json*.
```
npm install
```
* Start your mongodb instances with a replication instance. Make sure the **dbpath** matches your installation.
  Any change in configuration needs to made in **configs.js**.
```
sudo mongod --port 27017 --dbpath /var/lib/mongodb --replSet rs0
```
* Start the HTTP server using index.js, which will run on port 4000 by default.
```
node index.js
```
* To use the automated test,
```
node index.js test
```
* Open `localhost:4000` to see the events as database changes.

---

## How I figured out the to this problem?

### The problems
* **Triggers**: MongoDB doesn't provide triggers, which can be used to handle events like database updates.
  **Solution**: However, Mongo has something called *tailable cursors*, which are similar to *tail -f* on Unix.
                But, the [official docs](https://docs.mongodb.com/manual/core/tailable-cursors/) doesn't recommend tailable cursors for high volume of writes. Rather, they provide a method of replication of databases, and *oplogs*, which is kinda log of whatever query is made. One can smartly utilize this log in his/her interest.

    For NodeJS, there were many oplog watchers already available, of which some were obsolete, and some were poorly documented and unreliable. This reduced the number of choices after trying most of them, making me finally step onto [mongo-oplog-watch](https://github.com/sachinb94/mongo-oplog-watch). It worked like charm, credits to proper documentation.


* **Realtime communication**: The notifications need to be sent to clients in real time.
  **Solution**: [Socket.IO](https://socket.io/) is the most reliable way in Node to handle real-time communication. 
                With plenty of examples available out there, it made the task easy.
                But, we had to handle many socket connections. This was done by making a hashtable with userId as keys (easy to implement as JSON).
                The references are properly mentioned in *references.txt*.



### Code structure
The codebase is built upon **Node JS**. There are three main javascript files:
1. **index.js** : Creates **ExpressJS** and **Socket.IO** server, sets up routes and handle interactions with the client.
2. **notifier.js** : Handles the direct interaction with MongoDB instance, like subscribe, unsubscribe, watch a collection for changes, get user list from database, etc.
3. **configs.js**: Has configuration variables so that configuration can be easily changed.

There are two collections.
1. **People's collection**: This contains the objects for all users, and their basic data.
2. **Subscriber's collection**: This contains the objects for all subscribers, so that other instance of this code can see which users are being served currently.


### REFERENCES

**expressjs and socketio references**
* https://blog.joshsoftware.com/2012/01/30/push-notifications-using-express-js-and-socket-io/
* https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
* https://blog.joshsoftware.com/2012/01/30/push-notifications-using-express-js-and-socket-io/
* https://code.tutsplus.com/tutorials/real-time-chat-with-nodejs-socketio-and-expressjs--net-31708
 
**setting up replication in mongodb and oplog**
* https://docs.mongodb.com/getting-started/shell/import-data/
* https://docs.mongodb.com/getting-started/shell/update/
* https://www.tutorialspoint.com/mongodb/mongodb_replication.htm
* http://stackoverflow.com/questions/22629462/does-mongodb-have-the-properties-such-as-trigger-and-procedure-in-a-relational-d
* https://github.com/sachinb94/mongo-oplog-watch
 
**XHR in plain javascript**
* https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest

**Gossip girl characters for sample dataset**
* https://en.wikipedia.org/wiki/List_of_Gossip_Girl_characters#Main