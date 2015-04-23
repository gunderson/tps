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
	},
	import: function(scene){
		this.each(function(pattern){
			console.log(pattern);
			pattern.import();
			pattern.set({
				values: [],
				scene: scene
			});
		});
	}
});

module.exports = PatternCollection;