require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view")

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/user-pattern",
	initialize: function(options){
		console.log("user-pattern")
	}
});

module.exports = View;