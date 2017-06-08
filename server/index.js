var express = require('express');
var passport = require('passport');
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

require("./search.js")(MongoClient,config);
singleSearch();

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

require('./routes.js')(app,passport, express, MongoClient);
var port=parseInt(config.port);
app.listen(port, function () {
    console.log('Example app listening on port' + port);
});
