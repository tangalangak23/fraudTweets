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

var client= new Twitter({
	consumer_key:config.CONSUMER_KEY,
	consumer_secret:config.CONSUMER_SECRET,
	access_token_key: config.ACCESS_KEY,
	access_token_secret: config.ACCESS_SECRET
});

require("./search.js")(MongoClient,config,client,urlcodeJSON);
startSearch();

require("./replySearch.js")(MongoClient,config,client,urlcodeJSON);
startReplyIndexing();

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

require('./routes.js')(app,passport, express, MongoClient,client,urlcodeJSON,DEBUG,url);
var port=parseInt(config.port);
app.listen(port, function () {
    console.log('Example app listening on port' + port);
});
