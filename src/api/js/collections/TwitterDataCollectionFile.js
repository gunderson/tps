var Backbone = require("Backbone");
var _ = require("underscore");
var fs = require("fs");
var Twit = require('twit');
var dataServiceUtils = require("../utils/DataService");

var T = new Twit({
    consumer_key:         "w4vvYl5k33zXzfkGac9UyTZib",
    consumer_secret:      "biKcNyJ4tXdjP6I7pYezHzw6Mg06qucwMDpLUvCxCs8J9WaIAR",
    access_token:         "9146482-KfCHb2cuoEsggw8U5f3HbkcUgS7Zb2YLJ74AJ0Nqmk",
    access_token_secret:  "v6FMEkgm4LmGMqFce9YLKvv6o55FQY6znTn0gExIGTv1l"
});

var TwitterDataCollection = Backbone.Collection.extend({
	filePath: "",
	ttl: 1000 * 10,
	timestamp: 0,
	response: null,
	namespace: "",
	initialize: function(models, options){
		_.extend(this, options);
		this.on("reset add", function(){
			console.log("reset");
		});
	},
	fetch: function(){
		var _this = this;

		//if timed out, or no data in this
		var deltaTime = Date.now() - this.timestamp;

		// local data is fresh, return data
		if (deltaTime < this.ttl){
			// console.log("use local data");
			return sendData(this.response, this.toJSON() );
		} else {
			// check the cache
			fs.readFile(this.filePath, function (err, readableData) {
				if (err) throw err;
				
				data = JSON.parse(readableData.toString());

				if (data[_this.namespace] ){
					//if the data exists in the cache
					_this.timestamp = data[_this.namespace].timestamp;

					if (Date.now() - _this.timestamp < _this.ttl) {	
						// data in cache is fresh, return data
						// console.log("use data from cache");
						_this.set(data[_this.namespace].data);
						return sendData(_this.response, data[_this.namespace].data);
					}
				}
				// console.log("get new data");
				getNewData(_.bind(_this.parse, _this));
			});
		}
	},
	parse: function(err, data){
		this.timestamp = Date.now();
		data = data.statuses;
		this.reset(data);
		sendData(this.response, data);
		this.save();
		return data;
	},
	save: function(){
		var _this = this;
		fs.readFile(this.filePath, function (err, readableData) {
			//add to namespace
			var newData = JSON.parse(readableData);
			newData[_this.namespace] = {
				timestamp: _this.timestamp,
				data: _this.toJSON()
			};
			//write to file
			fs.writeFile(_this.filePath, JSON.stringify(newData), {encoding: "utf-8"} );
		});
	}
});

function getNewData(cb){
	T.get('search/tweets', { q: '#WGW', count: 100 }, cb);
}

function sendData(response, data){
	dataServiceUtils.setAsJSON(response);
	response.send(JSON.stringify(data));
}

module.exports = TwitterDataCollection;