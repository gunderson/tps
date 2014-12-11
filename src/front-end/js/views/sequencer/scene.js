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
		var _this = this;
		var patterns = this.trackCollection.map(function(track){
			return new PatternDetailView({
				pattern: track.get("patterns").findWhere({sceneId:_this.sceneId})
			});
		});
		this.insertViews({".patterns":patterns});
	},

});

module.exports = SceneView;
