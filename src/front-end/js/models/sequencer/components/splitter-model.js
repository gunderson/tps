require("backbone");
var ComponentModel = require("./component-model");

var Model = ComponentModel.extend({
	defaults: function (){
		return _.extend({}, _.result(ComponentModel.prototype, "defaults"),
		{
			type: "splitter",
			ports: [
				{
					control: "input",
					type: "input",
					id: _.uniqueId("i_"),
					partner: null
				},
				{	
					control: "a",
					type: "output",
					id: _.uniqueId("o_"),
					partner: null
				},
				{
					control: "b",
					type: "output",
					id: _.uniqueId("o_"),
					partner: null
				}
			]
		});
	},
	initialize: function(options){
		this.set(_.pick(options, ["patternId"]));
	},
	getValues: function(){
		if (!dirty){
			return 
		}
	},
});

module.exports = Model;