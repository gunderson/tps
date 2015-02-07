require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view");

var View = ComponentView.extend({
	// el: false,
	// keep: false,
	template: "sequencer/components/master",
	initialize: function(options){
		console.log("master");
	},
	beforeRender: function(){
		console.log("render master");
	}
});

module.exports = View;