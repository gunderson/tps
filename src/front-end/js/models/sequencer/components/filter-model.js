require("backbone");
var _ = require("underscore");
var ComponentModel = require("./component-model");

// filters take an array of values and 

var Model = ComponentModel.extend({
	defaults: function (){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			ports: new Backbone.Collection([
				{
					control: "line",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					defaultValue: 0
				},
				{
					control: "level",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					defaultValue: 0
				},
				{	
					id: _.uniqueId("o_"),
					type: "output",
					partner: null,
				}
			]),
			type: "filter",
			mode: "passthrough"
		});
	},
	initialize: function(options){
		this.set(_.pick(options, ["patternId"]));
		ComponentModel.prototype.initialize.call(this);
	},
	transformValues: function(inputs, numValues, tickwidth){
		//filter only has one input
		var values = inputs[0].get("values");
		return _.map(values, this[this.get("mode")]);
	},

	// transforms
	none: function(val, i){
		return val;
	},
	passthrough: function(i){
		return i;
	},
	scale: function(val, i){
		var scale = this.get("inputLevels")[i];
		if (!scale && scale !== 0){
			scale = 1;
		}
		return val * scale;
	},
	offset: function(){

	},
	digital: function(val, i){
		if (val < 0.5) return 0;
		if (val >= 0.5) return 1;
	}
});

module.exports = Model;