window.$ = window.jQuery = require('jquery');
require("./lib/jquery-sortable-min");
window._ = require('lodash');
window.Backbone = require('backbone');
Backbone.$ = $;
require("backbone.layoutmanager");
require("velocity-animate");




var templates = require("./templates");
var App = require("./app");

Backbone.Layout.configure({
	manage: true,
	fetchTemplate: function (path) {
		return templates[path];
	}
});

function onDocumentReady(){
	$('body').css("display", "block");
	$.get("data/en.json")
		.done(function(jsonResult){
			window.app = new App({
					copy: jsonResult
				})
			.render();
	});

}

$(onDocumentReady);