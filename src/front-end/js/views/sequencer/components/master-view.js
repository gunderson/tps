require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view");

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "sequencer/components/master",
	initialize: function(options){
		console.log("master");
	}
});

module.exports = View;