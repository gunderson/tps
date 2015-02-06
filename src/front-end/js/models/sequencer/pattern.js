require("backbone");
var _ = require("underscore");
var FilterModel = require("./components/filter-model");
var MasterModel = require("./components/master-model");
var OscillatorModel = require("./components/oscillator-model");

var PatternModel = Backbone.Model.extend({
	defaults: function(){
		return {
			url: "",
			sceneId: 0,
			trackId: 0,
			measureLength: 1,
			components: new Backbone.Collection([new MasterModel()])
		};
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
	initialize: function(){

	},
	onDeleteTrack: function(){

	},
	addFilter: function(){
		var model = new FilterModel();
		this.get("components").add(model);
		return model;
	},
	addOscillator: function(){
		var model = new OscillatorModel();
		this.get("components").add(model);
		return model;
	}
});

function identityMeasure(beatsPerMeasure){

}


module.exports = PatternModel;
