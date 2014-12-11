require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page");

//abstract page class
var Page = AbstractPage.extend({
	row:1,
	col:1,
	el: "#soundcloud",
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