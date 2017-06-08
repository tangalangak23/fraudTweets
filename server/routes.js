const ROOT_DIR = "../frontEnd/";
module.exports = function (app, passport, express, MongoClient) {
    var path = require('path');
    app.use(express.static(ROOT_DIR));

    app.use('/home', function(req, res) {
        send(res, "dashboard.html");
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
            res.redirect('/login');
            console.log('Not logged in; redirecting...');
    }

    function send(request, file) {
        request.sendFile(path.join(__dirname, ROOT_DIR, file));
    }
}
