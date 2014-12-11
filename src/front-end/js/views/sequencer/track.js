require("backbone");
require("backbone.layoutmanager");

var TrackView = Backbone.Layout.extend({
	el: false,
	template: "sequencer/track"
});

module.exports = TrackView;