require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function (){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			type: "user-pattern",
			ports: [
				{
					control: "threshold",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null
				},
				{	
					id: _.uniqueId("o_"),
					type: "output",
					partner: null,
				}
			]
		});
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