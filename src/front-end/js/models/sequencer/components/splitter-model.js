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
					model: this
				},
				{	
					control: "a",
					type: "output",
					id: _.uniqueId("o_"),
					partner: null,
					model: this
				},
				{
					control: "b",
					type: "output",
					id: _.uniqueId("o_"),
					partner: null,
					model: this
				}
			])
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