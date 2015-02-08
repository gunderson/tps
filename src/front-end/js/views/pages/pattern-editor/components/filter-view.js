require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view")

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/filter",
	initialize: function(options){
		console.log("filter")
	}
});

module.exports = View;