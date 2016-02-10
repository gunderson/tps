require("backbone");

var Router = Backbone.Router.extend({

	routes: {
		"": "home",
		"home": "home",
		"soundcloud": "soundcloud",
		"file-player": "file-player",
		"microphone": "microphone",
	}
});

var router = new Router();

module.exports = router;