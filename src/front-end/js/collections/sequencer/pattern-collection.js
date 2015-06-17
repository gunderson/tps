require("backbone");
var PatternModel = require("../../models/sequencer/pattern");

var PatternCollection = Backbone.Collection.extend({
	model: PatternModel,
	comparator: "trackId",
	initialize: function(){
	},
	export: function(){
		return this.map(function(pattern){
			return pattern.export();
		});
	},
	import: function(scene){

		this.each(function(pattern){
			pattern.set({
				values: [],
				scene: scene
			});
			pattern.import(scene);
		});
	},
	destroy: function(){
		this.each(function(p){
			p.destroy();
		});
	}
});

module.exports = PatternCollection;