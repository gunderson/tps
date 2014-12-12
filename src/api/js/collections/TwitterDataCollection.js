var Backbone = require("Backbone");
var _ = require("underscore");
var fs = require("fs");
var HeaderUtils = require("../utils/HeaderUtils");
var Twit = require('twit');
var TweetModel = require("../models/TweetModel");
var constants = require("../constants");
var Q = require("q");
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;

var T = new Twit({
	consumer_key:         "w4vvYl5k33zXzfkGac9UyTZib",
	consumer_secret:      "biKcNyJ4tXdjP6I7pYezHzw6Mg06qucwMDpLUvCxCs8J9WaIAR",
	access_token:         "9146482-KfCHb2cuoEsggw8U5f3HbkcUgS7Zb2YLJ74AJ0Nqmk",
	access_token_secret:  "v6FMEkgm4LmGMqFce9YLKvv6o55FQY6znTn0gExIGTv1l"
});

var TwitterDataCollection = Backbone.Collection.extend({
	response: null,
	model: TweetModel,
	url: "mongodb://localhost:27017/audio-vortex",
	initialize: function(models, options){
		_.extend(this, options);
		
	},
	fetch: function(){
		var deferred = Q.defer();
		var _this = this;

		T.get('search/tweets', {
				q: '#audiovortex',
				count: 100
			},
			//callback
			function(err, data){
				_this.parse(err, data);
				deferred.resolve();
			}
		);
		return deferred.promise;
	},
	parse: function(err, data){
		_.each(data.statuses, function(status){
			status._id = status.id;
			status.soundcloud_url = parseSoundcloudURL(status.entities.urls);
		});
		this.add(data.statuses);
		return data.statuses;
	},
	save: function(){
		var _this = this;
		var db = new Db('audio-vortex', new Server('localhost', 27017), {safe:false});
		db.open(function(err, db) {
			// Fetch a collection to insert document into
			var collection = db.collection("tweets");
			// Insert a multiple documents
			collection.insert(
				_this.toJSON(), 
				{w:1}, 
				function(err, result) {
					db.close();
					sendData(_this.response, {"result": result});
					
				}
			);
		});
	}
});

function parseSoundcloudURL(array){
	return _.find(function(obj){
		return obj.expanded_url.indexOf("soundcloud.com");
	});
}

function sendData(response, data){
	HeaderUtils.addJSONHeader(response);
	HeaderUtils.addCORSHeader(response);
	response.send(JSON.stringify(data));
}

module.exports = TwitterDataCollection;