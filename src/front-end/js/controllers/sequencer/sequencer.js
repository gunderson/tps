var Backbone = require("backbone");

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var tickTimer = 0;

function Sequencer(options){

	var defaults = {};

	options = _.extend({}, defaults, options);

	if (options.audiocontext) audiocontext = options.audiocontext;

	return _.extend(this, {
		play: play,
		stop: stop,
		reset: reset,
		tick: tick,
		getStatus: getStatus,
		setMeasure: setMeasure,
		model: options.model,
		//getters & setters
		get bpm(){
			return _beatsPerMinute;
		},
		set bpm (val){
			return setBPM(val);
		}
	}, Backbone.Events);
}

function play(){
	if (!this.playing){
		this.playing = true;
		_startTime = (audioContext.currentTime * 1000) - (_currentTick * _millisPerTick);
		this.trigger("play");
		this.tick();
	}
}

function pause(){
	
}

function stop(){
	this.playing = false;
	clearTimeout(_tickTimer);
	clearTimeout(_16thTimer);
	this.trigger("stop");
}

function reset(){
	this.stop();
	beatCount		= 0;
	current16th		= 0;
	countInBeat		= 0;
	currentBeat		= 0;
	currentMeasure	= 0;
	beatInMeasure	= 0;
	_currentTick	= -1;
	_last16th		= -1;
	_lastBeat		= -1;
	this.trigger("reset");
}

//getters and setters

function setBPM(bpm){
	_beatsPerMinute = bpm;
	recalculateTiming();
	return bpm;
}

//clock
var _beatsPerMeasure		= 4,
	_ticksPerBeat			= 16,
	_beatsPerMinute			= 120,
	_beatsPerSecond			= _beatsPerMinute / 60,
	_ticksPerSecond			= _ticksPerBeat * _beatsPerSecond,
	_millisPerTick			= 1000 / _ticksPerSecond,
	_millisPer16th			= _ticksPerBeat * 0.25 * _millisPerTick,
	_scheduleAhead			= 200,

	_tickTimer				= 0,
	_16thTimer				= 0,

	_lastTick				= 0,
	_lastTickTime			= 0,
	_currentTick			= 0,

	_last16th				= -1,
	_lastBeat				= 0,
	_lastMeasure			= 0,
	_startTime				= 0;

function tick(){
	var now 			= audioContext.currentTime * 1000,
		// duration		= now - _startTime,
		_this			= this;

	_lastTick 			= _currentTick;
	_currentTick		+= 1;//= (duration / _millisPerTick) >> 0;

	var lastTickTime	= _lastTick * _millisPerTick + _startTime,
		nextTickTime	= lastTickTime + _millisPerTick,
		nextTickDelta	= nextTickTime - now,
		next16th		= _last16th + 1,//(((duration / _millisPer16th) >> 0) + 1),
		next16thTime	= next16th * _millisPer16th + _startTime,
		next16thDelta	= next16thTime - now;

	if (
		// if next16thTime is less than now + _scheduleAhead
		// next16thTime <= now + 100 &&
		next16thTime <= now &&
		// and next16th > last16th
		next16th > _last16th
	){
		_last16th = next16th;
		// schedule 16ths for next16thTime in audiocontext


		// if this 16th is divisible by 4
		if ((next16th+1) % 4 === 0){
			//advance a beat
			_lastBeat++;

			// if this beat is divisible by _beatsPerMeasure
			if (_lastBeat % _beatsPerMeasure === 0){
				//advance a measure
				_lastMeasure++;
			}
		}

		//send out current info to listeners at the same time that the audiocontext triggers
		_16thTimer = setTimeout(function(){
			_this.trigger("16th", 
				_.extend(
					this.getStatus(), 
					{
						schedule: (next16thTime + _scheduleAhead) / 1000
					}
				)
			);
		}.bind(this), next16thDelta);

	}

	//schedule next tick
	_tickTimer = setTimeout(function(){
		this.tick();
	}.bind(this), nextTickDelta);

	this.trigger("tick", {currentTick: _currentTick});
}

function getStatus(schedule){
	return {
		currentSceneId: null,
		current16th: _last16th,
		countInBeat: _last16th % 4,
		currentBeat: _lastBeat,
		currentMeasure: _lastMeasure,
		beatInMeasure: _lastBeat % _beatsPerMeasure
	};
}

function setMeasure(index){
	_lastMeasure = index;
	_lastBeat = 0;
}

function recalculateTiming(){
	_beatsPerSecond = _beatsPerMinute / 60;
	_ticksPerSecond = _ticksPerBeat * _beatsPerSecond;
	_millisPerTick = 1000 / _ticksPerSecond;
	_millisPer16th = _ticksPerBeat * 0.25 * _millisPerTick;
}

module.exports = Sequencer;