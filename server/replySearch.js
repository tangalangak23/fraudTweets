var assert=require('assert');
var config;

function searchReply(MongoClient,config,url,client,urlcodeJSON){
  var tweets;
  MongoClient.connect(url,function(err,db){
    db.collection("tweets").find({"replyFound":false}).toArray(function(err,item){
      db.close();
      for(i=0;i<item.length;i++){
        query(item[i].screenName,item);
      }
    });

  });

  function checkHelp(text){
    var terms=["DM","Direct Message","help","helps","assist","feedback","customer"];
    for(i=0;i<terms.length;i++){
      if(text.includes(terms[i])){
        return true;
      }
    }
    return false;
  }
  function query(handle, mongoTweets) {
      var storedTweets = mongoTweets;
      var query = {
          q: handle,
          result_type: "recent",
          count: 100,
      };
      query = urlcodeJSON.encode(query);
      client.get(("search/tweets.json?" + query), function (error, tweets) {
          if (error)
              throw (error);
          if (tweets.statuses.length == 0) {
              console.log("No Reply Mentions found\n");
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

                  for (j = 0; j < storedTweets.length; j++) {
                      if (storedTweets[j].id == replyId) {
                          if (checkHelp(text)) {
                              if (screenName == "sprintcare" || screenName == "verizon") {
                                  console.log("Corrosponding tweet found and verified\n");
                                  results = storedTweets[j];
                                  results.replyFound = true;
                                  results.fraud = false;
                                  results.lastReply = {"id": uid, "name": name, "screenName": screenName, "text": text, "dateTime": dateTime}
                                  delete results._id;
                                  MongoClient.connect(url, function (err, db) {
                                      collection = db.collection("tweets");
                                      collection.update({id: results.id}, results, function (err, item) {
                                        console.log("Successfully Updated");
                                      });
                                      db.close();
                                  });
                              } else {
                                  console.log("Corrosponding tweet found\n");
                                  results = storedTweets[j];
                                  results.replyFound = true;
                                  results.fraud = true;
                                  results.lastReply = {"id": uid, "name": name, "screenName": screenName, "text": text, "dateTime": dateTime}
                                  delete results._id;
                                  MongoClient.connect(url, function (err, db) {
                                      collection = db.collection("tweets");
                                      collection.update({id: results.id}, results, function (err, item) {
                                        console.log("Successfully Updated");
                                      });
                                      db.close();
                                  });
                              }
                          }
                      } else {
                          console.log("No corrosponding tweet found" + tweets.statuses[i].in_reply_to_status_id_str + "\n");
                          break;
                      }
                  }
              }
          }
      });
  }
}

module.exports=function(MongoClient,config,client,urlcodeJSON){
	url=config.url;

	this.singleReply=function(){
		searchReply(MongoClient,config,url,client,urlcodeJSON);
	}

	this.startReplyIndexing=function(){
		searchReply(MongoClient,config,url,client,urlcodeJSON);
		setInterval(function(){searchReply(MongoClient,config,url,client,urlcodeJSON);},60000);
	}
}
