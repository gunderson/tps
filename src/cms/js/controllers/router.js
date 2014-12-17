require("backbone");

var Router = Backbone.Router.extend({

	routes: {
		"": "home",
		"home": "home",
		"queue": "queue"
	}
});

var router = new Router();

module.exports = router;