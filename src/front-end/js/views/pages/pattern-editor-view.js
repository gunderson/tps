require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");

//abstract page class
var Page = AbstractPage.extend({
	row:1,
	col:2,
	el: "#pattern-editor",
	initialize: function(){

	},

	// RENDERING

	/*
	beforeRender: function(){

	},
	afterRender: function(){

	},

	*/


	// EVENT HANDLERS

	/*
	onClick: function(){

	},

	*/

	// TRANSITIONS
	transitionIn: function(){
		AbstractPage.prototype.transitionIn.apply(this, arguments);
	},
	transitionInComplete: function(){
	
	},
	transitionOut: function(){
		AbstractPage.prototype.transitionOut.apply(this, arguments);
	},
	transitionOutComplete: function(){

	}
});

module.exports = Page;