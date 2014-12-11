require("backbone");
var _ = require("underscore");
var SceneCollection = require("../../collections/sequencer/scenes");
var TrackCollection = require("../../collections/sequencer/tracks");

var SequencerModel = Backbone.Model.extend({
	defaults: function(){
		return {
			tracks: new TrackCollection(),
			scenes: new SceneCollection([{}])
		};
	}
});

module.exports = SequencerModel;