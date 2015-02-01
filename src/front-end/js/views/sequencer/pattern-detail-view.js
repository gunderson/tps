require("backbone");
require("backbone.layoutmanager");

var PatternDetailView = Backbone.Layout.extend({
	el: false,
	keep: true,
	template: "sequencer/pattern-detail",
	initialize: function(options){
		console.log("PatternDetailView")
	}
});

module.exports = PatternDetailView;