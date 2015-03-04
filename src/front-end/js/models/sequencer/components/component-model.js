require("../../../lib/underscore.filledArray");
require("backbone");

var Model = Backbone.Model.extend({
	dirty: false,
	connectionRequest: null,
	defaults: {
		values: [],
		x:0,
		y:0
	},
	initialize: function(options){
		var portParent = this;
		this.get("ports").each(function(port){
			port.set("parent", portParent);
		});
	},
	getValues: function(numValues, interval){
		var transform = this.transform;
		var values = this.get("ports")
			.where({type: "input"})
			.map(function(input){
				var output = input.get("partner");
				if (output){
					return output.get("parent").getValues(numValues, interval);
				} else {
					return _.filledArray(numValues, 1);
				}
			});
		//transform values
		return values;
	},
	setupCollection: function(){
		if (this.collection){
			this.listenTo(this.collection, "connection-request", this.onConnectionRequest);
			this.listenTo(this.collection, "connection-response", this.onConnectionResponse);
		}
	},
	// triggers
	triggerConnectionRequest: function(portId){
		var port = this.get("ports").get(portId);
		this.trigger("connection-request", {
			model: this,
			port: port
		});
	},
	triggerConnectionResponse: function(portId){
		var port = this.get("ports").get(portId);
		//if source is an output
		if (this.connectionRequest){
			//send connection resopnse
			this.setupConnection(port, this.connectionRequest.port);
		}
		// tell other components to cancel connection mode
		this.cancelConnectionRequest(port);
	},
	cancelConnectionRequest: function(portId){
		this.trigger("connection-response", portId);
	},

	//handlers
	onConnectionRequest: function(data){
		// ignore your own connection requests to prevent connecting to yourself
		if (this.get("ports").contains(data.port)) {
			return;
		}

		// set connection mode by putting an object in the connectionRequest slot
		this.connectionRequest = data;
	},
	onConnectionResponse: function(){
		// cancel connection mode
		this.connectionRequest = null;
	},

	setupConnection: function(localPort, partnerPort){
		if (localPort.get("type") === partnerPort.get("type")) return;
		localPort.set({
			partnerPort: partnerPort
		});
		partnerPort.set({
			partnerPort: localPort
		});
		this.get("connectionsCollection").add({
			input: (localPort.get("type") === "input") ? localPort : partnerPort,
			output: (localPort.get("type") === "output") ? localPort : partnerPort
		});
	}
});

module.exports = Model;