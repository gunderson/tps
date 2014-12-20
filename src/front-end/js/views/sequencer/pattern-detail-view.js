require("backbone");
require("backbone.layoutmanager");

var PatternDetailView = Backbone.Layout.extend({
	el: false,
	template: "sequencer/pattern-detail",
	initialize: function(options){
		console.log("PatternDetailView")
	},
	beforeRender: function(){
		
	}
});

module.exports = PatternDetailView;