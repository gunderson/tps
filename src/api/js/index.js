var fs = require("fs");
var path = require("path");
var express = require("express");
var _ = require("underscore");
var request = require("request");
var dataServiceUtils = require("./utils/DataService");
var TwitterDataCollection = require("./collections/TwitterDataCollection");


var options = {};

var twitterData = new TwitterDataCollection([], {
	filePath: path.resolve(__dirname, "../data/data.json"),
	namespace: "twitter"
});

module.exports = function (app, server, _options){

	options = _.extend(options, {
		serverTimeout: 2000,
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


	router.get("/twitter/cycle", function(req, res, next){
		twitterData.response = res;
		twitterData.fetch();
	});

	router.get("/twitter/:since", function(req, res, next){
		getTwitterAccessToken(function(token){
			console.log(token);
			setAsJSON(res);
			res.send('{ "since": "'+ req.params.since +'" }');
			next();
		});
	});

	router.get("/",function (req, res, next) {
		var pathToFile = path.resolve(__dirname, "../data/data.json");
		fs.readFile(pathToFile, function (err, data) {
			if (err) throw err;
			setAsJSON(res);
			res.send(data);
			next();
		});
	});

	app.use('/', router);

};


function setAsJSON(res){
	res.set("content-type", "application/json");
	return res;
}

function closeConnection(socket) {
	// force a short timeout on client connections so we can cycle the server quickly
	socket.setTimeout(options.serverTimeout);
}