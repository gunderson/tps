require("backbone");

var Router = Backbone.Router.extend({

	routes: {
		"": "home",
		"home": "home",
		"about": "about",
		"contents": "contents"
	}
});

var router = new Router();

module.exports = router;