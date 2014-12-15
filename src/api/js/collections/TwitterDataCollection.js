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
	fetchFromTwitter: function(){
		var deferred = Q.defer();
		var _this = this;

		T.get('search/tweets', {
				q: '#audiovortex',
				count: 100
			},
			//callback
			function(err, data){
				_this.parseFromTwitter(err, data);
				deferred.resolve();
			}
		);
		return deferred.promise;
	},
	parseFromTwitter: function(err, data){
		var tweets = data.statuses;
		var soundcloudTweets = _(tweets)
			.each(function(tweet){
				tweet._id = tweets.id;
				tweet.soundcloud_url = parseSoundcloudURL(tweet.entities.urls);
			})
			.filter(function(tweet){
				return tweet.soundcloud_url;
			});
		this.add(soundcloudTweets);
		return data.statuses;
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
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");
			// find a multiple documents
			tweets.find(query,
				function(err, result) {
					result.toArray(function(err, docs){
						sendData(_this.response, {"data": docs});
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
			.then(this.getNext)
			.then(function(song){
				this.play(song.id);
			});
	},
	play: function(id){
		var deferred = Q.defer();
		var query = {
			_id: id
		};
		var command = {
			queueStatus: constants.QUEUE_STATUS.PLAYING
		};

		var db = getDB.call(this);
		db.open(function(err, db) {
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
	stop: function(){
		var deferred = Q.defer();
		var query = {
			queueStatus:{
				$in: constants.QUEUE_STATUS.PLAYING
			}
		};
		var command = {
			queueStatus: constants.QUEUE_STATUS.UNQUEUED
		};

		var db = getDB.call(this);
		db.open(function(err, db) {
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
		// get the latest song that is QUEUED
		// send that song
		var deferred = Q.defer();
		var query = {
			moderationStatus: constants.MODERATION_STATUS.PUBLISHED,
		};
		var command = {
			queueStatus: constants.QUEUE_STATUS.QUEUED
		};

		var db = getDB.call(this);
		db.open(function(err, db) {
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");

			tweets
				.find(query)
				.sort({created_at: 1})
				.limit(1)
				.update(
					command,
					{w:1}, 
					function(err, result) {
						db.close();
						sendData(this.request, {"data":result});
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
			sendData(_this.response, {"data": "updated tweets"});
		});
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

function sendData(response, data){
	HeaderUtils.addJSONHeader(response);
	HeaderUtils.addCORSHeader(response);
	response.send(JSON.stringify(data, null, "\t") + "\n");
}

module.exports = TwitterDataCollection;