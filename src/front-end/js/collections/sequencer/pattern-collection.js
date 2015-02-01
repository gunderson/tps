require("backbone");
var PatternModel = require("../../models/sequencer/pattern");

var PatternCollection = Backbone.Collection.extend({
	model: PatternModel,
	initialize: function(){
	}
});

module.exports = PatternCollection;