require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function(){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			ports: new Backbone.Collection([
				{
					control: "rhythm",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					defaultValue: 0
				},
				{
					control: "pitch",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					defaultValue: 0.5
				}
			]),
			type: "master",
			threshold: 0.75
		});
	},

	transformValues: function(inputs, numValues, tickwidth){
		var values = _.map(inputs,function(input){
			return input.get("values");
		});
		values = {
			rhythm: this.get("ports").findWhere({control: "rhythm"}).get("values"),
			pitch: this.get("ports").findWhere({control: "pitch"}).get("values")
		};
		return values;
	}
});

module.exports = Model;