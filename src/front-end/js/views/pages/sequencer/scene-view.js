require("backbone");
require("backbone.layoutmanager");
var PatternOverviewView = require("./pattern-overview-view");

var SceneView = Backbone.Layout.extend({
	el: false,
	keep: true,
	template: "sequencer/scene",
	events: {
		"click": this.setCurrentScene
	},
	initialize: function(options){
		this.listenTo(this.model.get("patterns"), "add", this.onAddPattern);
	},
	onAddPattern: function(patternModel){
		var patternView = new PatternOverviewView({
			model: patternModel
		});
		this.insertViews({
			".patterns": patternView
		});
		patternView.render();
	}, 
	onEditPattern: function(){

	},
	setCurrentScene: function(){
		this.model.setCurrentScene();
	}

});

module.exports = SceneView;
