require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function (){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			type: "user-pattern",
			ports: new Backbone.Collection([
				{
					control: "threshold",
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
			])
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