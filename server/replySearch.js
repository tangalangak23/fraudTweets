var assert=require('assert');
var config;

function searchReply(MongoClient,config,url,client,urlcodeJSON){
  var tweets;
  MongoClient.connect(url,function(err,db){
    db.collection("tweets").find({"replyFound":false}).toArray(function(err,item){
      db.close();
      if(item.length>0){
        for(i=0;i<item.length;i++){
          query(item[i].screenName,item[i]);
        }
      }
    });

  });

  function checkHelp(text){
    var terms=["DM","Direct Message","help","helps","assist","feedback","customer","work with you","feel this way"];
    for(i=0;i<terms.length;i++){
      if(text.includes(terms[i])){
        return true;
      }
    }
    return false;
  }
  function query(handle, storedTweets) {
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

                  if (storedTweets.id == replyId) {
                      if (checkHelp(text)) {
                          if (screenName == "sprintcare") {
                              console.log("Corrosponding tweet found and verified\n");
                              results = storedTweets;
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
                              break;
                          } else {
                              console.log("Corrosponding tweet found\n");
                              results = storedTweets;
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
                              break;
                          }
                      }
                  }
              } else{
                console.log("No relevant replies")
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
		setInterval(function(){searchReply(MongoClient,config,url,client,urlcodeJSON);},60000);
	}
}
