require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page");
var TransportBar = require("../sequencer/transportBar");

var sequencerStatus;
var controller;

var Page = AbstractPage.extend({
	initialize: function(options){
		AbstractPage.prototype.initialize.call(this);

		controller = options.controller;
		sequencerStatus = controller.getStatus();
		controller.on("16th", function(data){
		    // console.log("16th", sequencerStatus.currentBeat, data.currentBeat);

		    if (sequencerStatus.currentBeat != data.currentBeat){
		        console.log("--beat", sequencerStatus.currentBeat, data.currentBeat);
		    }

		    sequencerStatus = data;
		});

		this.setViews({
			"#transportBar": new TransportBar({controller: controller})
		});

		this.on("transitionInComplete", this.transitionInComplete);
	},
	transitionInComplete: function(){
		controller.play();
	},
	transitionOut: function(){
		controller.stop();
		AbstractPage.prototype.transitionOut.apply(this, arguments);
	},
	row:0,
	col:2,
	el: "#sequencer"
});

module.exports = Page;