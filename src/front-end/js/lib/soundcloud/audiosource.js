var prefixMethod = require("../prefixmethod");

prefixMethod("getUserMedia", {
	parent: navigator
});
prefixMethod("AudioContext");


/**
 * The *AudioSource object creates an analyzer node, sets up a repeating function with setInterval
 * which samples the input and turns it into an FFT array. The object has two properties:
 * streamData - this is the Uint8Array containing the FFT data
 * volume - cumulative value of all the bins of the streaData.
 *
 * The MicrophoneAudioSource uses the getUserMedia interface to get real-time data from the user's microphone. Not used currently but included for possible future use.
 */

navigator.getUserMedia = navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia;


var MicrophoneAudioSource = function(fftsize) {
	var self = this;
	var startTime = Date.now();
	fftsize = fftsize || 2048;
	this.volume = 0;
	var analyser;

	var sampleAudioStream = function() {
		analyser.getByteFrequencyData(self.streamData);
		// calculate an overall volume value
		// var total = 0;
		// for(var i in self.streamData) {
		//     total += self.streamData[i];
		// }
		// self.volume = total;
	};

	// get the input stream from the microphone
	navigator.getUserMedia({
		audio: true
	}, function(stream) {
		var audioCtx = new window.AudioContext();
		var mic = audioCtx.createMediaStreamSource(stream);
		analyser = audioCtx.createAnalyser();
		analyser.fftSize = fftsize;
		mic.connect(analyser);
		this.streamData = new Uint8Array(analyser.frequencyBinCount);
		this.intervalId = setInterval(sampleAudioStream, 1000 / 60);
	}.bind(this), function() {
		alert("error getting microphone input.");
	});

	this.currentTime = function() {
		return (Date.now() - startTime) / 1000;
	};

	this.destroy = function() {
		this.stopSampling();
		source.disconnect();
		analyser.disconnect();
	};
};

var FileAudioSource = function(player, fftsize) {
	fftsize = fftsize || 2048;
	var self = this;
	var analyser;
	var audioCtx = new window.AudioContext();
	analyser = audioCtx.createAnalyser();
	analyser.fftSize = fftsize;
	var source = audioCtx.createMediaElementSource(player);
	source.connect(analyser);
	analyser.connect(audioCtx.destination);
	analyser.smoothingTimeConstant = 0.1;
	var sampleAudioStream = function() {
		analyser.getByteFrequencyData(self.streamData);
		// // calculate an overall volume value
		// var total = 0;
		// // for (var i = 0; i < 80; i++) { // get the volume from the first 80 bins, else it gets too loud with treble
		// //     total += self.streamData[i];
		// // }
		// for(var i in self.streamData) {
		//     total += self.streamData[i];
		// }
		// self.volume = total;
	};
	this.intervalId = setInterval(sampleAudioStream, 1000 / 60);
	// public properties and methods
	this.volume = 0;
	this.streamData = new Uint8Array(analyser.frequencyBinCount);
	this.playStream = function(streamUrl) {
		console.log(streamUrl);
		// get the input stream from the audio element
		player.addEventListener('ended', function() {
			self.directStream('coasting');
		});
		player.setAttribute('src', streamUrl);
		player.play();
	};

	this.setFFTSize = function(fftsize) {
		// this.stopSampling();
		// analyser.disconnect();
		// source.disconnect();
		// analyser = audioCtx.createAnalyser();
		// analyser.fftSize = fftsize;
		// source.connect(analyser);
		// analyser.connect(audioCtx.destination);
		// this.intervalId = setInterval(sampleAudioStream, 1000/60);

	};

	this.stopSampling = function() {
		clearInterval(this.intervalId);
	};

	this.destroy = function() {
		this.stopSampling();
		source.disconnect();
		analyser.disconnect();
	};

	this.currentTime = function() {
		return player.currentTime;
	};
};
if (typeof module === "object") {
	module.exports = {
		FileAudioSource: FileAudioSource,
		MicrophoneAudioSource: MicrophoneAudioSource
	};
}
