var _ = require("underscore");
require("backbone");
var SceneModel = require("../../models/sequencer/scene");

var SceneCollection = Backbone.Collection.extend({
	model: SceneModel,
	initialize: function(){
		this.on("add", this.onAdd);
	},
	export: function(){
		return this.map(function(scene){
			return scene.export();
		});
	},
	import: function(scenes){
		this.reset(scenes);
		this.each(function(scene){
			scene.import();
		});
	},
	onAdd: function(sceneModel, collection){
		sceneModel.set({
			sceneId: this.indexOf(sceneModel),
			trackCollection: this.trackCollection
		});
	}
});

module.exports = SceneCollection;
