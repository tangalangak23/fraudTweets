// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;


// expose this function to our app using module.exports
module.exports = function (MongoClient, passport,mongo,md5,url) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (_id, done) {
      MongoClient.connect(url,function(err,db){
        var users=db.collection("users");
        tempID=new mongo.ObjectID(_id);
        users.find({"_id":tempID}).toArray(function(err,item){
          db.close();
          done(err,item[0]);
      });
    });
  });


    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
            function (req, username, password, done) { // callback with email and password from our form
              MongoClient.connect(url,function(err,db){
                var constants=db.collection("users");
                constants.find({"uname":username}).toArray(function(err,item){
                  db.close();
                  if (!item.length) {
                      return done(null, false, console.log("no user found")); // req.flash is the way to set flashdata using connect-flash
                  }
                  lastID=item[0].value;

                  if (item[0].password.toString() != md5(password)){
                      return done(null, false, console.log("Wrong Password")); // create the loginMessage and save it to session as flashdata
                  }
                  // all is well, return successful user
                  return done(null, item[0]);
                });
              });
            }));
};
