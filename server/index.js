/* This is the index file, the main purpouse is to import dependencies
and manage all other tasks it is the entry point to the application.
to run simply node index.js
Created by: Caleb Riggs
*/

//import packages
var express = require('express');
var passport = require('passport');
var urlcodeJSON=require("urlcode-json");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var fs = require('fs');
var MongoClient=require('mongodb').MongoClient;
var mongo=require('mongodb');
var md5 = require('md5');
var config;

//try to load config file
try {
	config = JSON.parse(fs.readFileSync('./config/authorization.json', 'utf8'));
} catch (e) {
	console.error('No config file found. Using defaults.');
}
//get data from config
const DEBUG=config.debug;
const url=config.url;

//require search and replySearch files for twitter integration and pass dependencies along with db managment
require("./search.js")(MongoClient,config,urlcodeJSON);
require("./replySearch.js")(MongoClient,config,urlcodeJSON);
require("./manage.js")(MongoClient,config);

//use searches startSearch function and replySearch startReplyIndexing functions
//To start searching for tweets and replies
if(!DEBUG){
	startSearch();
	startReplyIndexing();
	startManage();
}
singleReply()
//require passport for authentication, pass it dependencies
require('./config/passport')(MongoClient, passport,mongo,md5,config.url);
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

//require routes for front end integration and REST endpoints
require('./routes.js')(app,passport, express, MongoClient,urlcodeJSON,DEBUG,config.url,mongo,md5);
var port=parseInt(config.port);
app.listen(port, function () {
    console.log('Example app listening on port' + port);
});
