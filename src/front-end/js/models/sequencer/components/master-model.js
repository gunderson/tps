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
					model: this
				},
				{
					control: "pitch",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null,
					model: this
				}
			]),
			type: "master"
		});
	}
});

module.exports = Model;