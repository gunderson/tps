var templates = require("./templates").JST;
var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
require("backbone.layoutmanager");

Backbone.Layout.configure({
	manage: true,
	fetchTemplate: function (path) {
		return JST[path];
	}
});

function onDocumentReady(){
	$('body').css("display", "block");
	$("h1").html("changed it up");
	console.log(templates)

	var v = Backbone.Layout.extend({
		template: "partial",
		el: "header"
	})

}

$(document).ready(onDocumentReady);