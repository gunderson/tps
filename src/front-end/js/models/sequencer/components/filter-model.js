require("backbone");
var _ = require("underscore");
var ComponentModel = require("./component-model");

// filters take an array of values and 

var Model = ComponentModel.extend({
	defaults: function (){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			ports: [
				{
					control: "line",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null
				},
				{
					control: "level",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null
				},
				{	
					id: _.uniqueId("o_"),
					type: "output",
					partner: null,
				}
			],
			type: "filter",
			mode: "passthrough"
		});
	},
	initialize: function(options){
		this.set(_.pick(options, ["patternId"]));
	},
	filter: function(values){
		return _.map(values, this[this.get("mode")]);
	},
	getValues: function(){
		var lineValues, levelValues;
	},
	passthrough: function(i){
		return i;
	},

	// transforms
	none: function(val, i){
		return val;
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