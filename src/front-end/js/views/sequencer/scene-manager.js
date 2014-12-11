require("backbone");
require("backbone.layoutmanager");
var SceneView = require("./scene");

var SceneManager = Backbone.Layout.extend({
	keep:true,
	el:"#scene-manager",
	events: {
		"click #add-new-scene-button": "onClickAddNewSceneButton"
	},
	initialize: function(options){
		this.trackCollection = options.trackCollection;
		this.sceneCollection = options.sceneCollection;
		this.listenTo(this.sceneCollection, "reset add", this.render);
		this.listenTo(this.trackCollection, "reset add", this.render);
	},
	beforeRender: function(){
		var _this = this;
		var views = [];
		this.sceneCollection.each(function(sceneModel, i){
			console.log(sceneModel);
			views.push(new SceneView({
				model: sceneModel,
				trackCollection: _this.trackCollection
			}));
		});
		this.insertViews({
			".scenes": views
		});
	},
	addScene: function(){
		this.sceneCollection.add({});
	},
	onClickAddNewSceneButton: function(){
		this.addScene();
	}
});

module.exports = SceneManager;