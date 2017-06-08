var express = require('express');
var app = express();
var fs = require('fs');
var MongoClient=require('mongodb').MongoClient;
var config;
try {
	config = JSON.parse(fs.readFileSync('authorization.json', 'utf8'));
} catch (e) {
	console.log('No config file found. Using defaults.');
}

require("./search.js")(MongoClient,config);

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.use(session({
	secret: 'fraudTweetsAuthSecretHere',
	resave: true,
	saveUninitialized: true
 } ));

 app.use(passport.initialize());
 app.use(passport.session());

 require('./routes.js')(app,passport, express, MongoClient);
var port=config.port;
app.listen(port, function () {
    console.log('Example app listening on port' + port);
});
