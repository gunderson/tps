var _ = require("underscore");
require("backbone");
var SceneModel = require("../../models/sequencer/scene");

var SceneCollection = Backbone.Collection.extend({
	model: SceneModel,
	comparator: "sceneId",
	initialize: function(){
		this.on("add", this.onAdd);
		this.on("change:active", this.onSetActive);
	},
	export: function(){
		return this.map(function(scene){
			return scene.export();
		});
	},
	clear: function(){

	},
	import: function(scenes){
		this.each(function(scene){
			scene.destroy();
		});
		this.reset(scenes);
		this.each(this.importOne.bind(this));
	},
	importOne: function(scene){
		scene.set({
			"controller": this.controller
		});
		scene.import();
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
		// return the active scene
		// if no scenes are active
		// then set scene 0 to active and return it
		return this.findWhere({active: true}) || this.at(0).set({active: true});
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
			sceneId: this.length - 1,
			trackCollection: this.trackCollection
		});
		console.log("SceneCollection::onAdd",this.indexOf(sceneModel), sceneModel.get("sceneId"))
	}
});

module.exports = SceneCollection;
