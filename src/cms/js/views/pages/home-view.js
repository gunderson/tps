require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");

//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:0,
	el: "#home",
	events: {
		"click button": "onClickTriggerButton"
	},
	onClickTriggerButton: function(e){
		$.get("http://localhost:3030/pulse/trigger/" + $(e.target).data("trigger"));
	}
});

module.exports = Page;