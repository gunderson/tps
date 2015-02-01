require("backbone");
var _ = require("underscore");

var PatternModel = Backbone.Model.extend({
	defaults: function(){
		return {
			sceneId: 0,
			measureLength: 1,
			userPatterns: []
		};
	},
	addMeasure: function(){

	},
	initialize: function(){

	},
	onDeleteTrack: function(){

	},
	cleanup:function(){
	}
});

function identityMeasure(beatsPerMeasure){

}


module.exports = PatternModel;
