var _ = require("underscore");
require("backbone");
var TrackModel = require("../../models/sequencer/track");

var TrackCollection = Backbone.Collection.extend({
	model: TrackModel,
	initialize: function(){
		this.on("add", this.onAdd);
	},
	onAdd: function(track, collection){
	},
});

module.exports = TrackCollection;
