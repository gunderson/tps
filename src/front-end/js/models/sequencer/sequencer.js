require("backbone");
var _ = require("underscore");
var SceneCollection = require("../../collections/sequencer/scene-collection");
var TrackCollection = require("../../collections/sequencer/track-collection");

var SequencerModel = Backbone.Model.extend({
	defaults: function(){
		return {
			bpm: 120,
			beatsPerMeasure: 4,
			tracks: new TrackCollection([], {controller:this.controller}),
			scenes: new SceneCollection([])
		};
	},
	initialize: function(){
		this.get("scenes").trackCollection = this.get("tracks");
		this.listenTo(this.get("scenes"), "show:pattern", this.onShowPattern);
	},
	onShowPattern: function(){
		
	}
});

module.exports = SequencerModel;
