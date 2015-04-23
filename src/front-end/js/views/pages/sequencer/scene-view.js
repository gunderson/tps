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
	beforeRender: function(){
		// make a fresh slate
		this.getViews(".patterns").each(function(nestedView){
			nestedView.remove();
		});

		var patterns = this.model.get("patterns");
		patterns.each(function(pattern){
			this.onAddPattern(pattern);
		}.bind(this));
	},
	onAddPattern: function(patternModel){
		console.log("scene-view::onAddPattern");
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
