var fs = require("fs");
var path = require("path");
var express = require("express");
var _ = require("underscore");
var request = require("request");
var HeaderUtils = require("./utils/HeaderUtils");
var TwitterDataCollection = require("./collections/TwitterDataCollection");
var SerialPort = require("serialport");

var serialPort = new SerialPort.SerialPort("/dev/tty.usbmodem1411", {
  baudrate: 19200,
  parser: SerialPort.parsers.readline("\n")
});

var options = {};

module.exports = function (app, server, _options){

	options = _.extend(options, {
		serverTimeout: 10000,
		env: "dev"
	}, _options);

	router = express.Router();

	/**********************************************************
	 *
	 * Listeners for development to restart the server as the script changes
	 *
	 **********************************************************/

	if (options.env === "dev"){
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

	router.get("/pulse/trigger/:id", function(req, res, next){

		serialPort.write(req.params.id, function(err, results) {
		// console.log('err ' + err);
		// console.log('results ' + results);
		serialPort.once("data", function(data){
			// console.log(data);
			results = {results: data};
			HeaderUtils
				.addJSONHeader(res)
				.addCORSHeader(res);
			res.send(JSON.stringify(results));
		  });
		});
	});

	router.get("/twitter/cycle", function(req, res, next){
		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.fetchFromTwitter()
			.done(function(){
				twitterData.save()
					.done(next);
			});
	});

	router.get("/tweets/next", function(req, res, next){
		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.getNext()
			.done(function(){
				next();
			});
	}

	router.get("/tweets", function(req, res, next){
		var availableCommands = ["since"];
		var query = _.filter(req.query, function(param, key){
			return availableCommands.indexOf(key) > -1;
		});

		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.fetch(query)
			.done(function(){
				next();
			});
	});

	router.get("/",function (req, res, next) {
		var pathToFile = path.resolve(__dirname, "../data/data.json");
		fs.readFile(pathToFile, function (err, data) {
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
