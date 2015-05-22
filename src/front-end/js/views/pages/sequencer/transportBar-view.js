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
		"click .load-button": "onClickLoad",
		"click .use-extenral-clock-button": "onClickUseExternalClock",
		"change .bpm": "onChangeBpm"
	},
	initialize: function(options){
		if (!options.controller){
			console.error("No Controller defined for TransportBar");
		}
		this.controller = options.controller;
		this.listenTo(this.controller, "play", this.onControllerPlay);
		this.listenTo(this.controller, "stop", this.onControllerStop);
		this.listenTo(this.controller.model, "change:loop", this.onChangeLoop);
	},
	beforeRender: function(){
		// console.log("TransportBar::beforeRender");
	},
	afterRender: function(){

	},
	//respond to controller
	onControllerPlay: function(){
		this.$(".play-button").addClass("active");
	},
	onControllerStop: function(){
		this.$(".play-button").removeClass("active");
	},
	onChangeLoop: function(model, value){
		this.$(".loop-button").toggleClass("active",value);
	},
	onClickPlay: function(){
		this.controller.play();
	},
	onClickStop: function(){
		// first click stop, second click reset
		var sequencerModel = this.controller.model;
		if (sequencerModel.get("playing")){
			sequencerModel.stop();
		} else {
			sequencerModel.reset();
		}
	},
	onClickLoop: function(){
		this.controller.model.set("loop", !this.controller.model.get("loop"));
	},
	onClickSave: function(){
		this.controller.model.save();
	},
	onClickLoad: function(e){
		var $loadFile = this.$("#load-file");
		$loadFile.on("change", this.loadData.bind(this));
		$loadFile[0].click();
	},
	loadData: function(e){
		var $loadFile = this.$("#load-file");
		$loadFile.off();
		if ($loadFile[0].files.length > 0){
			this.controller.model.load($loadFile[0].files[0]);
			$loadFile.val([]);
		}
	}
});



module.exports = TransportBar;