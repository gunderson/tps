require("backbone");
var _ = require("underscore");
var PatternCollection = require("../../collections/sequencer/pattern-collection");

var SceneModel = Backbone.Model.extend({
	defaults: function(){
		var settings = {
			// controller: null,
			sceneId: 0,
			patterns: new PatternCollection([]),
			ticksPerBeat: 128,
			beatsPerMeasure: 4, // should match the song beatsPerMeasure
			key: "c",
			currentChange: 0,
			currentMeasure: 0,
			maxNumMeasures: 1,
			changesPattern: [4] // each member of the array is a duration in beats. Should total to a factor of measureLength * beatsPerMeasure.
		};
		settings.tickWidth = (Math.PI * 2) / settings.ticksPerBeat;
		return settings;
	},
	initialize: function(options){
		if (!_.isArray(this.get("patterns"))){
			this.setPatternListeners();
		}
		this.on("change:controller", this.onSetController, this);
		// this.on("change:patterns", this.onSetController, this);
	},
	setPatternListeners: function(){
		var patterns = this.get("patterns");
		this.listenTo(patterns, "edit-pattern", this.onEditPattern);
		this.listenTo(patterns, "add", this.onAddPattern);
		this.listenTo(patterns, "add remove change:numMeasures", this.getLongestMeasureLength);
	},
	onAddPattern: function(model){
		console.log("Scene::onAddPattern", model);
		this.trigger("pattern:add", model);
	},
	removePatternListeners: function(){
		this.stopListening(this.get("patterns"));
	},
	export: function(){
		var output = Backbone.Model.prototype.toJSON.call(this);
		delete output.controller;
		output.patterns = output.patterns.export();
		return output;
	},
	import: function(){
		console.log("Scene::import", this.collection.trackCollection);
		var patternArray = this.get("patterns");
		_.each(patternArray, function(pattern){
			pattern.track = this.collection.trackCollection.findWhere({trackId: pattern.trackId});
			pattern.scene = this;	
		}.bind(this));

		var patterns = new PatternCollection(patternArray);
		this.set({"patterns": patterns});
		patterns.import(this);
		this.setPatternListeners();
		this.getLongestMeasureLength();
	},
	destroy: function(){
		this.removePatternListeners();
		this.get("patterns").destroy();
	},
	addPattern: function(track){
		var p = this.get("patterns").add({
			trackId: track.get("trackId"),
			sceneId: this.get("sceneId"),
			track: track,
			scene: this
		});
		// TODO: make sure patterns are in the same order as tracks
	},
	getLongestMeasureLength: function(){
		this.set("maxNumMeasures",
			this.get("patterns")
				.pluck("numMeasures")
				.reduce(function(memo, num){
				return memo > num ? memo: num;
			}, 1)
		);
	},
	setCurrentScene: function(){
		this.get("controller").model.set("currentSceneId", this.id);
	},
	onSetController: function(){
		this.listenTo(this.get("controller"), "16th", this.on16th);
	},
	onSetPatterns: function(){
		this.setPatternListeners();
	},
	on16th: function(status){
		//if the message isn't for me, ignore it
		if (status.currentSceneId !== this.id) return;

		var sceneStatus = {};

		if (status.currentBeat === this.get("beatsPerMeasure")){
			sceneStatus.currentMeasure = status.currentMeasure + 1;
		}
		if (sceneStatus.currentMeasure > this.get("maxNumMeasures")){
			sceneStatus.currentMeasure = 0;
			this.trigger("end-scene");
		} else {
			this.trigger("16th", _.extend(sceneStatus, status));
		}


	},
	
	onRemovePattern: function(){

	},
	onEditPattern: function(obj, data){
		// forward the event
		this.trigger("edit-pattern", obj);
	},
	onDeleteTrack: function(){

	},
	cleanup:function(){
	}
});


module.exports = SceneModel;
