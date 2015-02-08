require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view")

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/splitter",
	initialize: function(options){
		console.log("splitter")
	}
});

module.exports = View;