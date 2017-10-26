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

    //front end tweet view
    app.use('/hidden',isLoggedIn, function(req, res) {
      send(res, "timeline.html");
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

    app.get('/getUsers',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var users=db.collection("users");
        users.find().project({_id:1,name:1,uname:1}).toArray(function(err,item){
          db.close();
          res.json(item);
        });
      });
    });

    app.get('/getTimeline',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        tweets.find({},{_id:1,score:1,handle:1}).sort({_id:-1}).toArray(function(err,item){
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

    app.get('/getSearches',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var searches=db.collection("searches");
        searches.find({}).toArray(function(err,item){
          db.close();
          res.json(item);
        });
      });
    });

    //Handle post events
    app.post('/getStats',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var stats=db.collection("statistics");
        var tweets=db.collection("tweets");
        stats.find({name:req.body.name}).toArray(function(err,item){
          var result = item[0];
          if(err) console.log(err);
          db.close();
          res.json(result);
        });
      });
    });
    //Add new search object
    app.post('/newSearch',isLoggedIn, function(req, res) {
      if(!(req.body.term.includes("@")||req.body.term.includes("#"))){
        res.send("Invalid input: Search term must include @ or #")
      }
      else{
        MongoClient.connect(url,function(err,db){
          var searches=db.collection("searches");
          var stats=db.collection("statistics");
          searches.insert({"name":req.body.name,"terms":[req.body.term],"verified":[req.body.handle],"lastID":["0"]});
          stats.insert({"name":req.body.name,"count":0,"negativeCount":0,"averageScore":0,"averageNegativeScore":0,"validRepliesFound":0,"fraudulentRepliesFound":0,"validResponseTime":0,"invalidResponseTime":0})
          db.close();
          console.log("Added Search");
          //TODO
          res.send("Success");
        });
      }
    });
    //Remove search object
    app.post('/deleteSearch',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var searches=db.collection("searches");
        var stats=db.collection("statistics");
        var tweets=db.collection("tweets");
        searches.remove({"name":req.body.name},function(err,result){
          stats.remove({"name":req.body.name},function(err,result){
            tweets.remove({"searchName":req.body.name},function(err,result){
              db.close();
              console.log("Deleted Search");
              res.send("Succesfull");
            });
          });
        });
      });
    });
    //Update Search object
    app.post("/updateSearches",isLoggedIn,function(req,res){
      //Get posted data and find record in db
      var data=req.body.data;
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("searches");
        collection.find().toArray(function(err,item){
          //Establish variables
          var change=false;
          var results=item[data.index];
          delete results._id;
          //Check if values were changed and if so update results to reflect
          if(data.deleteTerms){
            change=true;
            for(i=0;i<data.deleteTerms.length;i++){
              results.terms.splice(data.deleteTerms[i],1);
              results.lastID.splice(data.deleteTerms[i],1);
            }
          }
          if(data.newTerms){
            change=true;
            for(i=0;i<data.newTerms.length;i++){
              results.terms.push(data.newTerms[i]);
              results.lastID.push('0');
            }
          }
          if(data.newHandles){
            change=true;
            for(i=0;i<data.newHandles.length;i++){
              results.verified.push(data.newHandles[i]);
            }
          }
          if(data.deleteHandles){
            change=true;
            for(i=0;i<data.deleteHandles.length;i++){
              results.verified.splice(data.deleteHandles[i],1);
            }
          }
          //If there has been a change update the record in the db
          if(change){
            collection.update({"name": results.name}, results, function (err, item) {
              console.log("Updated searches");
              db.close();
              res.send("Status: OK");
            });
          }
        });
      });
    });

    //Update user info from general UAC form.
    app.post('/updateUser',isLoggedIn, function(req, res) {
      //Get post info
      req.user.name=req.body.name;
      req.user.uname=req.body.uname;
      req.user.email=req.body.email;
      //Find user by mongo ID in passport data
      var id=new mongo.ObjectID(req.user._id);
      temp=req.user;
      delete temp._id;
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("users");
        //Update user with new information
        collection.update({_id:id },temp, function (err, item) {
          console.log("Updated user info");
        });
        db.close();
      });
      //TODO
      res.send("Success");
    });
    //Delete user
    app.post('/deleteUser',isLoggedIn, function(req, res) {
      //Find user by mongo ID in passport data
      var id=new mongo.ObjectID(req.body.id);
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("users");
        //Update user with new information
        collection.remove({_id:id },function (err, item) {
          console.log("Deleted user");
        });
        db.close();
      });
      //TODO
      res.send("Success");
    });

    //Add new user
    app.post('/newUser',isLoggedIn, function(req, res) {
      //Get post info
      var name=req.body.name;
      var uname=req.body.uname;
      var email=req.body.email;
      var password=md5(req.body.password);

      MongoClient.connect(url,function(err,db){
        var collection=db.collection("users");
        //Add the user to the DB
        collection.insert({"name":name,"uname":uname,"email":email,"password":password});
        console.log("Added user");
        db.close();
      });
      //TODO
      res.send("Success");
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
        res.send("Success: Password Updated");
      }
      else{
        res.send("Failure: Old password is invalid");
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
        var stats=db.collection("statistics")
        tweets.remove({"_id":req.body.id},function(err,result){
          stats.findOneAndUpdate({name:req.body.name},{$inc:{"negativeCount":-1}},function(err,data){
            if(err) console.log(err);
            console.log("Deleted Record");
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
      console.log('Not logged in redirecting...');
    }

    //function to simplify sending front end elements
    function send(request, file) {
      request.sendFile(path.join(__dirname, ROOT_DIR, file));
    }
}
