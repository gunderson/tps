require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page");

//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:2,
	el: "#contents"
});

module.exports = Page;