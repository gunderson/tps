require("backbone");
require("backbone.layoutmanager");
var SceneView = require("./scene-view");

var SceneManager = Backbone.Layout.extend({
	keep:false,
	el:"#scene-manager",
	events: {
		"click #add-new-scene-button": "onClickAddNewSceneButton"
	},
	initialize: function(options){
		this.trackCollection = options.trackCollection;
		this.sceneCollection = options.sceneCollection;
		this.listenTo(this.sceneCollection, "add", this.onAddScene);
		this.listenTo(this.trackCollection, "add", this.onAddTrack);
		this.listenTo(this.sceneCollection, "reset", this.render);
		this.listenTo(this.trackCollection, "reset", this.render);
	},
	beforeRender: function(){
		console.log("Scene-manager-view::beforeRender", this.sceneCollection.length);
		this.getViews(".scenes").each(function(nestedView) {
			nestedView.remove();
		});
		this.sceneCollection.each(function(sceneModel){
			this.onAddScene(sceneModel,this.sceneCollection);
		}.bind(this));
	},
	addScene: function(){
		this.sceneCollection.add({});
	},
	onChangeLoop: function(){

	},
	onChangeNextScene: function(){
		// remove 'next' class from all scenes
		// add 'next' class to active scene
	},
	onClickAddNewSceneButton: function(){
		this.addScene();
	},
	onAddTrack: function(trackModel){
		console.log("Scene-manager-view::onAddTrack", arguments)
	},
	onAddScene: function(sceneModel, collection, skipRender){
		console.log("Scene-manager-view::onAddScene num scenes", collection.length);
		sceneModel.set("controller", this.controller);
		var sceneView = new SceneView({
			model: sceneModel
		});

		var patterns = sceneModel.get("patterns");
		console.log(sceneModel);
		if (patterns.length < this.trackCollection.length){
			// add patterns to scene
			console.log("Scene-manager-view::num tracks", collection.length);
			this.trackCollection.each(function(trackModel, i){
				// insert any track into the scene that doesn't already exist
				if (!patterns.findWhere({trackId: trackModel.id})){
					sceneModel.addPattern(trackModel);
				}
			});
		}

		this.insertViews({
			".scenes": sceneView
		});
		sceneView.render();
	}
});

module.exports = SceneManager;
