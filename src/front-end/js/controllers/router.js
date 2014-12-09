require("backbone");

var Router = Backbone.Router.extend({

	routes: {
		"": "home",
		"home": "home",
		"about": "about",
		"sequencer": "sequencer",
		"sound-board": "sound-board"
	}
});

var router = new Router();

module.exports = router;