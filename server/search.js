/* The purpouse of this file is to search twitter for tweets at search terms,
check the sentiment, store the tweet info, and update the statistics.
Created By: Caleb Riggs
*/

var sentiment=require("sentiment");
var assert=require('assert');
var Twitter=require("twitter");
var config;
var lastID;

//This function handles all the necessary functions for searching and storing
function searchTweets(MongoClient,config,urlcodeJSON){
  //Connect to mongo db and pull relevant information to start the search
  MongoClient.connect(config.url,function(err,db){
    var searches=db.collection("searches");
    //Find search entries
    searches.find({}).toArray(function(err,item){
      for(i=0;i<item.length;i++){
        for(j=0;j<item[i].terms.length;j++){
          //Select the appropriate authorization key to use from the config file
          keyNum=j%config.keys.length;
          //Get relevant info from db record
          lastID=item[i].lastID;
          handle=item[i].terms[j];
          //Create a twitter client with the key selected above
          client=new Twitter({
            consumer_key:config.keys[keyNum].CONSUMER_KEY,
            consumer_secret:config.keys[keyNum].CONSUMER_SECRET,
            access_token_key: config.keys[keyNum].ACCESS_KEY,
            access_token_secret: config.keys[keyNum].ACCESS_SECRET
          });
          //Run the search given the information from above
          query(handle,lastID,client,item[i].name,j)
        }
      }
    });
    db.close();
  });

  //Update the general statistics
  function updateStatistics(stats,name){
    if(stats.length==0){
      return -1;
    }
    //Open db connection,
    MongoClient.connect(config.url,function(err,db){
      var statsCollection=db.collection("statistics");
      //Find the current statistics in the database
      statsCollection.find({"name":name}).toArray(function(err,item){
        var totalSum=0;
        var negativeSum=0;
        var negativeCount=0;
        //Calculate the average of the current set of data and the count
        for(i=0;i<stats.length;i++){
          totalSum+=stats[i];
          if (stats[i]<0){
            negativeSum+=stats[i];
            negativeCount+=1;
          }
        }
        results=item[0];
        //For first run of statistics add inital records else update
        if(results.count==0){
          results.count=stats.length;
          results.negativeCount=negativeCount;
          results.averageScore=results.averageScore+(totalSum/stats.length);
          if(negativeCount!=0){
            results.averageNegativeScore=results.averageNegativeScore+(negativeSum/negativeCount);
          }
          statsCollection.update({"name":name},results,function (err, item) {
              console.log("Successfully Updated statistics");
          });
        }
        else{
          results.count+=stats.length;
          results.negativeCount+=negativeCount;
          results.averageScore=(((results.averageScore*results.count)+((totalSum/stats.length)*stats.length))/(results.count+stats.length));
          if(negativeCount!=0){
            results.averageNegativeScore=(((results.averageNegativeScore*results.negativeCount)+((negativeSum/negativeCount)*negativeCount))/(results.negativeCount+negativeCount));
          }
          statsCollection.update({"name":name},results,function (err, item) {
              console.log("Successfully Updated statistics");
          });
        }
        db.close();
      });
    });


  }

  //Get a users average sentiment score
  function getAverageScore(client,id,name,tweetInfo){
    //Setup a query for user timeline
    var query={
      screen_name:name,
    	count:30,
    	exclude_replies:true,
      include_rts:false
    };
    query=urlcodeJSON.encode(query);
    //Get the users last 20 tweets filtering replies and re tweets
    client.get(("statuses/user_timeline.json?"+query),function(error,tweets){
      if(error){
        console.log(error);
        return -1;
      }
      //Calculate the users average sentiment
    	var average=0;
    	for(i=0;i<tweets.length;i++){
    		average=average+(sentiment(tweets[i].text).score);
    	}
    	tweetInfo.user.averageScore=(average/tweets.length).toFixed(2);
      //Add the users averageScore to the db
      MongoClient.connect(config.url,function(err,db){
  			var tweets=db.collection("tweets");
        tweets.update({"_id":id},tweetInfo,function(err,result){
        });
  			db.close();
  		});
    });
  }

  function query(handle,lastID,client,searchName,index){
    var scores=[];
    //Setup and encode query to be used with Twitter
    var query={
      q:encodeURIComponent(handle),
      result_type:"recent",
      count:100,
      since_id:lastID[index]
    };
    query=urlcodeJSON.encode(query);

    //search twitter for the the query constructed above
    client.get(("search/tweets.json?"+query),function(error,tweets){
      //If twitter returns an error log the query and error then return -1
      if(error){
        console.log(query);
        console.log(error);
        return -1;
      }
      //Initialize mongo connection that will be used for storing tweets
      MongoClient.connect(config.url,function(err,db){
        //If there's an error assert
        assert.equal(null,err);
        console.log("Running search...");
        var length=tweets.statuses.length;
        //If no tweets were found close the db connection and end
        if(length==0){
           db.close();
           console.log("Search complete\n");
           return 0;
        }
        //For each of the tweets found
        for(i=0;i<length;i++){
          //If the tweet is not a reply and not a retweet
          if(!tweets.statuses[i].in_reply_to_status_id_str && tweets.statuses[i].text[0]!="R" && tweets.statuses[i].text[1]!="T"){
            //Gather tweet info
            uid=tweets.statuses[i].id_str;
            name=tweets.statuses[i].user.name,
            screenName=tweets.statuses[i].user.screen_name;
            text=tweets.statuses[i].text;
            //Find the sentiment score using the sentiment package
            score=sentiment(text).score;
            //Add the score to the gobal score list
            scores.push(score);
            console.log(name+"\n"+uid+"\n--------------");
            console.log(text+"\n"+score+"\n\n\n");
            //If the score is less than zero create object and store in db
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
              "searchName":searchName,
              "replyFound":false,
              "fraud":null,
              "attempts":0,
              "lastReply":null
            };
              db.collection('tweets').insert(tweet);
              //Get Users average score for user statistics
              getAverageScore(client,uid,screenName,tweet);
           }
          }
        }
        //Update general statistics and the lastID found in the db
        updateStatistics(scores,searchName);
        var searches=db.collection("searches");
        lastID[index]=tweets.statuses[0].id_str;
        searches.update({"name":searchName},{$set:{"lastID":lastID}});
        console.log("Search complete\n");
        db.close()
      });
    });
  }
}


//Basic functions that are accessible by index.js using the require function
module.exports=function(MongoClient,config,urlcodeJSON){

  //Run a single search of search terms
	this.singleSearch=function(){
		searchTweets(MongoClient,config,urlcodeJSON);
	}

  //Run a single search of the search terms and set up a recuring search every minute (60000 miliseconds)
	this.startSearch=function(){
		searchTweets(MongoClient,config,urlcodeJSON);
		setInterval(function(){searchTweets(MongoClient,config,urlcodeJSON);},60000);
	}
}
