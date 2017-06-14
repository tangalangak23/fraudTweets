const ROOT_DIR = "../frontEnd/";
module.exports = function (app, passport, express, MongoClient,client,urlcodeJSON,DEBUG,url) {
    var path = require('path');
    app.use(express.static(ROOT_DIR));

    app.use('/home',isLoggedIn, function(req, res) {
      send(res, "dashboard.html");
    });

    app.use('/configHandles',isLoggedIn, function(req, res) {
      send(res, "handles.html");
    });

    app.post('/login', passport.authenticate('local-login', {
      successRedirect: '/home', // redirect to the secure profile section
      failureRedirect: '/' // redirect back to the signup page if there is an error
    }));

    app.get('/getTweets',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        tweets.find().toArray(function(err,item){
          db.close();
          res.json(item);
        });
      });
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

    app.post('/updateHandles',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var collection=db.collection("constants");
        collection.update({name: "verifiedHandles"},{name:"verifiedHandles",value:req.body.newHandles}, function (err, item) {
          console.log("Updated handles");
        });
        db.close();
      });
    });

    app.post('/getTweetInfo',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        tweets.find({"id":req.body.id}).toArray(function(err,item){
          db.close();
          res.json(item[0]);
        });
      });
    });

    app.post('/resetAttempts',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        tweets.find({"id":req.body.id}).toArray(function(err,item){
          item[0].attempts=0;
          tweets.update({"id": req.body.id}, item[0], function (err, item) {
            console.log("Reset Attempts");
          });
          db.close();
        });
      });
    });

    app.post('/deleteRecord',isLoggedIn, function(req, res) {
      MongoClient.connect(url,function(err,db){
        var tweets=db.collection("tweets");
        tweets.remove({"id":req.body.id},function(err,result){
          db.close();
          return 0;
        });
      });
    });

    app.get('/logout', function(req, res) {
      req.logout();
      res.redirect('/');
    });

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

    function send(request, file) {
      request.sendFile(path.join(__dirname, ROOT_DIR, file));
    }
}
