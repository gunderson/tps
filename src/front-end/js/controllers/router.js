require("backbone");

var Router = Backbone.Router.extend({

	routes: {
		"": "home",
		"home": "home",
		"soundcloud": "soundcloud",
	}
});

var router = new Router();

module.exports = router;