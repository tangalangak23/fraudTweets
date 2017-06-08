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
