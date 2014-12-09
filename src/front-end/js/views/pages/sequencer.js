require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page");
var TransportBar = require("../sequencer/transportBar");
var SoundManager = require("../../controllers/Sound-manager")();

var sequencerStatus;
var controller;



var Page = AbstractPage.extend({
	initialize: function(options){
		AbstractPage.prototype.initialize.call(this);

		controller = options.controller;
		sequencerStatus = controller.getStatus();
		
		SoundManager.loading.done(function(){
			/*SoundManager.load(SoundManager.loadGroups)
				.done(function(){
					console.log("SoundManager loaded");
					controller.on("16th", function(data){
					    // console.log("16th", sequencerStatus.currentBeat, data.currentBeat);

					    if (sequencerStatus.currentBeat != data.currentBeat){
					    	SoundManager.noteOn(SoundManager.loadGroups[1], 30, 127);
					        // console.log("--beat", sequencerStatus.currentBeat, data.currentBeat);
					    }

					    sequencerStatus = data;
					});
				});*/
		});

		this.setViews({
			"#transportBar": new TransportBar({controller: controller})
		});

		this.on("transitionInComplete", this.transitionInComplete);
	},
	transitionInComplete: function(){
		// controller.play();
	},
	transitionOut: function(){
		// controlleKlanr.stop();
		AbstractPage.prototype.transitionOut.apply(this, arguments);
	},
	row:0,
	col:2,
	el: "#sequencer"
});

module.exports = Page;