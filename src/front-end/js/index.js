var templates = require("./templates").JST;
var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
require("backbone.layoutmanager");

function onDocumentReady(){
	$('body').css("display", "block");
	$("h1").html("changed it up");
	console.log(templates)
}

$(document).ready(onDocumentReady);