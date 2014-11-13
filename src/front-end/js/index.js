var templates = require("./templates");
var $ = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;
require("backbone.layoutmanager");

$(document).ready(function(){
	$("h1").html("changed it up")
})