require("backbone");
var PortModel = require("../../models/sequencer/port-model");

var Collection = Backbone.Collection.extend({
	model: PortModel,
	export: function(){
		return this.map(function(port){
			return port.export();
		});
	},
});

module.exports = Collection;