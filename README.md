## Realtime MongoDB database monitoring
#### Author: Himanshu Shekhar
---

### Preparing to run
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