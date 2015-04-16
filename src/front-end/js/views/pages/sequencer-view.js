require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");
var SoundManager = require("../../controllers/sequencer/sound-manager")();
var TransportBarView = require("./sequencer/transportBar-view");
var SceneManagerView = require("./sequencer/scene-manager-view");
var TrackManagerView = require("./sequencer/track-manager-view");

var sequencerStatus;
var controller;



var Page = AbstractPage.extend({
	row:0,
	col:2,
	keep:true,
	el: "#sequencer",
	sceneManager: null,
	trackManager: null,
	transportBar: null,
	patternDetail: null,
	events: {
		// can't assign scroll events in the events hash, moved to after render
		// "scroll #track-manager": "onScroll"
	},
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


		this.transportBar = new TransportBarView({
			controller: controller
		});
		this.sceneManager = new SceneManagerView({
			sceneCollection: controller.model.get("scenes"),
			trackCollection: controller.model.get("tracks"),
			controller: controller
		});
		this.trackManager = new TrackManagerView({
			sceneCollection: controller.model.get("scenes"),
			trackCollection: controller.model.get("tracks"),
			controller: controller
		});

		this.setViews({
			"#transportBar": this.transportBar,
			"#track-manager": this.trackManager,
			"#scene-manager": this.sceneManager
		});

		this.on("transitionInComplete", this.transitionInComplete);
	},
	beforeRender: function(){
		// console.log("Sequencer-view::beforeRender", this.route)
	},
	afterRender: function(){
		// console.log("Sequencer-view::afterRender");
		this.$(".tracks").on("scroll", this.syncScroll.bind(this));
		// this.listenTo(this.sceneManager, "afterRender", this.syncScroll);
		// this.listenTo(this.trackManager,"afterRender", this.syncScroll);
	},
	transitionInComplete: function(){
		// controller.play();
	},
	transitionOut: function(){
		// controller.stop();
		AbstractPage.prototype.transitionOut.apply(this, arguments);
	},
	syncScroll: function(){
		this.$("#scene-manager .scene .patterns").scrollLeft(this.$("#track-manager .tracks").scrollLeft());
	},
	onScroll: function(e){
		this.$("#scene-manager .scene .patterns").scrollLeft(e.target.scrollLeft);
	},
	showPatternDetail: function(){
		this.$("#pattern-detail").show();
	},
	hidePatternDetail: function(){
		this.$("#pattern-detail").hide();
	}

});

module.exports = Page;