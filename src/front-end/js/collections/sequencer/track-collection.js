var _ = require("underscore");
require("backbone");
var TrackModel = require("../../models/sequencer/track");

var TrackCollection = Backbone.Collection.extend({
	model: TrackModel,
	initialize: function(){
		this.on("add", this.onAdd);
	},
	onAdd: function(trackModel, collection){
		trackModel.set({
			trackId: this.indexOf(trackModel)
		});
	},
});

module.exports = TrackCollection;
