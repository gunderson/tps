var _ = require("underscore");
require("backbone");
var TrackModel = require("../../models/sequencer/track");

var TrackCollection = Backbone.Collection.extend({
	model: TrackModel,
	initialize: function(){
		this.on("add", this.onAdd);
		this.on("change:solo reset", this.onChangeSolo);
	},
	export: function(){
		return this.map(function(track){
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
	soloTracks: [],
	onChangeSolo: function(){
		this.soloTracks = this.where({"solo":true});
		return this;
	}
});

module.exports = TrackCollection;
