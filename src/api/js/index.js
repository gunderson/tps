var fs = require("fs");
var path = require("path");


module.exports = function (app){


	app.use("/",function (req, res, next) {
		var pathToFile = path.resolve(__dirname, "./data/data.json")
		fs.readFile(pathToFile, function (err, data) {
			if (err) throw err;
			res.set("content-type", "application/json");
			res.send(data);
			console.log("test")
			next();
		});
	})

}