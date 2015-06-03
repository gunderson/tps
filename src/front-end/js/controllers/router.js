require("backbone");

var Router = Backbone.Router.extend({

	routes: {
		"": "load-data-page",
		"load-data-page": "load-data-page",
		"sequencer": "sequencer",
		"pattern-editor/:sceneId/:trackId": "pattern-editor",
		"sound-board": "sound-board",
	}
});

var router = new Router();

module.exports = router;