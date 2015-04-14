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
			offset: 0, //offset is in beats
		});
	},
	initialize: function(options){
		this.set(_.pick(options, ["patternId"]));
		ComponentModel.prototype.initialize.call(this);

		this.on("change:amplitude change:frequency change:offset ", function(){
			this.getOscillation(true);
			this.getValues(true);
		}, this);
		this.listenTo(this.get("ports"), "change", function(){
			this.getOscillation(true);
			this.getValues(true);
		});
	},

	getOscillation: function(regen){
		if (this.oscillation && !regen) return this.oscillation;

		var tau					= Math.PI * 2;
		var pattern				= this.get("pattern");
		var defaultValue		= this.get("defaultValue");
		// TODO: move these values from pattern to pattern.get("scene")
		var scene 				= pattern.get("scene");
		var ticksPerBeat		= scene.get("ticksPerBeat");
		var beatsPerMeasure		= scene.get("beatsPerMeasure");
		var tickWidth			= scene.get("tickWidth");
		var numMeasures			= pattern.get("numMeasures");
		var numValues			= ticksPerBeat * beatsPerMeasure * numMeasures;
		
		var amplitude			= this.get("amplitude");
		
		// offset is in beats
		// convert to cycle width
		var offset				= tau * this.get("offset");
		
		// frequency is in beats
		// convert cycles/beat to cycles/tick
		var frequency			= tau / (this.get("frequency") * ticksPerBeat) || 0;

		var val = 0, i = -1;
		// set to -2 in order to capture the -1 value so we can determine if value at 0 is a peak
		var iterations = -2;
		var output = [];
		while (++iterations < numValues){
			val = -1 * amplitude * Math.cos((offset) + (frequency * iterations));
			output.push(val);
		}

		this.oscillation = output;
		return output;

	},
	transformValues: function(inputs){
		var output = this.getOscillation();
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