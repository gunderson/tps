// var colors = require("colors");

var Backbone = require("Backbone");
var _ = require("underscore");
var ResponseUtils = require("../utils/ResponseUtils");
var SoundCloudLoader = require("../../../../custom_node_modules/soundcloudloader");
var constants = require("constants");
var Q = require("q");
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;


var TweetModel = Backbone.Model.extend({
    idAttribute: "_id",
    remote_uri: "localhost",
    remote_port: 27017,
    remote_db: "audio-vortex",
    fetch: function() {
        var deferred = Q.defer();
        var _this = this;

        var query = {
            _id: this.id
        };

        var db = getDB.call(this);
        db.open(function(err, db) {
            if (err) {
                return ResponseUtils.sendData(_this.response, {
                    "error": err,
                    "db": db
                });
            }
            // Fetch a collection to insert document into
            var tweets = db.collection("tweets");
            // find a multiple documents
            tweets.findOne(query,
                function(err, result) {
                    _this.set(result);
                    db.close();
                    deferred.resolve();
                }
            );
        });
        return deferred.promise;
    },
    save: function() {
        var deferred = Q.defer();
        var _this = this;

        var query = {
            _id: this.id
        };

        // console.log("TweetModel", this.get("order"));

        var db = getDB.call(this);
        db.open(function(err, db) {
            // Fetch a collection to insert document into
            var tweets = db.collection("tweets");
            tweets.update(
                query, {
                    $set: _this.toJSON()
                }, {
                    upsert: true,
                    w: 1
                },
                function(err, result) {
                    db.close();
                    deferred.resolve();
                }
            );
        });
        return deferred.promise;
    },
    getSoundCloudInfo: function() {
        var deferred = Q.defer();
        var scl = new SoundCloudLoader();
        scl.loadStream(this.get("soundcloud_url", function(
            soundcloudData) {
            this.set("soundcloudData", soundcloudData);
            this.save();
            deferred.resolve();
        }.bind(this), function() {
            //err
            deferred.reject();
        }));

        _.defer(function() {
            deferred.resolve();
        })

        return deferred.promise;
    },
    defaults: function() {
        return {
            // moderationStatus: constants.MODERATION_STATUS.UNMODERATED,
            moderationStatus: constants.MODERATION_STATUS.PUBLISHED,
            queueStatus: constants.QUEUE_STATUS.QUEUED,
            editedBy: ["api"], // users
            editAction: ["create"],
            editedAt: [Date.now()],
        };
    }
});


function getDB() {
    return new Db(this.remote_db, new Server(this.remote_uri, this.remote_port), {
        safe: false
    });
}

module.exports = TweetModel;
