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
		},
		export: function(){
			var output = this.toJSON();
			output.input = output.input.get("id");
			output.output = output.output.get("id");
			delete output.svgPath;
			delete output.path;
			return output;
		}
	}),
	export: function(){
		return this.map(function(connection){
			return connection.export();
		});
	},
	findByPort: function(port){
		var portType = port.get("type");
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