require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view")

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "sequencer/components/oscillator",
	initialize: function(options){
		console.log("oscillator")
	}
});

module.exports = View;