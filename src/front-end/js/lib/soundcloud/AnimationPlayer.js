var _ = require("underscore");
require("underscore.filledArray");


var prefixMethod = require("../prefixmethod");
prefixMethod("requestAnimationFrame");
prefixMethod("cancelAnimationFrame");



var AnimationPlayer = function(options) {
	var audioSource = options.audioSource;
	var container = options.container;
	var visualizer = options.visualizer;
	var audioPlayer = options.audioPlayer;

	var loopFrame;
	var streamData = new Uint8Array(1024);
	var isPlaying = false;
	var updates = 0;
	var tick = 0;


	this.play = play.bind(this);
	this.stop = stop.bind(this);
	this.onFullScreen = onFullScreen.bind(this);
	this.setVisualizer = setVisualizer.bind(this);
	this.audioPlayer = audioPlayer;
	this.el = container;
	this.$el = $(container);


	// ------------------------------------

	var WIDTH, HEIGHT;


	function setVisualizer(_visualizer) {
		visualizer = _visualizer;
		WIDTH = this.$el.width();
		HEIGHT = this.$el.height();


		visualizer.setSize(WIDTH, HEIGHT);
	}

	function onFullScreen(e) {
		this.$el.toggleClass("fullscreen");
		WIDTH = this.$el.width();
		HEIGHT = this.$el.height();
		visualizer.setSize(WIDTH, HEIGHT);
	}


	// ------------------------------------

	var ticksPerSecond = 60;
	var millisPerTick = 1000 / ticksPerSecond;
	var animationFrameID = null,
		updateIntervalID = null;

	function play() {
		if (animationFrameID === null) {
			onAnimationFrame();
		}
		if (updateIntervalID === null) {
			if (visualizer) {
				visualizer.reset();
			}
			onUpdateInterval.call(this);
			updateIntervalID = setInterval(onUpdateInterval.bind(this), millisPerTick);
		}
	}

	function stop() {
		cancelAnimationFrame(animationFrameID);
		animationFrameID = null;
		clearInterval(updateIntervalID);
		updateIntervalID = null;
	}

	var fftData;

	function onUpdateInterval() {
		if (!visualizer) return;
		let time = audioSource.currentTime();
		tick = time * 1000 / millisPerTick;

		// console.log(time, tick);

		updates++;

		streamData = new Uint8Array(audioSource.streamData.buffer.slice());
		visualizer.update(streamData, time, tick, updates);
	}

	function onAnimationFrame() {
		animationFrameID = requestAnimationFrame(onAnimationFrame);
		if (!visualizer) return;
		visualizer.render();
	}

};



module.exports = AnimationPlayer;
