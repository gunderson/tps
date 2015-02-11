require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function(){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			ports: [
				{
					control: "rhythm",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null
				},
				{
					control: "pitch",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null
				}
			],
			type: "master"
		});
	}
});

module.exports = Model;