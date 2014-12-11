require("backbone");
require("backbone.layoutmanager");
var PatternDetailView = require("./pattern-detail");

var SceneView = Backbone.Layout.extend({
	el: false,
	template: "sequencer/scene",
	initialize: function(options){
		this.trackCollection = options.trackCollection;
	},
	beforeRender: function(){
		// var patterns = this.trackCollection.map(function(){
		// 	return new PatternDetailView({pattern:this.at(_this.sceneId)});
		// });
		// this.insertViews(patterns);
	},
	
});

module.exports = SceneView;