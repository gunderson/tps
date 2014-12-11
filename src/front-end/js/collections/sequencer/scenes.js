var _ = require("underscore");
require("backbone");
var SceneModel = require("../../models/sequencer/scene");

var SceneCollection = Backbone.Collection.extend({
	initialize: function(){
		this.on("add", this.onAdd);
	},
	onAdd: function(scene, collection){
		console.log(scene.id);
	},
	model: SceneModel
});

module.exports = SceneCollection;
