var assert=require('assert');
var sentiment=require("sentiment");
var config;
var lastID;


function searchTweets(MongoClient,config,url,handle,client,urlcodeJSON){
  MongoClient.connect(url,function(err,db){
    var constants=db.collection("constants");
    constants.find({"name":"lastID"}).toArray(function(err,item){
      lastID=item[0].value;
    });
    db.close();
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

  function query(){

    var query={
      q:handle,
      result_type:"recent",
      count:100,
      since_id:lastID
    };
    query=urlcodeJSON.encode(query);

    client.get(("search/tweets.json?"+query),function(error,tweets){
      if(error) throw (error);
      MongoClient.connect(url,function(err,db){
        assert.equal(null,err);
        console.log("Running search...");
        var length=tweets.statuses.length;
        if(length==0){
           db.close();
           console.log("Search complete\n");
           return 0;
        }
        for(i=0;i<length;i++){
          if(tweets.statuses[i].text[0]!="R" && tweets.statuses[i].text[1]!="T"){
            name=tweets.statuses[i].user.name;
            screenName=tweets.statuses[i].user.screen_name;
            uid=tweets.statuses[i].id_str;
            text=tweets.statuses[i].text;
            dateTime=tweets.statuses[i].created_at;
            score=sentiment(tweets.statuses[i].text).score;
            if(!tweets.statuses[i].in_reply_to_status_id_str){
              console.log(name+"\n"+uid+"\n--------------");
              console.log(text+"\n"+score+"\n\n\n");
              if(score<0){
                db.collection('tweets').insert({"id":uid,"name":name,"screenName":screenName,"text":text,"score":score,"dateTime":dateTime,"handle":handle,"replyFound":false,"fraud":null,"lastReply":null});
             }
           }
           else{
             var replyId=tweets.statuses[i].in_reply_to_status_id_str;
             var tweetCollection=db.collection("tweets");
             tweetCollection.find({"id":replyId}).toArray(function(err,item){
               if(item.length==0){
                 console.log("No corrosponding tweet found"+replyId+"\n");
               }
              else{
                replyText=item[0].text;
                if(checkHelp(replyText)){
                  if(item[0].user.screen_name=="sprintcares"){
                    console.log("Corrosponding tweet found\n");
                    results=item[0];
                    results.replyFound=true;
                    results.fraud=false;
                    results.lastReply={"id":uid,"name":name,"screenName":screenName,"text":text,"score":score,"dateTime":dateTime}
                    tweetCollection.update(item[0],results);
                  }
                  else{
                    console.log("Corrosponding tweet found\n");
                    results=item[0];
                    results.replyFound=true;
                    results.fraud=true;
                    results.lastReply={"id":uid,"name":name,"screenName":screenName,"text":text,"score":score,"dateTime":dateTime}
                    tweetCollection.update(item[0],results);
                  }
                }
              }
             });
           }
         }
        }
        var constants=db.collection("constants");
        constants.update({name:"lastID"},{name:"lastID",value:tweets.statuses[0].id_str});
        console.log("Search complete\n");
        db.close()
      });
    });
  }
  setTimeout(query,500);
}

module.exports=function(MongoClient,config,client,urlcodeJSON){
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
		searchTweets(MongoClient,config,url,client,urlcodeJSON);
	}

	this.startSearch=function(){
    handle="@sprint";
		searchTweets(MongoClient,config,url,handle,client,urlcodeJSON);
		setInterval(function(){searchTweets(MongoClient,config,url,handle,client,urlcodeJSON);},60000);
	}
}
