require("backbone");
var _ = require("underscore");
var PatternModel = require("./pattern");

var TrackModel = Backbone.Model.extend({
	defaults: function(){
		return {
			patterns: new Backbone.Collection([],{model: PatternModel})
		};
	},
	initialize: function(){

	},
	onAddScene: function(){

	},
	onRemoveScene: function(){

	}
});

module.exports = TrackModel;
