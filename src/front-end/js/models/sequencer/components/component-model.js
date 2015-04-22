require("underscore.filledArray");
require("backbone");
var PortModel = require("../port-model");

var Model = Backbone.Model.extend({
	dirty: false,
	connectionRequest: null,
	defaults: {
		values: null,
		x:0,
		y:0,
		defaultValue: 1
	},
	initialize: function(options){
		var portParent = this;
		var ports = this.get("ports")
			.each(function(port){
				port.parent = portParent;
			});
	},
	export: function(){
		var output = this.toJSON();
		output.ports = output.ports.export();
		delete output.controller;
		delete output.values;
		delete output.connectionsCollection;
		delete output.pattern;
		return output;
	},
	import: function(){
		var portParent = this;
		var ports = this.get("ports");
		var portsCollection = new Backbone.Collection([], {
			model: PortModel.extend({
				portParent: portParent
			})
		});
		this.set("ports", portsCollection);

	},
	getValues: function(regen){
		if (this.get("values") && !regen) return this.get("values");

		var pattern				= this.get("pattern");
		var scene				= pattern.get("scene");
		var ticksPerBeat		= scene.get("ticksPerBeat");
		var beatsPerMeasure		= scene.get("beatsPerMeasure");
		var tickWidth			= scene.get("tickWidth");
		var numMeasures			= pattern.get("numMeasures");
		var numValues			= ticksPerBeat * beatsPerMeasure * numMeasures + 1;
		var inputs				= this.get("ports").where({type: "input"});

		_.each(inputs, function(input){
			var output = input.get("partnerPort");
			var inputValues;
			if (output){
				inputValues = output.parent.getValues(regen);
				input.set("values", inputValues);
				return inputValues;
			} else {
				//not connected, return [defaultValue,defaultValue...defaultValue]
				var defaultValue = input.get("defaultValue");
				inputValues = _.filledArray(numValues, defaultValue);
				input.set("values", inputValues);
				return inputValues;
			}
		});
		//transform values
		var values = this.transformValues(inputs, numValues, tickWidth);
		this.set("values", values);
		this.trigger("regenerate");
		return values;
	},

	// This transform Function multiplies the values from each port
	transformValues: function(inputs, numValues, tickwidth){
		var values = _.map(inputs,function(input){
			return input.get("values");
		});
		values = _.map(
			//combine each value at the same index of each array into new arrays
			_.zip.apply(this, values),
			//multiply all the inputs together
			function(a){
				return _.reduce(a, function(memo, num){ return memo * num; }, 1);
			}
		);
		return values;
	},
	setupCollection: function(){
		if (this.collection){
			this.listenTo(this.collection, "connection-request", this.onConnectionRequest);
			this.listenTo(this.collection, "connection-response", this.onConnectionResponse);
		}
		return this;
	},
	// triggers
	triggerConnectionRequest: function(portId, partnerId){
		var port = this.get("ports").get(portId);
		this.trigger("connection-request", {
			model: this,
			port: port,
			partnerId: partnerId
		});
	},
	destroy: function(){
		this.stopListening();
		this.collection.remove(this);
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
		} else if (this.get("ports").get(data.partnerId)){
			//it's a direct request, honor it.
			this.triggerConnectionResponse(this.get("ports").get(data.partnerId).id);
			return;
		}

		// set connection mode by putting an object in the connectionRequest slot
		this.connectionRequest = data;
	},
	onConnectionResponse: function(){
		// cancel connection mode
		this.connectionRequest = null;
	},

	destroyConnection: function(port){
		port.set("partnerPort", null);
		this.set("values", null);
		return this;
	},
	setupConnection: function(localPort, partnerPort){
		if (localPort.get("type") === partnerPort.get("type")) return;
		this.set("values", null);
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
		return this;
	}
});

module.exports = Model;