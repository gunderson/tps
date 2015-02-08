require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function(){
		return {
			componentType: "oscillator",
			type: "cos",
			inputAddId: _.uniqueId("i_"),
			inputAddConnection: null,
			inputScaleId: _.uniqueId("i_"),
			inputScaleConnection: null,
			outputId: _.uniqueId("o_"),
			outputConnection: null,
			inputAddValues: [],
			inputScaleLevels: [],
			outputValues: [],
			amplitude: 1,
			period: 4, //period is in cycles/beat
			offset: 0, //offset is in beats
			x: 0,
			y: 0
		};
	},
	initialize: function(options){
		this.set(_.pick(options, ["patternId"]));
	},
	filter: function(values){
		return _.map(values, this[this.get("type")]);
	},

	getValues: function(numBeats, pulsesPerBeat){
		var output = [];
		var tau = Math.PI * 2;
		var pulsesPer16th = pulsesPerBeat * 0.25;
		var amplitude = this.get("amplitude");

		// offset is in beats
		// convert beats to pulses
		var offset = this.get("offset") * pulsesPerBeat;

		// period is in beats
		// convert beats to pulses
		var period = this.get("period") * pulsesPerBeat;

		var totalIterations = numBeats * pulsesPerBeat;
		var val = 0, i = -1;
		while (++iterations < totalIterations){
			val = amplitude * Math.cos(offset + period * tau * (iterations / pulsesPerBeat));
			output.push(val);
		}
		return output;
	},

	cos: function(){

	},

});

module.exports = Model;