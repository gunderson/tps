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
		this.listenTo(this.get("components"), "remove", this.destroyConnection);
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

	},
	destroyConnection: function(connection){
		console.log("collection data", arguments);
		connection.get("input").model.set("partnerPort", null);
		connection.get("output").model.set("partnerPort", null);
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
