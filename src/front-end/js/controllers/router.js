require("backbone");

var Router = Backbone.Router.extend({

	routes: {
		"": "home",
		"home": "home",
		"about": "about",
		"sequencer": "sequencer",
		"pattern-editor/:sceneId/:trackId": "pattern-editor",
		"sound-board": "sound-board",
		"soundcloud": "soundcloud",
		"pattern-editor": "pattern-editor"
	}
});

var router = new Router();

module.exports = router;