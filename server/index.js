var express = require('express');
var passport = require('passport');
var Twitter=require("twitter");
var urlcodeJSON=require("urlcode-json");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var fs = require('fs');
var MongoClient=require('mongodb').MongoClient;
var mongo=require('mongodb');
var config;
try {
	config = JSON.parse(fs.readFileSync('./config/authorization.json', 'utf8'));
} catch (e) {
	console.log('No config file found. Using defaults.');
}
const DEBUG=config.debug;
const url=config.url;

var tweetClient= new Twitter({
	consumer_key:config.CONSUMER_KEY1,
	consumer_secret:config.CONSUMER_SECRET1,
	access_token_key: config.ACCESS_KEY1,
	access_token_secret: config.ACCESS_SECRET1
});

var replyClient= new Twitter({
	consumer_key:config.CONSUMER_KEY2,
	consumer_secret:config.CONSUMER_SECRET2,
	access_token_key: config.ACCESS_KEY2,
	access_token_secret: config.ACCESS_SECRET2
});

require("./search.js")(MongoClient,config,tweetClient,urlcodeJSON);
reset();

require("./replySearch.js")(MongoClient,config,replyClient,urlcodeJSON);
//singleReply();

require('./config/passport')(MongoClient, passport,mongo);
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.use(session({
	secret: 'fraudTweetsAuthSecretHere',
	resave: true,
	saveUninitialized: true
 }));

app.use(passport.initialize());
app.use(passport.session());

require('./routes.js')(app,passport, express, MongoClient,tweetClient,urlcodeJSON,DEBUG,url);
var port=parseInt(config.port);
app.listen(port, function () {
    console.log('Example app listening on port' + port);
});
