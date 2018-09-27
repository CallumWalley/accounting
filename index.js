const readline    = require('readline');
const chalk       = require('chalk');
const clear       = require('clear');
const figlet      = require('figlet');
//const files = require('./lib/files');

const func_input = require('./lib/func_input');
const func_console = require('./lib/func_console');
const CLI         = require('clui');
const Spinner     = CLI.Spinner;
var MongoClient = require('mongodb').MongoClient;
const status = new Spinner('Connecting to database, please wait.');



status.start();
let run = async function(dbCurrent){
  
  status.stop();
  func_console.rootMenu(dbCurrent);  
};
//connect to mongoDB
MongoClient.connect(mongoUrl,{ useNewUrlParser: true }, async function(err, db) {
  if (err) throw err;
  var dbCurrent = db.db("tycho");
  await run(dbCurrent);//.then(function(){db.close()});
  

});


