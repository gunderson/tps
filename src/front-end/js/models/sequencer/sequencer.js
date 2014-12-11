require("backbone");
var _ = require("underscore");
var SceneCollection = require("../../collections/sequencer/scenes");
var TrackCollection = require("../../collections/sequencer/tracks");

var SequencerModel = Backbone.Model.extend({
	defaults: function(){
		return {
			bpm: 120,
			beatsPerMeasure: 4,
			tracks: new TrackCollection([], {controller:this.controller}),
			scenes: new SceneCollection([{}])
		};
	}
});

module.exports = SequencerModel;
