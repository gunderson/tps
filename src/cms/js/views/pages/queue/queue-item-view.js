require("backbone");
require("backbone.layoutmanager");
var constants = require("../../../constants");

//abstract page class
var View = Backbone.Layout.extend({
	el: false,
	template: "queue/queue-item",
	events: {
		"change select.moderation-status": "onChangeStatus"
	},
	updateOrder: function(newOrder){
		this.model.set("order", newOrder);
		this.$(".order").text(newOrder);
		return this;
	},
	initialize: function(options){
		this.copy = options.copy;
	},
	serialize: function(){
		console.log(this.model.toJSON());
		return _.extend({}, this.model.toJSON(), {copy: this.copy, constants: constants});
	},
	onChangeStatus: function(e){
		this.model
			.set({"moderationStatus": e.target.value})
			.save();
	},
});

module.exports = View;