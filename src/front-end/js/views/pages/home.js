require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page");

//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:0,
	el: "#home",
	events: {
		"click button": "onClickTriggerButton"
	},
	onClickTriggerButton: function(){
		$.get("http://localhost:3030/pulse/trigger/1");
	}
});

module.exports = Page;