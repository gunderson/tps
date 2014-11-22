var Backbone = require("Backbone");
var _ = require("underscore");
var fs = require("fs");
var Twit = require('twit');

var T = new Twit({
    consumer_key:         "w4vvYl5k33zXzfkGac9UyTZib",
    consumer_secret:      "biKcNyJ4tXdjP6I7pYezHzw6Mg06qucwMDpLUvCxCs8J9WaIAR",
    access_token:         "9146482-KfCHb2cuoEsggw8U5f3HbkcUgS7Zb2YLJ74AJ0Nqmk",
    access_token_secret:  "v6FMEkgm4LmGMqFce9YLKvv6o55FQY6znTn0gExIGTv1l"
});

function DataService(options){
	this.options = _.extend({
		filePath: "",
		ttl: 1000,
		response: null,
		namespace: ""
	}, options);

	if (!this.options.filePath) console.error("filePath Required");
	if (!this.options.response) console.error("response Required");


	this.lastRequestTime = 0;
	this.data = {};

	return this;
}

DataService.prototype = _.extend({}, Backbone.Events);


DataService.prototype.processNewData = function(newData){
	this.lastRequestTime = Date.now();
	this.data = newData;
	//write data
	this.saveNewData();
};

DataService.prototype.saveNewData = function(){
	//write data to tile
	sendData(newData);
};


module.exports = DataService;