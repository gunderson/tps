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
					defaultValue: 0
				},
				{
					control: "multiply",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					defaultValue: 1
				},
				{	
					id: _.uniqueId("o_"),
					type: "output",
					partner: null,
				}
			]),
			amplitude: 1,
			frequency: 4, //frequency is in beats
			offset: -0.5, //offset is in beats
		});
	},
	initialize: function(options){
		this.set(_.pick(options, ["patternId"]));
		ComponentModel.prototype.initialize.call(this);
	},
	filter: function(values){
		return _.map(values, this[this.get("mode")]);
	},

	transformValues: function(inputs){
		var tau					= Math.PI * 2;
		var pattern				= this.get("pattern");
		var defaultValue		= this.get("defaultValue");
		var ticksPerBeat		= pattern.get("ticksPerBeat");
		var beatsPerMeasure		= pattern.get("beatsPerMeasure");
		var measuresPerPhrase	= pattern.get("measuresPerPhrase");
		var tickWidth			= pattern.get("tickWidth");
		var numValues			= ticksPerBeat * beatsPerMeasure * measuresPerPhrase;
		
		var amplitude			= this.get("amplitude");
		
		// offset is in beats
		// convert to cycle width
		var offset				= tau * this.get("offset");
		
		// frequency is in beats
		// convert cycles/beat to cycles/tick
		var frequency			= tau / (this.get("frequency") * ticksPerBeat) || 0;

		var val = 0, i = -1;
		var iterations = -1;
		var output = [];
		while (++iterations < numValues){
			/*console.log({
				amplitude: amplitude,
				offset: offset,
				frequency: frequency,
				val: (offset) + (frequency * iterations)
			});*/

			val = -1 * amplitude * Math.cos((offset) + (frequency * iterations));
			output.push(val);
		}
		
		//add output by input#add
		//scale outputs by input#multiply
		var multiplyInputValues = this.get("ports").findWhere({control: "multiply"}).get("values");
		var addInputValues = this.get("ports").findWhere({control: "add"}).get("values");
		output = _.map(output, function(v,i){
			return (v + addInputValues[i]) * multiplyInputValues[i];
		});

		return output;
	},

	cos: function(){

	},

});

module.exports = Model;