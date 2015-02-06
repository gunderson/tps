require("backbone");
require("backbone.layoutmanager");

var View = Backbone.Layout.extend({
	el: false,
	keep: true,
	template: "sequencer/fader",
	initialize: function(options){
		console.log("fader")
	}
});

module.exports = View;