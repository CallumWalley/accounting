var MongoClient = require('mongodb').MongoClient;
url = "mongodb://localhost:27017/tycho";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("tycho");
  dbo.createCollection("terms", function(err, res) {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  });
});