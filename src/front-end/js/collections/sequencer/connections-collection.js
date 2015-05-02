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
		},
		import: function(){

		}
	}),
	export: function(){
		return this.map(function(connection){
			return connection.export();
		});
	},
	import: function(portsCollection){
		var portIds = portsCollection.pluck("id");
		var matchingConnections = _.filter(portIds, function(portId){
			var connection = this.findWhere({"output": portId});
			var port = null;
			if (connection){
				port = portsCollection.get(portId);
				if (typeof connection.get("input") === "object"){
					port.set("partnerPort", connection.get("input"));
				}
				return connection.set("output", port);
			}

			connection = this.findWhere({"input": portId});
			if (connection){
				port = portsCollection.get(portId);
				if (typeof connection.get("output") === "object"){
					port.set("partnerPort", connection.get("output"));
				}
				return connection.set("input", port);
			}

			return false;
				
		}.bind(this));

		console.log("ConnectionsCollection::import", this.toJSON());
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