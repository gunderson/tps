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
	remote_uri: "localhost",
	remote_port: 27017,
	remote_db: "audio-vortex",
	initialize: function(models, options){
		_.extend(this, options);
		
	},
	fetchRemote: function(){
		var deferred = Q.defer();
		var _this = this;

		T.get('search/tweets', {
				q: '#audiovortex',
				count: 100
			},
			//callback
			function(err, data){
				_this.parseRemote(err, data);
				deferred.resolve();
			}
		);
		return deferred.promise;
	},
	parseRemote: function(err, data){
		_.each(data.statuses, function(status){
			status._id = status.id;
			status.soundcloud_url = parseSoundcloudURL(status.entities.urls);
		});
		this.add(data.statuses);
		return data.statuses;
	},
	fetch: function(options){
		var deferred = Q.defer();
		var _this = this;

		var defaults = {
			limit: 100
		};
		options = _.extend({}, defaults, options);

		var db = new Db(this.remote_db, new Server(this.remote_uri, this.remote_port), {safe:false});
		db.open(function(err, db) {
			// Fetch a collection to insert document into
			var collection = db.collection("tweets");
			// Insert a multiple documents
			collection.find(
				function(err, result) {
					result.toArray(function(err, docs){
						sendData(_this.response, {"result": docs});
						db.close();
						deferred.resolve();
					});
				}
			);
		});
		return deferred.promise;
	},
	parse: function(){

	},
	save: function(){
		var deferrals = this.map(function(model){return Q.defer();});
		var deferredAll = Q.all(_.pluck(deferrals, "promise"));
		var _this = this;

		var db = new Db(this.remote_db, new Server(this.remote_uri, this.remote_port), {safe:false});
		db.open(function(err, db) {
			// Fetch a collection to insert document into
			var collection = db.collection("tweets");
			// Insert a multiple documents
			_this.each(function(model,i){
				var deferral = deferrals[i];
				collection.update(
					{
						_id: model.id
					},
					model.toJSON(), 
					{
						upsert:true,
						w:1
					}, 
					function(err, result) {
						deferral.resolve();
					}
				);
			});
		});

		return deferredAll.done(function(){
			db.close();
			sendData(_this.response, {"result": "updated tweets"});
		});
	}
});

function parseSoundcloudURL(array){
	var obj = _.find(array, function(obj){
		return obj.expanded_url.indexOf("soundcloud.com") > -1;
	});
	return obj.expanded_url;
}

function sendData(response, data){
	HeaderUtils.addJSONHeader(response);
	HeaderUtils.addCORSHeader(response);
	response.send(JSON.stringify(data, null, "\t") + "\n");
}

module.exports = TwitterDataCollection;