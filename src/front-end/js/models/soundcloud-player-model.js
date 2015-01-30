require("backbone");
var _ = require("underscore");
var SongModel = require("./soundcloud-song-model");

var Model = Backbone.Model.extend({
	// url: "http://localhost:3030/songs",
	defaults: function(){
		return {
			next: new SongModel({url:"http://localhost:3030/songs/next"}),
			current: new SongModel({url:"http://localhost:3030/songs/current"}),
		};
	},
	initialize: function(){
		this.start();
		this.listenTo(this.get("current"), "change reset", this.onChangeCurrent);
	},
	triggerPulse: function(id){

	},
	fetch: function(){
		// short circuit fetching
		var def = $.Deferred();
		_.defer(function(){
			def.resolve();
		});
		return def;
	},
	parse: function(result){
		return result.data;
	},
	start: function(){
		return $.when(
			this.getNext(),
			this.getCurrent()
		);
	},
	advance: function(){
		var getPromise = $.get("http://localhost:3030/songs/advance")
			.done(function(){
				this.getNext();
				this.getCurrent();
	    	}.bind(this));
	    return getPromise;
	},
	getNext: function(){
		return this.get("next").fetch();
	},
	getCurrent: function(){
		return this.get("current").fetch();
	},
	onChangeCurrent: function(){
		if (!this.get("current").get("soundcloud_url")){
			this.advance();
		}
	}
});


module.exports = Model;
