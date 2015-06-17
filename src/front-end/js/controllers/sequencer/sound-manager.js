var Klang = require("../../lib/klang-1.0.5-19")();
var _ = require("underscore");
var $ = require("jquery");
var Theory = require("../../music/Theory");
var WebMidi = require("../../music/WebMidi");


var instance;
var loadGroups;

function SoundManager(){
	var _this = this;
	var instrumentLoadQueue = [];

	this.midiOutput = null;
	this.webMidi = WebMidi;
	

	// ------------------------ Setup Klang

	var isFirefox = Klang.detector.browser.name === 'Firefox';
	var klangConfig = (
			! isFirefox && (
				window.AudioContext    		|| 
				window.webkitAudioContext 	|| 
				window.mozAudioContext    	|| 
				window.msAudioContext
			)
		) ? "assets/sounds/webaudio/config.json" : "assets/sounds/audiotag/config.json";
	Klang.loggingEnabled = true;
	window.Klang = Klang;

	Klang.init(klangConfig, function() {
		_this.loadGroups = Klang.getLoadGroups();
		_this.loading.resolve();
	}, null, null, { engine: isFirefox ? 'audiotag' : 'auto' });

	// ------------------------- End Klang

	var pub = {
		loadGroups: loadGroups,
		// TODO: Switch this to q?
		loading: $.Deferred(),
		load: function(instruments){
			//ensure input is an array
			if (!$.isArray(instruments)) instruments = [instruments];
			// console.log("SoundManager loading instruments: ", instruments);
			//create promises for each instrument to load
			var promises = [];
			if (this.loading.state() === "resolved"){
				_.each(instruments, function(instrument){
					var promise = new $.Deferred();
					Klang.load(instrument, promise.resolve);
					promises.push(promise);
				});

				//return a deferred that resolves when all promises resolve
				return $.when.apply(this, promises);
			} else {
				instrumentLoadQueue = instrumentLoadQueue.concat(instruments);
			}
		},
		noteOn: function(instrument, noteId, velocity, schedule){

			// console.log("Klang.triggerEvent("+instrument+", "+noteId+", "+velocity+", "+schedule+")");
			Klang.triggerEvent(instrument, noteId, velocity, schedule);

			// defaults to midi output 0, can be chosen by the user by redefining this.midiOutput from list of outputs in this.webMidi
			// if (!this.midiOutput && this.webMidi && this.webMidi.outputs.length > 0) {
			// 	this.midiOutput = this.webMidi.outputs[0];
			// } else if (!this.midiOutput){
			// 	return;
			// }

			// var noteOnMessage = [0x90, noteId, 0x79];
			// this.midiOutput.send( noteOnMessage );  //omitting the timestamp means send immediately.
			// this.midiOutput.send( [0x80, noteId, 0x40], window.performance.now() + 1000.0 ); // Inlined array creation- note off 
		},
		noteOff: function(){
			Klang.triggerEvent.apply(Klang, arguments);
		},

		note2num: function(note){
			var s = Theory.scale;
			var octave = parseInt(note.slice(-1), 10);
			var num = s.indexOf(note.substr(0,note.length - 1)) + (octave * 12);
			// console.log("note2num", note, num);
			return num;
		}
	};

	pub.loading.then(function(){
		pub.load(instrumentLoadQueue);
	}.bind(this));

	_.extend(this, pub);

	return this;
}

module.exports = function(){
	// singleton
	if (!instance){
		return instance = new SoundManager();
	} else {
		//console.warn("Reinstantiating the Sound Manager Singleton");
		return instance;
	}
};