require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function(){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			type: "oscillator",
			mode: "cos",

			ports: new Backbone.Collection([
				{
					control: "add",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					model: this
				},
				{
					control: "multiply",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					model: this
				},
				{	
					id: _.uniqueId("o_"),
					type: "output",
					partner: null,
					model: this
				}
			]),
			amplitude: 1,
			period: 4, //period is in cycles/beat
			offset: 0, //offset is in beats
		});
	},
	initialize: function(options){
		this.set(_.pick(options, ["patternId"]));
	},
	filter: function(values){
		return _.map(values, this[this.get("mode")]);
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