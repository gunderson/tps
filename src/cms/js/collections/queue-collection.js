require("backbone");
var QueueModel = require("../models/queue/queue-item-model");

var Collection = Backbone.Collection.extend({
	model: QueueModel,
	url: "http://localhost:3030/songs",
	parse: function(result){
		return result.data;
	},
	save: function(){
		var payload = this.map(function(model){
			return model.toJSON();
		});
		return $.ajax({
			url: this.url,
			type: "PUT",
			processData: false,
			data: JSON.stringify(payload),
			contentType: "application/json"
		});
	}
});

module.exports = Collection;