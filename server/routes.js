const ROOT_DIR = "../frontEnd/";
module.exports = function (app, passport, express, MongoClient) {
    var path = require('path');
    app.use(express.static(ROOT_DIR));

    app.use('/home',isLoggedIn, function(req, res) {
        send(res, "dashboard.html");
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/' // redirect back to the signup page if there is an error
    }));

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
            if (req.isAuthenticated())
                return next();

            // if they aren't redirect them to the home page
            res.redirect('/');
            console.log('Not logged in; redirecting...');
    }

    function send(request, file) {
        request.sendFile(path.join(__dirname, ROOT_DIR, file));
    }
}
