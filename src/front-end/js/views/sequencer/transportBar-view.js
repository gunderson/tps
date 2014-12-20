require("backbone");
require("backbone.layoutmanager");

var TransportBar = Backbone.Layout.extend({
	el: "#transportBar",
	initialize: function(options){
		if (!options.controller){
			console.error("No Controller defined for TransportBar");
		}
		this.controller = options.controller;
		this.listenTo(this.controller, "play", this.onControllerPlay);
		this.listenTo(this.controller, "stop", this.onControllerStop);
	},
	//respond to controller
	onControllerPlay: function(){
		this.$(".play-button").addClass("active");
	},
	onControllerStop: function(){
		this.$(".play-button").removeClass("active");
	},
	events: {
		"click .play-button": "onClickPlay",
		"click .stop-button": "onClickStop"
	},
	onClickPlay: function(){
		this.controller.play();
	},
	onClickStop: function(){
		this.controller.stop();
	}
});

module.exports = TransportBar;