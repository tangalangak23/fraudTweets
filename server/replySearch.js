var assert=require('assert');
var Twitter=require("twitter");
var config;

function searchReply(MongoClient,config,urlcodeJSON,verified){
  var tweets;
  
  MongoClient.connect(config.url,function(err,db){
    db.collection("tweets").find({"replyFound":false,"attempts":{$lt:30}}).toArray(function(err,item){
      db.close();
      if(item.length>0){
        for(i=0;i<item.length;i++){
            keyNum=i%config.keys.length;
            client=new Twitter({
                consumer_key:config.keys[keyNum].CONSUMER_KEY,
                consumer_secret:config.keys[keyNum].CONSUMER_SECRET,
                access_token_key: config.keys[keyNum].ACCESS_KEY,
                access_token_secret: config.keys[keyNum].ACCESS_SECRET
            });
          query(item[i].screenName,item[i],client);
        }
      }
    });
  });

  function fraudScore(name,valid,urlcodeJSON,results){
    var score=30;
    var scores=[];
    var query={
        screen_name:name,
        include_entities:false
    };
    query=urlcodeJSON.encode(query);

    client.get(("users/show.json?"+query),function(error,tweets){
        if(error){
            console.log(error);
            return -1;
        }
        if(tweets.verified){
            results.fraud= "%"+score;
        }
        else{
            for(i=0;i<valid.length;i++){
                scores.push(editDistance(name,valid[i]));
            }
            score=score+(70/Math.min.apply(Math,scores).toFixed(2));
            results.fraud= "%"+score;
        }
        MongoClient.connect(config.url, function (err, db) {
            collection = db.collection("tweets");
            collection.update({id: results.id}, results, function (err, item) {
                console.log("Successfully Updated");
            });
            db.close();
        });
    });
}

  function query(handle, storedTweets,client) {
      var query = {
          q: "@"+handle,
          result_type: "recent",
          count: 20,
      };
      query=urlcodeJSON.encode(query);
      client.get(("search/tweets.json?" + query), function (error, tweets) {
          if (error){
              console.log(error);
              return 0;
          }
          if (tweets.statuses.length == 0) {
              storedTweets.attempts+=1;
              MongoClient.connect(config.url, function (err, db) {
                  collection = db.collection("tweets");
                  collection.update({id: storedTweets.id}, storedTweets, function (err, item) {
                    console.log("No Reply Mentions found");
                  });
                  db.close();
              });
              return 0;
          }

          for (i = 0; i < tweets.statuses.length; i++) {
              if (tweets.statuses[i].in_reply_to_status_id_str!=null && tweets.statuses[i].text[0] != "R" && tweets.statuses[i].text[1] != "T") {
                  replyId = (tweets.statuses[i].in_reply_to_status_id_str);
                  name = tweets.statuses[i].user.name;
                  screenName = tweets.statuses[i].user.screen_name;
                  uid = tweets.statuses[i].id_str;
                  text = tweets.statuses[i].text;
                  dateTime = tweets.statuses[i].created_at;

                  if (storedTweets.id == replyId) {
                      if (checkHelp(text)) {
                        results = storedTweets;
                        results.replyFound = true;
                        results.attempts+=1;
                        results.lastReply = {"id": uid, "name": name, "screenName": screenName, "text": text, "dateTime": dateTime};
                        delete results._id;
                        if (verified.includes(screenName)) {
                            console.log("Corrosponding tweet found and verified\n");
                            results.fraud = "%0";
                            MongoClient.connect(config.url, function (err, db) {
                                collection = db.collection("tweets");
                                collection.update({id: results.id}, results, function (err, item) {
                                console.log("Successfully Updated");
                            });
                            db.close();
                        });
                        } else {
                            console.log("Corrosponding tweet found and not verified\n");
                            results.fraud = "%"+fraudScore(screenName,verified,urlcodeJSON,results,MongoClient);
                        }
                        break;
                      }
                  }
              }
          }
          storedTweets.attempts+=1;
          MongoClient.connect(config.url, function (err, db) {
              collection = db.collection("tweets");
              collection.update({id: storedTweets.id}, storedTweets, function (err, item) {
                console.log("No Relevant Results");
              });
              db.close();
          });
      });
    }
}

function editDistance(st1,st2){
  var results=[[]];
  for(i=0;i<=st2.length;i++){
    results[i]=new Array(st1.length+1);
  }
  for(i=0;i<=st2.length;i++){
    results[i][0]=i;
  }
  for(i=0;i<=st1.length;i++){
    results[0][i]=i;
  }


  for(i=1;i<=st1.length+1;i++){
    for(j=1;j<st2.length;j++){
      cost=0;
      if(st1[i-1]!=st2[j-1]){
        cost=1;
      }
      temp=[];
      temp.push(results[i-1][j]+1);
      temp.push(results[i][j-1]+1);
      temp.push(results[i-1][j-1]+cost);
      results[i][j]=Math.min.apply(Math,temp);
    }
  }
  return(results[st1.length-1][st2.length-1]);
}

function checkHelp(text){
    var terms=["DM","Direct Message","help","helps","assist","feedback","customer","work with you","feel this way","concerning","private message","assistance","seems to be","issue","contacting you","let us know","worries us"];
    for(i=0;i<terms.length;i++){
        if(text.includes(terms[i])){
        return true;
        }
    }
    return false;
}

module.exports=function(MongoClient,config,urlcodeJSON){

	this.singleReply=function(){
    MongoClient.connect(config.url, function (err, db) {
        collection = db.collection("constants");
        collection.find({name: "verifiedHandles"}).toArray(function (err, item) {
          db.close();
          searchReply(MongoClient,config,urlcodeJSON,item[0].value.toString());
        });
    });
	}

	this.startReplyIndexing=function(){
    MongoClient.connect(config.url, function (err, db) {
        collection = db.collection("constants");
        collection.find({name: "verifiedHandles"}).toArray(function (err, item) {
          db.close();
          setInterval(function(){searchReply(MongoClient,config,urlcodeJSON,item[0].value.toString());},60000);
        });
    });
	}
}
