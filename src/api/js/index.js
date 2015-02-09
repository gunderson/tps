var ResponseUtils = require("./utils/ResponseUtils");

var HeaderUtils = require("./utils/HeaderUtils");



var fs = require("fs");
var path = require("path");
var express = require("express");
var bodyParser = require('body-parser');
var _ = require("underscore");
var request = require("request");

var options = {};

module.exports = function(app, server, _options) {

	options = _.extend(options, {
		serverTimeout: 10000,
		env: "dev"
	}, _options);

	router = express.Router();


	router.use(bodyParser.json());
	router.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content-Type, Accept");
		res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE");
		next();
	});

	/**********************************************************
	 *
	 * Listeners for development to restart the server as the script changes
	 *
	 **********************************************************/

	if (options.env === "dev") {
		server.on('connection', closeConnection);
		server.once('close', function(socket) {
			server.removeListener('connection', closeConnection);
		});
	}


	/**********************************************************
	 *
	 * Params for dynamic urls
	 *
	 **********************************************************/

	/*router.param('since', function(req, res, next, since){
		req.since = since;
		next();
	});*/


	/**********************************************************
	 *
	 * Routes
	 *
	 **********************************************************/

	router.get("/pulse/trigger/:id", function(req, res, next) {

	});


	router.get("/", function(req, res, next) {
		var pathToFile = path.resolve(__dirname, "../data/data.json");
		fs.readFile(pathToFile, function(err, data) {
			if (err) throw err;
			HeaderUtils.addJSONHeader(res);
			res.send(data);
			next();
		});
	});


	// API Routes
	// GET latest songs with status ok
	// PUT song status (:id) with json data
	// if order is changed
	// update other tweets order
	// DELETE song (:id)



	app.use('/', router);

};


function closeConnection(socket) {
	// force a short timeout on client connections so we can cycle the server quickly
	socket.setTimeout(options.serverTimeout);
}
