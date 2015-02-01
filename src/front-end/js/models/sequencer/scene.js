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
		this.listenTo(this.get("patterns"), "show:pattern", this.onShowPattern);
	},
	addPattern: function(trackId){
		this.get("patterns").add({
			trackId: trackId,
			sceneId: this.get("sceneId")
		});
	},
	onShowPattern: function(obj, data){
		// forward the event
		this.trigger("show:pattern", data);
	},
	onDeleteTrack: function(){

	},
	cleanup:function(){
	}
});


module.exports = SceneModel;
