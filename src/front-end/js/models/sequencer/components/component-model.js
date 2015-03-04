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
	getValues: function(numValues, tickwidth){
		var transform = this.transform;
		var inputs = this.get("ports")
			.where({type: "input"});

		_.each(inputs, function(input){
				var output = input.get("partner");
				var inputValues;

				if (output){
					inputValues = output.get("parent").getValues(numValues, tickwidth);
					input.set("values", inputValues);
					return inputValues;
				} else {
					//not connected, return [1,1,1...1]
					inputValues = _.filledArray(numValues, 1);
					input.set("values", inputValues);
					return inputValues;
				}
			});
		//transform values
		return this.transformValues(inputs);
	},
	transformValues: function(inputs){
		var values = _.map(inputs,function(input){
			return input.get("values");
		});
		values = _.map(
			//combine each value at the same index of each array into new arrays
			_.zip.apply(this, values),
			//multiply all the inputs together
			function(a){
				return _.reduce(a, function(memo, num){ return memo * num; }, 0);
			}
		);
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
		this.trigger("connection-response", {model:this, port: this.get("ports").get(portId)});
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