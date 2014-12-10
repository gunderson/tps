require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page");
var TransportBar = require("../sequencer/transportBar");
var SoundManager = require("../../controllers/sequencer/sound-manager")();
var SceneManager = require("../sequencer/scene-manager");
var TrackManager = require("../sequencer/track-manager");

var sequencerStatus;
var controller;



var Page = AbstractPage.extend({
	initialize: function(options){
		AbstractPage.prototype.initialize.call(this);

		controller = options.controller;
		model = options.model;
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

		console.log(controller)

		this.setViews({
			"#transportBar": new TransportBar({
				controller: controller
			}),
			"#scene-manager": new SceneManager({
				sceneCollection: controller.model.get("scenes"),
				trackCollection: controller.model.get("tracks")
			}),
			"#track-manager": new TrackManager({
				sceneCollection: controller.model.get("scenes"),
				trackCollection: controller.model.get("tracks"),
			}),
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