var _ = require("underscore");
require("backbone");
var TrackModel = require("../../models/sequencer/track");

var TrackCollection = Backbone.Collection.extend({
	model: TrackModel,
	initialize: function(){
		this.on("add", this.onAdd);
	},
	export: function(){
		return this.map(function(track){
			// replace instrument with flat version
			// track.instrument = track.instrument.toJSON();
			return track.export();
		});
	},
	import: function(tracks){
		this.reset(tracks);
		// this.each(function(track){
			// replace instrument with instrument model
		// });
	},
	onAdd: function(trackModel, collection){
		trackModel.set({
			trackId: this.indexOf(trackModel)
		});
	},
});

module.exports = TrackCollection;
