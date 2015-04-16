require("backbone");
var _ = require("underscore");
var SceneCollection = require("../../collections/sequencer/scene-collection");
var TrackCollection = require("../../collections/sequencer/track-collection");

var SequencerModel = Backbone.Model.extend({
	defaults: function(){
		return {
			bpm: 120,
			beatsPerMeasure: 4,
			currentSceneId: 0,
			tracks: new TrackCollection([{}], {controller:this.controller}),
			scenes: new SceneCollection([{}])
		};
	},
	save: function(){

	},
	load:function(){

	},
	initialize: function(){
		this.get("scenes").trackCollection = this.get("tracks");
		this.listenTo(this.get("scenes"), "edit-pattern", this.onEditPatternEvent);
	},
	onEditPatternEvent: function(patternModel){
		//forward the event
		this.trigger("edit-pattern", patternModel);
	}
});

module.exports = SequencerModel;
