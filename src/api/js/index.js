var fs = require("fs");
var path = require("path");
var express = require("express");
var bodyParser = require('body-parser');
var _ = require("underscore");
var request = require("request");
var ResponseUtils = require("./utils/ResponseUtils");
var HeaderUtils = require("./utils/HeaderUtils");
var TwitterDataCollection = require("./collections/TwitterDataCollection");
var TweetModel = require("./models/TweetModel");
var SerialPort = require("serialport");

var serialPort = new SerialPort.SerialPort("/dev/tty.usbmodem1411", {
  baudrate: 19200,
  parser: SerialPort.parsers.readline("\n")
});
serialPort.setMaxListeners(128);

var options = {};

module.exports = function (app, server, _options){

	options = _.extend(options, {
		serverTimeout: 10000,
		env: "dev"
	}, _options);

	router = express.Router();


	router.use(bodyParser.json());
	router.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE");
		next();
	});

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
		serialPort.once("data", function(data){
			results = {results: data};
			HeaderUtils.addJSONHeader(res);
			HeaderUtils.addCORSHeader(res);
			res.send(JSON.stringify(results));
		  });
		});
	});

	router.get("/songs/cycle", function(req, res, next){
		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.fetchFromTwitter()
			.done(function(){
				twitterData.save()
					.done(next);
			});
	});

	router.get("/songs/next", function(req, res, next){
		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.getNext()
			.done(next);
	});

	router.get("/songs/current", function(req, res, next){
		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.getCurrent()
			.done(next);
	});
	
	router.get("/songs/advance", function(req, res, next){
		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.advance()
			.done(next);
	});
	
	router.get("/songs/play/:id", function(req, res, next){
		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.stop()
			.then(function(){
				play(req.params.id);
			})
			.done(next);
	});

	router.put("/songs/:id", function(req, res, next){
		var tweet = new TweetModel({id: req.params.id});

		tweet.fetch()
			.then(function(){
				tweet.set(req.body);
			})
			.then(function(){
				tweet.save();
			})
			.then(function(){
				ResponseUtils.sendData(res, {"result": req.params.id + " updated"});
			})
			.done(next);
	});

	router.get("/songs", function(req, res, next){
		var availableCommands = ["since"];
		var query = _.pick(req.query, availableCommands);

		var twitterData = new TwitterDataCollection([]);
		twitterData.response = res;
		twitterData.fetch({query:query})
			.done(next);
	});

	router.put("/songs", function(req, res, next){
		var twitterData = new TwitterDataCollection(req.body);
		twitterData.response = res;
		twitterData.save()
			.done(next);
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
