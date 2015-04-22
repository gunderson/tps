require("backbone");
var PatternModel = require("../../models/sequencer/pattern");

var PatternCollection = Backbone.Collection.extend({
	model: PatternModel,
	initialize: function(){
	},
	export: function(){
		return this.map(function(pattern){
			return pattern.export();
		});
	}
});

module.exports = PatternCollection;