var MongoClient=require('mongodb').MongoClient;
var md5 = require('md5');
var fs = require('fs');

//try to load config file
try {
	config = JSON.parse(fs.readFileSync('./server/config/authorization.json', 'utf8'));
} catch (e) {
	console.log('No config file found');
}

MongoClient.connect(config.url,function(err,db){
  if(err) console.log(err);
  db.createCollection("tweets",function(err){
    if(err) console.log(err);
  });
  db.createCollection("statistics",function(err){
    if(err) console.log(err);
  });
  db.createCollection("searches",function(err){
    if(err) console.log(err);
  });
  db.createCollection("users",function(err,collection){
    if(err) console.log(err);
    collection.insert({"name":"Fraud Tweets","uname":"ftweets","email":"fraud@tweets.com","password":md5("superSecretPassword")});
    db.close();
  });
});
