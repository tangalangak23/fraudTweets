var urlcodeJSON=require("urlcode-json");
var fs = require('fs');
var Twitter=require("twitter");
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

var query={
  screen_name:"_carloslehder_",
  include_entities:false
};
query=urlcodeJSON.encode(query);

client.get(("users/show.json?"+query),function(error,tweets){
  if(error){
    console.log(error);
    return -1;
  }
  console.log(tweets);
});

console.log(encodeURIComponent("#spring"))