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
		console.log("PatternCollection::import !_!_!__!_!!__!!_!_!_!_!__!!!__!_!_!!__!!")

		this.each(function(pattern){
			pattern.set({
				values: [],
				scene: scene
			});
			pattern.import(scene);
		});
	}
});

module.exports = PatternCollection;