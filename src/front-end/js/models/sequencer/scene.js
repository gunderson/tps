require("backbone");
var _ = require("underscore");
var PatternCollection = require("../../collections/sequencer/pattern-collection");

var SceneModel = Backbone.Model.extend({
	defaults: function(){
		return {
			sceneId: 0,
			patterns: new PatternCollection([])
		};
	},
	initialize: function(){
		this.listenTo(this.get("patterns"), "edit-pattern", this.onEditPattern);
	},
	addPattern: function(trackId){
		this.get("patterns").add({
			trackId: trackId,
			sceneId: this.get("sceneId")
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
