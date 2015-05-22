var _ = require("underscore");
require("backbone");
var SceneModel = require("../../models/sequencer/scene");

var SceneCollection = Backbone.Collection.extend({
	model: SceneModel,
	initialize: function(){
		this.on("add", this.onAdd);
		this.on("change:active", this.onSetActive);
	},
	export: function(){
		return this.map(function(scene){
			return scene.export();
		});
	},
	import: function(scenes){
		this.each(function(scene){
			scene.destroy();
		});
		this.reset(scenes);
		this.each(function(scene){
			scene.set({
				"controller": this.controller
			});
			scene.import();
		}.bind(this));
	},
	triggerCopyRequest: function(source){
		this.each(function(scene){
			scene.triggerCopyRequest(source);
		});
	},
	triggerCancelCopyRequest: function(){
		this.each(function(scene){
			scene.cancelCopyRequest();
		});
	},
	executeCopy: function(source){
		this.each(function(scene){
			scene.executeCopy(source);
		});
	},
	getActiveScene: function(){
		var activeScene = this.findWhere({active: true});
		if (!activeScene){
			activeScene = this.at(0).set({active: true});
		}
		return activeScene;
	},
	onSetActive: function(model, activated, changed){
		// only change when a scene is activated
		// ignore deactivations
		if (!activated) return;
		this.each(function(scene){
			if (model !== scene){
				scene.set("active", false);
			}
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
