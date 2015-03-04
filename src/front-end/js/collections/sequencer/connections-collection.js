require("backbone");

var ConnectionsCollection = Backbone.Collection.extend({
	initialize: function(){
	},
	model: Backbone.Model.extend({
		defaults: {
			input: null,
			output: null,
			svgPath: "",
			patternId: null
		},
		initialize: function(options){
			this.set(options);
		}
	}),
	findByPort: function(port){
		console.log(port);
		var portType = port.get("type")
		return this.find(function(connection){	
			if (portType === "input" && connection.get("input") === port){
				return connection;
			} else if (portType === "output" && connection.get("output") === port){
				return connection;
			} else {
				return false;
			}
		});
	}
});

module.exports = ConnectionsCollection;