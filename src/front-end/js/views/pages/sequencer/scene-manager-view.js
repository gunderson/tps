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
		this.listenTo(this.sceneCollection, "reset add", this.onAddScene);
		this.listenTo(this.trackCollection, "reset add", this.onAddTrack);
	},
	beforeRender: function(){
		// console.log("Scene-manager-view::beforeRender", this);
		this.sceneCollection.each(function(sceneModel){
			this.onAddScene(sceneModel);
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
	onAddScene: function(sceneModel, skipRender){

		// console.log("Scene-manager-view::onAddScene")

		var sceneView = new SceneView({
			model: sceneModel
		});

		// add patterns to scene
		this.trackCollection.each(function(trackModel){
			sceneModel.addPattern(trackModel);
		});

		this.insertViews({
			".scenes": sceneView
		});
		sceneView.render();
	}
});

module.exports = SceneManager;
