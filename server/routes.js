const ROOT_DIR = "../frontEnd/";
module.exports = function (app, passport, express, MongoClient) {
    var path = require('path');
    app.use(express.static(ROOT_DIR));

    app.use('/', function(req, res) {
        send(res, "login.html");
    });
}
