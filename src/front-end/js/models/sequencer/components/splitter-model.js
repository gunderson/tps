require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function (){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			type: "splitter",
			ports: new Backbone.Collection([
				{
					control: "input",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					defaultValue: 0
				},
				{	
					control: "a",
					type: "output",
					id: _.uniqueId("o_"),
					partner: null,
					defaultValue: 0
				},
				{
					control: "b",
					type: "output",
					id: _.uniqueId("o_"),
					partner: null
				}
			])
		});
	},
	initialize: function(options){
		this.set(_.pick(options, ["patternId"]));
		ComponentModel.prototype.initialize.call(this);
	},
	transformValues: function(inputs, numValues, tickwidth){
		console.log(inputs[0].get("values"))
		return inputs[0].get("values");
	}
});

module.exports = Model;