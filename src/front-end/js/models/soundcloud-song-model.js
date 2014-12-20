require("backbone");
var _ = require("underscore");
var SoundcloudLoader = require("../lib/soundcloud/soundcloudloader");

var Model = Backbone.Model.extend({
	initialize: function(options){
		this.url = options.url;
	},
	parse: function(result){
		if (result.data && !result.data.soundcloudData){
			this.getSoundcloudData(result.data.soundcloud_url);
		}
		return result.data;
	},
	getSoundcloudData: function(soundcloud_url){
		var deferred = $.Deferred();
		var scl = new SoundcloudLoader();
		scl.loadStream(soundcloud_url,
			function(){
				this.set("soundcloudData", scl.sound)
					.save();
			}.bind(this),
			function(){
				console.warn("Soundcloud data error");
			});
	}
});


module.exports = Model;
