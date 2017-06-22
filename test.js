var urlcodeJSON=require("urlcode-json");
var fs = require('fs');
var Twitter=require("twitter");
var sentiment=require("sentiment");
var config;
try {
	config = JSON.parse(fs.readFileSync('./server/config/authorization.json', 'utf8'));
} catch (e) {
	console.log('No config file found. Using defaults.');
}

client=new Twitter({
  consumer_key:config.keys[3].CONSUMER_KEY,
  consumer_secret:config.keys[3].CONSUMER_SECRET,
  access_token_key: config.keys[3].ACCESS_KEY,
  access_token_secret: config.keys[3].ACCESS_SECRET
});
console.log("Hello");
var query={
  screen_name:"NanoAged",
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
	average=(average/tweets.length).toFixed(2);
	console.log(average);
});
console.log("World");
