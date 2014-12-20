var Backbone = require("Backbone");
var _ = require("underscore");
var fs = require("fs");
var ResponseUtils = require("../utils/ResponseUtils");
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
	fetchFromTwitter: function(){
		var deferred = Q.defer();

		T.get('search/tweets', {
				q: '#audiovortex -RT',
				count: 100
			},
			//callback
			function(err, data){
				// this.on("add", this.getSoundCloudInfo);
				this.add(this.parseFromTwitter(err, data));
				deferred.resolve();
			}.bind(this)
		);
		return deferred.promise;
	},
	parseFromTwitter: function(err, data){
		var tweets = data.statuses;
		var soundcloudTweets = _(tweets)
			.each(function(tweet){
				tweet._id = tweet.id_str;
				tweet.soundcloud_url = parseSoundcloudURL(tweet.entities.urls);
			})
			.filter(function(tweet){
				var rtPosition = tweet.text.toLowerCase().indexOf("rt @");
				rtPosition = (rtPosition > -1) ? rtPosition : tweet.text.toLowerCase().indexOf(".@");
				rtPosition = (rtPosition > -1) ? rtPosition : tweet.text.toLowerCase().indexOf(">@");
				return tweet.soundcloud_url && rtPosition == -1;
			});
		return data.statuses;
	},
	getSoundCloudInfo: function(model){
		return model.getSoundCloudInfo();
	},
	fetch: function(options){
		var deferred = Q.defer();
		var _this = this;

		var defaults = {
			limit: 100,
			query:{}
		};
		options = _.extend({}, defaults, options);

		var db = getDB.call(this);
		db.open(function(err, db) {
			if (err){
				return ResponseUtils.sendData(_this.response, {"error": err, "db": db});
			}
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");
			// find a multiple documents
			tweets.find(options.query,
				function(err, result) {
					result.toArray(function(err, docs){
						ResponseUtils.sendData(_this.response, {"data": docs});
						db.close();
						deferred.resolve();
					});
				}
			);
		});
		return deferred.promise;
	},
	advance: function(){
		var _this = this;
		return this.stop()
			.then(this.getNext.bind(this))
			.then(function(song){
				this.play(song._id);
			}.bind(this));
	},
	play: function(id){
		var deferred = Q.defer();
		var query;
		var command;

		var db = getDB.call(this);
		db.open(function(err, db) {
			var tweets = db.collection("tweets");

			//set correct one as playing
			query = {
				_id: id
			};
			command = {
				$set: {
					queueStatus: constants.QUEUE_STATUS.PLAYING
				}
			};

			tweets.update(
				query,
				command,
				{w:1}, 
				function(err, result) {
					db.close();
					deferred.resolve(result);
				});
		});

		return deferred.promise;
	},
	stop: function(){
		var deferred = Q.defer();
		var query = {
			queueStatus:constants.QUEUE_STATUS.PLAYING
		};
		var command = {
			$set: {
				queueStatus: constants.QUEUE_STATUS.UNQUEUED
			}
		};

		var db = getDB.call(this);
		db.open(function(err, db) {
			if (err){
				return ResponseUtils.sendData(req, {"error": err});
			}
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");

			tweets.update(
				query,
				command,
				{w:1}, 
				function(err, result) {
					db.close();
					deferred.resolve(result);
				});
		});

		return deferred.promise;
	},
	getNext: function(){
		var _this = this;
		// get the latest song that is QUEUED
		// send that song
		var deferred = Q.defer();
		var query = {
			$query:{
				moderationStatus: constants.MODERATION_STATUS.PUBLISHED,
				queueStatus: constants.QUEUE_STATUS.QUEUED
			},
			$orderby:{
				order: 1
			}
		};

		var db = getDB.call(this);
		db.open(function(err, db) {
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");

			tweets
				.findOne(
					query,
					function(err, result) {
						db.close();
						ResponseUtils.sendData(_this.response, {"data":result});
						deferred.resolve(result);
					});
					
		});

		return deferred.promise;
	},
	getCurrent: function(){
		var _this = this;
		// get the latest song that is QUEUED
		// send that song
		var deferred = Q.defer();
		var query = {
			$query:{
				queueStatus: constants.QUEUE_STATUS.PLAYING
			},
			$orderby:{
				order: 1
			}
		};

		var db = getDB.call(this);
		db.open(function(err, db) {
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");

			tweets
				.findOne(
					query,
					function(err, result) {
						db.close();
						ResponseUtils.sendData(_this.response, {"data":result});
						deferred.resolve(result);
					});
					
		});

		return deferred.promise;
	},
	parse: function(input){
		return input;
	},
	save: function(){
		var deferrals = this.map(function(model){return Q.defer();});
		var deferredAll = Q.all(_.pluck(deferrals, "promise"));
		var _this = this;

		var db = getDB.call(this);
		db.open(function(err, db) {
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");
			// Insert a multiple documents
			_this.each(function(model,i){
				var deferral = deferrals[i];
				tweets.update(
					{
						_id: model.id
					},
					{
						$set: model.toJSON()
					}, 
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

		deferredAll.done(function(){
			db.close();
			ResponseUtils.sendData(_this.response, {"data": "updated tweets"});
		});
		return deferredAll;
	}
});

function getDB(){
	return new Db(this.remote_db, new Server(this.remote_uri, this.remote_port), {safe:false});
}

//takes an array of url objects from Twitter API
//returns an array of just soundcloud urls
function parseSoundcloudURL(array){
	var obj = _.find(array, function(obj){
		return obj.expanded_url.indexOf("soundcloud.com") > -1;
	});
	return obj.expanded_url;
}



module.exports = TwitterDataCollection;