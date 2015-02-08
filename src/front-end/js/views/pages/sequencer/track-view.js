require("backbone");
require("backbone.layoutmanager");
var TrackView = Backbone.Layout.extend({
	el: false,
	template: "sequencer/track",
	events:{
		"click .content": "onClickContent"
	},
	onClickContent: function(e){
		console.log("Clicked on ", e.currentTarget);
	}
});

module.exports = TrackView;
