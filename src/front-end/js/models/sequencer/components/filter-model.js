require("backbone");
var _ = require("underscore");
var ComponentModel = require("./component-model");

// filters take an array of values and 

var Model = ComponentModel.extend({
	defaults: function (){
		return {
			componentType: "filter",
			type: "none",
			inputLineId: _.uniqueId("i_"),
			inputLineConnection: null,
			inputLevelId: _.uniqueId("i_"),
			inputLevelConnection: null,
			outputId: _.uniqueId("o_"),
			outputConnection: null,
			inputValues: [],
			inputLevels: [],
			outputValues: [],
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
	getLineLevels: function(){

	},

	getInputLevels: function(){

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