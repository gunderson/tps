window.$ = window.jQuery = require('jquery');
window._ = require('underscore');
window.Backbone = require('backbone');
Backbone.$ = $;
require("backbone.layoutmanager");
require("backbone.toggle");
require("velocity-animate");

var templates = require("./templates");
var App = require("./app");

Backbone.Layout.configure({
	manage: true,
	fetchTemplate: function (path) {
		return templates[path];
	},
	setAppController: function(appController){
		this.appController = appController;
		if (this.model && this.model.setAppController){
			this.model.setAppController(appController);
		}
		if (this.controller && this.controller.setAppController){
			this.controller.setAppController(appController);
		}
	}
});


function onDocumentReady(){
	$('body').css("display", "block");
	$.get("data/en.json")
		.done(function(jsonResult){
			window.app = new App({
				copy: jsonResult
			});
		});
}

$(onDocumentReady);