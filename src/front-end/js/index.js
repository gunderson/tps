window.$ = require('jquery');
window._ = require('underscore');
window.Backbone = require('backbone');
require("backbone.layoutmanager");
var templates = require("./templates");

	console.log(templates);

Backbone.Layout.configure({
	manage: true,
	fetchTemplate: function (path) {
		return templates[path];
	}
});

function onDocumentReady(){
	$('body').css("display", "block");
	$("h1").html("changed it up");

	var v = Backbone.Layout.extend({
		id: "main-nav",
		template: "partial",
		el: "header",
		serialize: function(){
			return {
				id: "main-nav"
			}
		}
	})
	new v().render();

}

$(onDocumentReady);