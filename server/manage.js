/* The purpouse of this file is to manage the records in the databse
Created By: Caleb Riggs
*/

//Add unique dependency
var schedule=require('node-schedule');
//Reset the attempts of a random tweet in the db
function randomAttempt(MongoClient,config){
  //Find all tweets that meet the reset criteria
  MongoClient.connect(config.url,function(err,db){
    if(err) console.error(err);
    var tweets=db.collection("tweets");
    tweets.find({replyFound:false,attempts:{$gt:19}}).toArray(function(err,data){
      //Select a random tweet from the results set the attempts to 10 then update
      if(data.length==0){
        return 0;
      }
      var itemNum=Math.floor(Math.random()*data.length);
      item=data[itemNum];
      item.attempts=28;
      tweets.update({_id:item._id},item,function(err,res){
        if(err){
          console.error(err);
        }
      });
    });
  });
}

//Remove all tweets that have no replies and have been searched 30 or more times
function clean(MongoClient,config){
  MongoClient.connect(config.url,function(err,db){
    if(err){
      console.error(err);
      return -1;
    }
    var tweets=db.collection("tweets");
    tweets.remove({replyFound:false,attempts:{$gt:19}},function(err){
      if(err){
        console.error(err);
        rerturn -1;
      }
    });
  });
}

//Reset the database (excludes users and any terms)
function reset(MongoClient,config){
  MongoClient.connect(config.url,function(err,db){
    if(err) console.error(err);
    var tweets=db.collection("tweets");
    var stats=db.collection("statistics");
    var searches=db.collection("searches");
    //Reset statistics
    stats.updateMany({},{$set:{count:0,negativeCount:0,averageScore:0,averageNegativeScore:0,validRepliesFound:0,fraudulentRepliesFound:0}},function(err,item){
      if(err){
        console.error(err);
        return -1;
      }
      //Reset lastID found
      searches.updateMany({},{$set:{lastID:[]}},function(err,item){
        if(err){
          console.error(err);
          return -1;mo
        }
        //Remove all tweets
        tweets.remove({},function(err,results){
          if(err){
            console.error(err);
            return -1;
          }
        });
      });
    });
  });
}

//Basic functions that are accessible by index.js using the require function
module.exports=function(MongoClient,config){

  //Reset a single random records attempts to allow it to be searched again
	this.singleAttempt=function(){
		randomAttempt(MongoClient,config);
	}

  //Remove all records that no response have been found and the attempts are greater than or equal to 30
	this.singleClean=function(){
		clean(MongoClient,config);
	}

  //Reset the whole database removing records statistics and LastID records
	this.reset=function(){
		reset(MongoClient,config);
	}

  //Start recuring random reset function and nightly clean
	this.startManage=function(){
    schedule.scheduleJob('0 0 * * *',function(){clean(MongoClient,config);});
		setInterval(function(){randomAttempt(MongoClient,config);},120000);
	}
}
