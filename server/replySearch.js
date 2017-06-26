/* The purpouse of this file is to begin searching for replies of stored tweets.
Created By: Caleb Riggs
*/
var assert=require('assert');
var Twitter=require("twitter");
var config;

function searchReply(MongoClient,config,urlcodeJSON,verified){
  var tweets;
  //Connect to the db to find the tweets that need to be searched
  MongoClient.connect(config.url,function(err,db){
    db.collection("tweets").find({"replyFound":false,"attempts":{$lt:30}}).toArray(function(err,item){
      db.close();
      if(item.length>0){
        for(i=0;i<item.length;i++){
          //Select a key round robin style for the tweet to use to search
          keyNum=i%config.keys.length;
          //Create twitter client from the key selected above
          client=new Twitter({
              consumer_key:config.keys[keyNum].CONSUMER_KEY,
              consumer_secret:config.keys[keyNum].CONSUMER_SECRET,
              access_token_key: config.keys[keyNum].ACCESS_KEY,
              access_token_secret: config.keys[keyNum].ACCESS_SECRET
          });
          //Begin searching for replies
        query(item[i].user.screenName,item[i],client);
        }
      }
    });
  });

  function updateStatistics(stats){
    MongoClient.connect(config.url,function(err,db){
      var constants=db.collection("constants");
      constants.find({"name":"statistics"}).toArray(function(err,item){
        results=item[0];
        if(stats){
          results.validRepliesFound+=1;
          constants.update({"name":"statistics"},results,function (err, item) {
            if(err) console.log(err);
          });
        }
        else{
          results.fraudulentRepliesFound+=1
          constants.update({"name":"statistics"},results,function (err, item) {
            if(err) console.log(err);
          });
        }
        db.close();
      });
    });
  }

  //Used to calculate the fraud score and store the results in the db
  function fraudScore(name,valid,urlcodeJSON,results){
    var validHandles=valid.split(",");
    //Set base score
    var score=30;
    var scores=[];
    //Setup and encode a user query for the person who replied
    var query={
        screen_name:name,
        include_entities:false
    };
    query=urlcodeJSON.encode(query);

    //Search twitter for the user
    client.get(("users/show.json?"+query),function(error,tweets){
      if(error){
        console.log(error);
        return -1;
      }
      //If the user is a verified user set the fraud score to the base score
      if(tweets.verified){
        results.fraud= "%"+score;
      }
      else{
        //For each of the valid handles calculate the levenshtein distance from that name and the user who replied
        for(i=0;i<validHandles.length;i++){
          scores.push(editDistance(name,validHandles[i]));
        }
        //Calculate the score as 70 over the minimum levenshtein distance rounded to 2 decimal places
        var temp=+((70/Math.min.apply(Math,scores)).toFixed(2));
        //Add the score to the base and set the fraud score
        score=score+temp;
        results.fraud= "%"+score;
      }
      //Store the resulting reply and score
      MongoClient.connect(config.url, function (err, db) {
        collection = db.collection("tweets");
        collection.update({_id: results._id}, results, function (err, item) {
          console.log("Successfully Updated");
        });
        db.close();
      });
    });
  }

  function query(handle, storedTweets,client) {
    //Create query and encode
    var query = {
        q: "@"+handle,
        result_type: "recent",
        count: 20,
    };
    query=urlcodeJSON.encode(query);
    //Search the user on twitter and begin processing results
    client.get(("search/tweets.json?" + query), function (error, tweets) {
      if (error){
        console.log(error);
        return 0;
      }
      //If no tweets were found increase the attempts field and update in db
      if (tweets.statuses.length == 0) {
        storedTweets.attempts+=1;
        MongoClient.connect(config.url, function (err, db) {
          collection = db.collection("tweets");
          collection.update({_id: storedTweets._id}, storedTweets, function (err, item) {
            console.log("No Reply Mentions found");
          });
          db.close();
        });
        return 0;
      }
      //Begin processing all the tweets found
      for (i = 0; i < tweets.statuses.length; i++) {
        //If the tweets are not null and not retweet gather info else continue to next tweet
        if (tweets.statuses[i].in_reply_to_status_id_str!=null && tweets.statuses[i].text[0] != "R" && tweets.statuses[i].text[1] != "T") {
          replyId = (tweets.statuses[i].in_reply_to_status_id_str);
          name = tweets.statuses[i].user.name;
          screenName = tweets.statuses[i].user.screen_name;
          uid = tweets.statuses[i].id_str;
          text = tweets.statuses[i].text;
          dateTime = tweets.statuses[i].created_at;
          //If the tweet is in reply to the corrosponding tweet continue else go to next tweet
          if (storedTweets._id == replyId) {
            //Check to see if the tweet is offering help using checkHelp function
            if (checkHelp(text)) {
              results = storedTweets;
              //Find the time it took for the response and update relevant information
              results.responseTime=Math.round(((new Date(dateTime)- new Date(storedTweets.dateTime)%86400000)%3600000)/60000);
              results.replyFound = true;
              results.attempts+=1;
              results.lastReply = {"id": uid, "name": name, "screenName": screenName, "text": text, "dateTime": dateTime};
              //If the person responding is a verified screen name update the collection with zero percent fraud
              if (verified.includes(screenName)) {
                console.log("Corrosponding tweet found and verified\n");
                results.fraud = "%0";
                MongoClient.connect(config.url, function (err, db) {
                  collection = db.collection("tweets");
                  collection.update({_id: results._id}, results, function (err, item) {
                    //Update the replies found statistic
                    updateStatistics(true);
                    console.log("Successfully Updated");
                  });
                db.close();
                });
              }
              //Else calculate the fraud score and save update the collection
              else {
                console.log("Corrosponding tweet found and not verified\n");
                //Update the replies found statistic
                updateStatistics(false);
                results.fraud = "%"+fraudScore(screenName,verified,urlcodeJSON,results,MongoClient);
              }
              //Once a response has been found exit the loop and continue to the next user
              break;
            }
          }
        }
      }
      //If no conditions met increment the attempts counter
      storedTweets.attempts+=1;
      MongoClient.connect(config.url, function (err, db) {
        collection = db.collection("tweets");
        collection.update({_id: storedTweets._id}, storedTweets, function (err, item) {
          console.log("No Relevant Results");
        });
        db.close();
      });
    });
  }
}

