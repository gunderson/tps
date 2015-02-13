var Klang = require("../../lib/klang-1.0.5-19")();
var _ = require("underscore");
var $ = require("jquery");


var instance;
var loadGroups;

function SoundManager(){
	var _this = this;
	

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
		loading: $.Deferred(),
		load: function(instruments){
			//ensure input is an array
			if (!$.isArray(instruments)) instruments = [instruments];

			//create promises for each instrument to load
			var promises = [];
			_.each(instruments, function(instrument){
				var promise = new $.Deferred();
				Klang.load(instrument, promise.resolve);
				promises.push(promise);
			});

			//return a deferred that resolves when all promises resolve
			return $.when.apply(this, promises);
		},
		noteOn: function(instrument, noteId, velocity, schedule){

			console.log("Klang.triggerEvent(instrument, noteId, velocity)");
			Klang.triggerEvent(instrument, noteId, velocity, schedule);
		},
		noteOff: function(){
			Klang.triggerEvent.apply(Klang, arguments);
		}
	};

	_.extend(this, pub);

	return this;
}

module.exports = function(){
	// singleton
	if (!instance){
		return instance = new SoundManager();
	} else {
		console.warn("Reinstantiating the Sound Manager Singleton");
		return instance;
	}
};