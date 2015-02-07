require("backbone");
require("backbone.layoutmanager");

var TransportBar = Backbone.Layout.extend({
	keep:true,
	el: "#transportBar",
	events: {
		"click .play-button": "onClickPlay",
		"click .stop-button": "onClickStop",
		"click .loop-button": "onClickLoop",
		"click .save-button": "onClickSave",
		"click .load-button": "onClickLoad"
	},
	initialize: function(options){
		if (!options.controller){
			console.error("No Controller defined for TransportBar");
		}
		this.controller = options.controller;
		this.listenTo(this.controller, "play", this.onControllerPlay);
		this.listenTo(this.controller, "stop", this.onControllerStop);
	},
	beforeRender: function(){
		console.log("TransportBar::beforeRender");
	},
	//respond to controller
	onControllerPlay: function(){
		this.$(".play-button").addClass("active");
	},
	onControllerStop: function(){
		this.$(".play-button").removeClass("active");
	},
	onClickPlay: function(){
		this.controller.play();
	},
	onClickStop: function(){
		this.controller.stop();
	},
	onClickLoop: function(){
		this.controller.model.set("loop", !this.controller.model.get("loop"));
	},
	onClickSave: function(){
		
	},
	onClickLoad: function(){

	}
});

module.exports = TransportBar;