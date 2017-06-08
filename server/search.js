var Twitter=require("twitter");
var urlcodeJSON=require("urlcode-json");
var sentiment=require("sentiment");
var assert=require('assert');
var config;
var lastID;


function searchTweets(MongoClient,config,url){
  MongoClient.connect(url,function(err,db){
    var constants=db.collection("constants");
    constants.find({"name":"lastID"}).toArray(function(err,item){
      lastID=item[0].value;
    });
    db.close();
  });
  function query(){
    var client= new Twitter({
      consumer_key:config.CONSUMER_KEY,
      consumer_secret:config.CONSUMER_SECRET,
      access_token_key: config.ACCESS_KEY,
      access_token_secret: config.ACCESS_SECRET
    });
    var query={
      q:"@sprint",
      result_type:"recent",
      count:100,
      since_id:lastID
    };
    query=urlcodeJSON.encode(query);

    client.get(("search/tweets.json?"+query),function(error,tweets){
      if(error) throw (error);
      MongoClient.connect(url,function(err,db){
        assert.equal(null,err);
        console.log("connected to database");
        var length=tweets.statuses.length;
        if(length==0){
           db.close();
           return 0;
        }
        for(i=0;i<length;i++){
          if(!tweets.statuses[i].in_reply_to_status_id_str && tweets.statuses[i].text[0]!="R" && tweets.statuses[i].text[1]!="T"){
            name=tweets.statuses[i].user.name;
            uid=tweets.statuses[i].id_str;
            text=tweets.statuses[i].text;
            dateTime=tweets.statuses[i].created_at;
            score=sentiment(tweets.statuses[i].text).score;
            console.log(name+"\n"+uid+"\n--------------");
            console.log(text+"\n"+score+"\n\n\n");
            if(score<1){
              db.collection('tweets').insert({"id":uid,"name":name,"text":text,"score":score,"dateTime":dateTime,"replyFound":false});
           }
          }
        }
        var constants=db.collection("constants");
        constants.update({name:"lastID"},{name:"lastID",value:tweets.statuses[0].id_str});

        db.close()
      });
    });
  }
  setTimeout(query,500);
}

module.exports=function(MongoClient,config){
	url=config.url;

	this.reset = function(){
		MongoClient.connect(url,function(err,db){
			var constants=db.collection("constants");
			constants.update({name:"lastID"},{name:"lastID",value:"0"});
			var tweets=db.collection("tweets");
			tweets.remove({});
			db.close();
		});
	}

	this.singleSearch=function(){
		searchTweets(MongoClient,config,url);
	}

	this.startSearch=function(){
		searchTweets(MongoClient,config,url);
		setInterval(searchTweets,60000);
	}
}
