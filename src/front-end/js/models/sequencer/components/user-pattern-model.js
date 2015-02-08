require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function (){
		return {
			componentType: "user-pattern",
			type: "none",
			inputLineId: _.uniqueId("i_"),
			inputLineConnection: null,
			inputLevelId: _.uniqueId("i_"),
			inputLevelConnection: null,
			outputId: _.uniqueId("o_"),
			outputConnection: null,
			inputLineValues: [],
			inputLevelValues: [],
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
	getValues: function(){
		var lineValues, levelValues;
	},
});

module.exports = Model;