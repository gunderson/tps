require("backbone");
var _ = require("underscore");
var PatternCollection = require("../../collections/sequencer/pattern-collection");

var SceneModel = Backbone.Model.extend({
	defaults: function(){
		var settings = {
			sceneId: 0,
			patterns: new PatternCollection([]),
			ticksPerBeat: 128,
			beatsPerMeasure: 4, // should match the song beatsPerMeasure
			key: "c",
			currentChange: 0,
			maxNumMeasures: 1,
			changesPattern: [4] // each member of the array is a duration in beats. Should total to a factor of measureLength * beatsPerMeasure.
		};
		settings.tickWidth = (Math.PI * 2) / settings.ticksPerBeat;
		return settings;
	},
	initialize: function(){
		this.listenTo(this.get("patterns"), "edit-pattern", this.onEditPattern);
	},
	addPattern: function(track){
		this.get("patterns").add({
			trackId: track.get("trackId"),
			sceneId: this.get("sceneId"),
			track: track,
			scene: this
		});
	},
	
	onAddPattern: function(){

	},
	onRemovePattern: function(){

	},
	onEditPattern: function(obj, data){
		// forward the event
		this.trigger("edit-pattern", obj);
	},
	onDeleteTrack: function(){

	},
	cleanup:function(){
	}
});


module.exports = SceneModel;
