/* This file manages the front end and rest requests along with any post request
to update the database.
Created By: Caleb Riggs
*/

//establish the frontEnd director structure
const ROOT_DIR = "../frontEnd/";
module.exports = function (app, passport, express, MongoClient,urlcodeJSON,DEBUG,url,mongo,md5) {
    //pull additional dependency
    var path = require('path');
    //set root directory for front end elements
    app.use(express.static(ROOT_DIR));

    //serve front end pages
    app.use('/home',isLoggedIn, function(req, res) {
      send(res, "dashboard.html");
    });

    //handle login event
    app.post('/login', passport.authenticate('local-login', {
      successRedirect: '/home', // redirect to the secure profile section
      failureRedirect: '/' // redirect back to the signup page if there is an error
    }));

    //handle rest requests to get data from mongoDB
    app.get('/getTweets',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        tweets.find().toArray(function(err,item){
          db.close();
          res.json(item);
        });
      });
    });

    app.get('/getUser',isLoggedIn, function(req, res) {
      temp=req.user;
      delete temp.password;
      delete temp._id;
      res.json(temp);
    });

    app.get('/getHandles',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("constants");
        collection.find({name:"verifiedHandles"}).toArray(function(err,item){
          db.close();
          res.json(item[0]);
        });
      });
    });

    app.get('/getTerms',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("constants");
        collection.find({name:"lastID"}).toArray(function(err,item){
          db.close();
          res.json(item);
        });
      });
    });

    app.get('/getStats',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("constants");
        var tweets=db.collection("tweets");
        collection.find({name:"statistics"}).toArray(function(err,item){
          var result = item[0];
          tweets.aggregate([{$match:{replyFound:true}},{$group:{_id:"$replyFound",average:{$avg:"$responseTime"}}}]).toArray(function(err,data){
            if(err) console.log(err);
            result.averageResponseTime=data[0].average;
            db.close();
            res.json(result);
          });
        });
      });
    });

    //Handle post events

    //Update the stored handles in the database from a post in the front end with the format
    //{newhandles:["HANDLE","HANDLE"]}
    app.post('/updateHandles',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("constants");
        collection.update({name: "verifiedHandles"},{name:"verifiedHandles",value:req.body.newValues}, function (err, item) {
          console.log("Updated handles");
        });
        db.close();
      });
    });

    //Update the search terms
    app.post('/updateTerms',isLoggedIn, function(req, res) {
      var current="";
      //get the new terms from the post
      var newTerms=req.body.newValues;
      //get the current terms from mongo
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("constants");
        collection.find({name:"lastID"}).toArray(function(err,item){
          db.close();
          var temp=newTerms.toString();
          //if there are terms in existing not in new remove the terms
          for(i=0;i<item.length;i++){
            current+=item[i].handle+",";
            if(!temp.includes(item[i].handle)){
              MongoClient.connect(url,function(err,db){
                var collection=db.collection("constants");
                collection.remove({handle:item[i].handle},function(err,result){
                  if(err){
                    db.close();
                    console.log(err);
                  }
                  db.close();
                });
              });
            }
          }
          //if there are terms in new not in existing add to mongo
          for(i=0;i<newTerms.length;i++){
            if(!current.includes(newTerms[i])){
              console.log("newTerm");
              updateTerms(newTerms[i]);
            }
          }
        });
      });
    });

    //function for adding new terms to mongo used by /updateTerms
    function updateTerms(newTerm){
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("constants");
        db.collection('constants').insert({"name":"lastID","value":"0","handle":newTerm});
        db.close();
      });
    }

    //update user info from general UAC form.
    app.post('/updateUser',isLoggedIn, function(req, res) {
      //get post info
      req.user.name=req.body.name;
      req.user.uname=req.body.uname;
      req.user.email=req.body.email;
      //find user by mongo ID in passport data
      var id=new mongo.ObjectID(req.user._id);
      temp=req.user;
      delete temp._id;
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("users");
        //update user with new information
        collection.update({_id:id },temp, function (err, item) {
          console.log("Updated user info");
        });
        db.close();
      });
      res.redirect("/home");
    });

    //update user password from update password form
    app.post('/updatePassword',isLoggedIn, function(req, res) {
      //get the users current password from post
      temp=req.body.currentPassword;
      temp=md5(temp);
      //verify user by checking current password
      if(req.user.password==temp){
        //get user id to update password in database
        var id=new mongo.ObjectID(req.user._id);
        temp=req.user;
        delete temp._id;
        temp.password=md5(req.body.newPassword);
        MongoClient.connect(url,function(err,db){
          var collection=db.collection("users");
          collection.update({_id:id },temp, function (err, item) {
            console.log("Updated user password");
          });
          db.close();
        });
        res.redirect("/home");
      }
      else{
        res.redirect("/home");
      }
    });

    //get the specific tweet info given id
    app.post('/getTweetInfo',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        tweets.find({"_id":req.body.id}).toArray(function(err,item){
          db.close();
          res.json(item[0]);
        });
      });
    });

    //reset the attempts count on a tweeet
    app.post('/resetAttempts',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        tweets.find({"_id":req.body.id}).toArray(function(err,item){
          item[0].attempts=0;
          tweets.update({"_id": req.body.id}, item[0], function (err, item) {
            console.log("Reset Attempts");
          });
          db.close();
        });
      });
    });

    //delete the tweet from the database
    app.post('/deleteRecord',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        var stats=db.collection("constants")
        tweets.remove({"_id":req.body.id},function(err,result){
          stats.findOneAndUpdate({name:"statistics"},{$inc:{"negativeCount":-1}},function(err,data){
            if(err) console.log(err);
          })
          db.close();
          return 0;
        });
      });
    });

    //logout
    app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
    });

    //redirect requests to the default login page
    app.use('/', function(req, res) {
      send(res, "login.html");
    });


    function isLoggedIn(req, res, next) {
      // return next();
      // if user is authenticated in the session, carry on
      if (req.isAuthenticated() || DEBUG)
          return next();

      // if they aren't redirect them to the home page
      res.redirect('/');
      console.log('Not logged in; redirecting...');
    }

    //function to simplify sending front end elements
    function send(request, file) {
      request.sendFile(path.join(__dirname, ROOT_DIR, file));
    }
}
