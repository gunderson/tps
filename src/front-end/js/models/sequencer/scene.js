require("backbone");
var _ = require("underscore");

var SceneModel = Backbone.Model.extend({
	defaults: function(){
		return {
			sceneId: 0
		};
	}
});

module.exports = SceneModel;