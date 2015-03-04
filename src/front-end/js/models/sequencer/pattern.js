require("backbone");
var _ = require("underscore");
var FilterModel = require("./components/filter-model");
var MasterModel = require("./components/master-model");
var OscillatorModel = require("./components/oscillator-model");
var UserPatternModel = require("./components/user-pattern-model");
var SplitterModel = require("./components/splitter-model");
var ConnectionsCollection = require("../../collections/sequencer/connections-collection");
var ComponentsCollection = require("../../collections/sequencer/components-collection");

var PatternModel = Backbone.Model.extend({
	defaults: function(){
		var connectionsCollection = new ConnectionsCollection();
		return {
			url: "",
			sceneId: 0,
			trackId: 0,
			measureLength: 1,
			components: new ComponentsCollection([new MasterModel({connectionsCollection:connectionsCollection})]),
			connections: connectionsCollection
		};
	},
	initialize: function(){
		this.get("components").at(0).setupCollection();
		this.listenTo(this.get("components"), "remove", this.destroyConnections);
		this.listenTo(this.get("components"), "connection-request", this.onConnectionRequest);
		this.listenTo(this.get("components"), "connection-response", this.onConnectionResponse);
	},
	// override fetch() since this doesn't need to get page info from server
	fetch: function(){
		// create a promise to send back since calling fetch() expects a promise to be returned
		var promise = $.Deferred();
		// resolve the promise after the current stack clears
		_.defer(function(){
			promise.resolve();
		});
		return promise;
	},
	onDeleteTrack: function(){
		//delete all components
	},
	onConnectionRequest: function(connectionRequest){
		this.destroyPort(connectionRequest.port);
	},

	onConnectionResponse: function(connectionResponse){
		var ticksperbeat = 64;
		var beatspermeasure = 4;
		var measuresperphrase = 4;
		var tickwidth = (Math.PI * 2) / ticksperbeat;
		var values = this.get("components")
			.findWhere({type:"master"})
			.getValues(ticksperbeat * beatspermeasure * measuresperphrase, tickwidth);
		console.log(values);
	},
	destroyConnections: function( component ){
		var destroyPort = this.destroyPort;
		_.each(component.get( "ports" ), function( port ){
			destroyPort( port );
		});
	},
	destroyPort: function( port ){
		var connection = this.get("connections").findByPort( port );
		if ( connection ) this.destroyConnection( connection );
	},
	destroyConnection: function( connection ){
		console.log("collection data", arguments);
		var resetSettings = {
			"partner": null
		};
		connection.get("path").remove();
		connection.get( "input"  ).get("parent").set( resetSettings );
		connection.get( "output" ).get("parent").set( resetSettings );
		this.get( "connections" ).remove( connection );
	},
	addFilter: function(){
		var model = this.get("components").add(new FilterModel({
				connectionsCollection: this.get("connections")
			})
		);
		model.setupCollection();
		return model;
	},
	addOscillator: function(){
		var model = this.get("components").add(new OscillatorModel({
				connectionsCollection: this.get("connections")
			})
		);
		model.setupCollection();
		return model;
	},
	addUserPattern: function(){
		var model = this.get("components").add(new UserPatternModel({
				connectionsCollection: this.get("connections")
			})
		);
		model.setupCollection();
		return model;
	},
	addSplitter: function(){
		var model = this.get("components").add(new SplitterModel({
				connectionsCollection: this.get("connections")
			})
		);
		model.setupCollection();
		return model;
	}
});

function identityMeasure(beatsPerMeasure){

}


module.exports = PatternModel;
