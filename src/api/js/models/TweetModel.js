var Backbone = require("Backbone");
var _ = require("underscore");
var constants = require("../constants");
var Q = require("q");
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;


var TweetModel = Backbone.Model.extend({
	idAttribute: "_id",
	remote_uri: "localhost",
	remote_port: 27017,
	remote_db: "audio-vortex",
	fetch: function(){
		var deferred = Q.defer();
		var _this = this;

		var query = {
			_id: this.id
		};

		var db = getDB.call(this);
		db.open(function(err, db) {
			if (err){
				return sendData(_this.response, {"error": err, "db": db});
			}
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");
			// find a multiple documents
			tweets.findOne(query,
				function(err, result) {
					this.set(result);
					db.close();
					deferred.resolve();
				}
			);
		});
		return deferred.promise;
	},
	save: function(){
		var deferred = Q.defer();
		var _this = this;

		var query = {
			_id: this.id
		};

		var db = getDB.call(this);
		db.open(function(err, db) {
			// Fetch a collection to insert document into
			var tweets = db.collection("tweets");
			tweets.update(
				{
					_id: model.id
				},
				model.toJSON(), 
				{
					w:1
				}, 
				function(err, result) {
					deferred.resolve();
				}
			);
		});
		return deferred.promise;
	},
	defaults: function(){
		return {
			// moderationStatus: constants.MODERATION_STATUS.UNMODERATED,
			moderationStatus: constants.MODERATION_STATUS.PUBLISHED,
			queueStatus: constants.QUEUE_STATUS.QUEUED,
			editedBy: ["api"], // users
			editAction: ["create"],
			editedAt: [Date.now()],
			soundcloud_url: null
		};
	}
});


function getDB(){
	return new Db(this.remote_db, new Server(this.remote_uri, this.remote_port), {safe:false});
}

module.exports = TweetModel;