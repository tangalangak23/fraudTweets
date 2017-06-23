var sentiment=require("sentiment");
var assert=require('assert');
var Twitter=require("twitter");
var config;
var lastID;


function searchTweets(MongoClient,config,urlcodeJSON){

  MongoClient.connect(config.url,function(err,db){
    var constants=db.collection("constants");
    constants.find({"name":"lastID"}).toArray(function(err,item){
      for(i=0;i<item.length;i++){
        keyNum=i%config.keys.length;
        lastID=item[i].value;
        handle=item[i].handle;
        client=new Twitter({
          consumer_key:config.keys[keyNum].CONSUMER_KEY,
          consumer_secret:config.keys[keyNum].CONSUMER_SECRET,
          access_token_key: config.keys[keyNum].ACCESS_KEY,
          access_token_secret: config.keys[keyNum].ACCESS_SECRET
        });
        query(handle,lastID,client)
      }
    });
    db.close();
  });

  function getAverageScore(client,id,name,tweetInfo){
    var query={
      screen_name:name,
    	count:20,
    	exclude_replies:true,
      include_rts:false
    };
    query=urlcodeJSON.encode(query);

    client.get(("statuses/user_timeline.json?"+query),function(error,tweets){
      if(error){
        console.log(error);
        return -1;
      }
    	var average=0;
    	for(i=0;i<tweets.length;i++){
    		average=average+(sentiment(tweets[i].text).score);
    	}
    	tweetInfo.user.averageScore=(average/tweets.length).toFixed(2);
      MongoClient.connect(config.url,function(err,db){
  			var tweets=db.collection("tweets");
        tweets.update({"_id":id},tweetInfo,function(err,result){
        });
  			db.close();
  		});
    });
  }

  function query(handle,lastID,client){
    var query={
      q:encodeURIComponent(handle),
      result_type:"recent",
      count:100,
      since_id:lastID
    };
    query=urlcodeJSON.encode(query);

    client.get(("search/tweets.json?"+query),function(error,tweets){
      if(error){
        console.log(query);
        console.log(error);
        return -1;
      }
      MongoClient.connect(config.url,function(err,db){
        assert.equal(null,err);
        console.log("Running search...");
        var length=tweets.statuses.length;
        if(length==0){
           db.close();
           console.log("Search complete\n");
           return 0;
        }
        for(i=0;i<length;i++){
          if(!tweets.statuses[i].in_reply_to_status_id_str && tweets.statuses[i].text[0]!="R" && tweets.statuses[i].text[1]!="T"){
            uid=tweets.statuses[i].id_str;
            name=tweets.statuses[i].user.name,
            screenName=tweets.statuses[i].user.screen_name;
            text=tweets.statuses[i].text;
            score=sentiment(tweets.statuses[i].text).score;
            console.log(name+"\n"+uid+"\n--------------");
            console.log(text+"\n"+score+"\n\n\n");
            if(score<0){
              var tweet={
              "_id":uid,
              "user":{
                "name":name,
                "id":tweets.statuses[i].user.id_str,
                "screenName":screenName,
                "profileIMG":tweets.statuses[i].user.profile_image_url,
                "coverIMG":tweets.statuses[i].user.profile_banner_url,
                "lang":tweets.statuses[i].user.lang,
                "location":tweets.statuses[i].user.location,
                "verified":tweets.statuses[i].user.verified,
                "url":tweets.statuses[i].user.url,
                "followerCount":tweets.statuses[i].user.followers_count,
                "friendCount":tweets.statuses[i].user.friends_count,
                "statusCount":tweets.statuses[i].user.statuses_count,
                "timeZone":tweets.statuses[i].user.time_zone,
                "created":tweets.statuses[i].user.created_at,
                "averageScore":0
              },
              "text":text,
              "responseTime":"0",
              "score":score,
              "dateTime":tweets.statuses[i].created_at,
              "handle":handle,
              "replyFound":false,
              "fraud":null,
              "attempts":0,
              "lastReply":null
            };
              db.collection('tweets').insert(tweet);
            getAverageScore(client,uid,screenName,tweet);
           }
          }
        }
        var constants=db.collection("constants");
        constants.update({"handle":handle},{name:"lastID","handle":handle,value:tweets.statuses[0].id_str});
        console.log("Search complete\n");
        db.close()
      });
    });
  }
}

module.exports=function(MongoClient,config,urlcodeJSON){

	this.reset = function(){
		MongoClient.connect(config.url,function(err,db){
			var tweets=db.collection("tweets");
			tweets.remove({});
			db.close();
		});
	}

	this.singleSearch=function(){
		searchTweets(MongoClient,config,urlcodeJSON);
	}

	this.startSearch=function(){
		searchTweets(MongoClient,config,urlcodeJSON);
		setInterval(function(){searchTweets(MongoClient,config,urlcodeJSON);},60000);
	}
}
