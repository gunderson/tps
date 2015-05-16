require("underscore.filledArray");
require("backbone");
var PortModel = require("../port-model");
var PortCollection = require("../../../collections/sequencer/port-collection");

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
		this.on("change:ports", this.onChangePorts, this);

		var portParent = this;
		var ports = this.get("ports");
		// collections initialized from loaded data are arrays
		// don't setup here if it's an array
		if (!_.isArray(ports)){
			ports.each(function(port){
				port.parent = portParent;
			});
		}
	},
	onChangePorts: function(){

	},
	export: function(){
		var output = this.toJSON();
		console.log(output.ports);
		output.ports = output.ports.export();
		output.scene = output.pattern.get("scene").get("sceneId");
		delete output.controller;
		delete output.connectionsCollection;
		delete output.pattern;
		delete output.values;
		return output;
	},
	import: function(){
		var portParent = this;
		var ports = this.get("ports");

		console.log("ComponentModel::import", this.get("ports"));
		if (!_.isArray(ports)) return this;


		var portsCollection = new PortCollection(ports, {
			model: PortModel.extend({
				parent: portParent
			})
		});
		this.set("ports", portsCollection);

		portsCollection.each(function(port){
			if (port.get("partnerPort")){
				console.log("ComponentModel::Load ports, create connection: ", port.id, port.get("partnerPort"));
				this.triggerConnectionRequest(port.id, port.get("partnerPort"));
			}
		}.bind(this));

		// this.get("connectionsCollection").import(portsCollection);
		// this.getValues(true);
		return this;
	},
	getValues: function(regen){
		if (this.get("values") && !regen) return this.get("values");

		var pattern				= this.get("pattern");
		var scene				= pattern.get("scene");
		var ports 				= this.get("ports");

		//ports is an array during import
		if (!scene || !pattern || !ports || _.isArray(ports)) return [];

		var ticksPerBeat		= scene.get("ticksPerBeat");
		var beatsPerMeasure		= scene.get("beatsPerMeasure");
		var tickWidth			= scene.get("tickWidth");
		var numMeasures			= pattern.get("numMeasures");
		var numValues			= ticksPerBeat * beatsPerMeasure * numMeasures + 1;
		var inputs				= ports.where({type: "input"});

		_.each(inputs, function(input){
			var output = input.get("partnerPort");
			var inputValues;
			// when loading from file and building the connection network, the output.parent is an id, not the actual object
			// wait for the actual object
			if (output && typeof output === "object"){
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
		console.log("ComponentModel::setupCollection",this.collection);
		if (this.collection){
			this.listenTo(this.collection, "connection-request", this.onConnectionRequest);
			this.listenTo(this.collection, "connection-response", this.onConnectionResponse);
		}
		return this;
	},
	// triggers
	triggerConnectionRequest: function(portId, partnerId){
		console.log("ComponentModel::triggerConnectionRequest", portId, partnerId);

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
		console.log("ComponentModel::triggerConnectionResponse", portId);
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
		console.log("ComponentModel::onConnectionRequest", data.portId, data.partnerId);
		var ports = this.get("ports");
		// ignore your own connection requests to prevent connecting to yourself
		// ports is an array during import, if not imported, ignore request
		if (_.isArray(ports) || ports.contains(data.port)) {
			return;
		}

		// set connection mode by putting an object in the connectionRequest slot
		this.connectionRequest = data;

		if (ports.get(data.partnerId)){
			//it's a direct request, honor it.
			//these are usually only sent when loading files.
			this.triggerConnectionResponse(ports.get(data.partnerId).id);
			return;
		}
	},
	onConnectionResponse: function(){
		console.log("ComponentModel::onConnectionResponse");

		// cancel connection mode
		this.connectionRequest = null;
	},

	destroyConnection: function(port){
		port.set("partnerPort", null);
		this.set("values", null);
		return this;
	},
	setupConnection: function(localPort, partnerPort){

		console.log("ComponentModel::setupConnection", localPort.id, partnerPort.id);

		// inputs must connect only to outputs
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