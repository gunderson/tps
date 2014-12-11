require("backbone");
var _ = require("underscore");

var Scene = Backbone.Model.extend({
	defaults: function(){
		sceneId: 0
	},
	initialize: function(){

	},
	onDeleteTrack: function(){

	},
	cleanup:function(){
	}
})


module.exports = Scene;
