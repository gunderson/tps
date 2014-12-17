require("backbone");
var QueueModel = require("../models/queue/queue-item");

var Collection = Backbone.Collection.extend({
	model: QueueModel,
	url: "http://localhost:3030/tweets",
	parse: function(result){
		return result.data;
	}
});

module.exports = Collection;