//Function for calculating the levenshtein distane algorithm
function editDistance(st1,st2){
  var distance=[[]];
  //Initalize matrix for levenshtein costs
  for(i=0;i<=st2.length;i++){
    distance[i]=new Array(st1.length+1);
  }
  for(i=0;i<=st2.length;i++){
    distance[i][0]=i;
  }
  for(i=0;i<=st1.length;i++){
    distance[0][i]=i;
  }
  //Calculate the scores in each cell
  for(i=1;i<=st2.length;i++){
    for(j=1;j<st1.length+1;j++){
      cost=0;
      if(st1[i-1]!=st2[j-1]){
        cost=1;
      }
      temp=[];
      temp.push(distance[i-1][j]+1);
      temp.push(distance[i][j-1]+1);
      temp.push(distance[i-1][j-1]+cost);
      distance[i][j]=Math.min.apply(Math,temp);
    }
  }
  //Return the distance
  return(distance[st2.length][st1.length]);
}

//Used to see if a reply was offering help
function checkHelp(text){
  //see if the text contains any of the key terms if so return true
  var terms=["DM","Direct Message","help","helps","assist","feedback","customer","work with you","feel this way","concerning","private message","assistance","seems to be","issue","contacting you","let us know","worries us"];
  for(i=0;i<terms.length;i++){
    if(text.includes(terms[i])){
      return true;
    }
  }
  return false;
}

//Basic functions that are accessible by index.js using the require function
module.exports=function(MongoClient,config,urlcodeJSON){
  //Search the stored tweets once for replies
	this.singleReply=function(){
    //Find the verified handles from the databse then begin search
    MongoClient.connect(config.url, function (err, db) {
        collection = db.collection("constants");
        collection.find({name: "verifiedHandles"}).toArray(function (err, item) {
          db.close();
          searchReply(MongoClient,config,urlcodeJSON,item[0].value.toString());
        });
    });
	}
  //Search the stored tweets every minute for replies
	this.startReplyIndexing=function(){
    //Find the verified handles from the databse then begin search
    MongoClient.connect(config.url, function (err, db) {
        collection = db.collection("constants");
        collection.find({name: "verifiedHandles"}).toArray(function (err, item) {
          db.close();
          setInterval(function(){searchReply(MongoClient,config,urlcodeJSON,item[0].value.toString());},60000);
        });
    });
	}
}
