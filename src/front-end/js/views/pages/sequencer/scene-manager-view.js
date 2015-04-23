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
			this.onAddScene(this.sceneCollection, sceneModel);
		}.bind(this));
	},
	addScene: function(){
		this.sceneCollection.add({});
	},
	onClickAddNewSceneButton: function(){
		this.addScene();
	},
	onAddTrack: function(trackModel){
		//add a pattern to each scene model
		this.sceneCollection.each(function(sceneModel){
			sceneModel.addPattern(trackModel);
		});
	},
	onAddScene: function(collection, sceneModel, skipRender){

		console.log("Scene-manager-view::num scenes", collection.length);
		sceneModel.set("controller", this.controller);
		var sceneView = new SceneView({
			model: sceneModel
		});

		var patterns = sceneModel.get("patterns");
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
