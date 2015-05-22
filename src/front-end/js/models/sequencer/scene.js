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
			key: "dm",
			currentMeasure: 0,
			maxNumMeasures: 1,
			active: false,
			repeat: 1
		};
		settings.tickWidth = (Math.PI * 2) / settings.ticksPerBeat;
		return settings;
	},
	initialize: function(options){
		if (!_.isArray(this.get("patterns"))){
			this.setPatternListeners();
		}
		this.on("change:controller", this.onSetController, this);
		this.on("change:key", this.onChangeKey, this);
	},
	destroy: function(){
		this.collection.remove(this);
		this.get("patterns").destroy();
		this.stopListening();
	},
	setPatternListeners: function(){
		var patterns = this.get("patterns");
		this.listenTo(patterns, "edit-pattern", this.onEditPattern);
		this.listenTo(patterns, "add", this.onAddPattern);
		this.listenTo(patterns, "add remove change:length", this.getLongestMeasureLength);
	},
	removePatternListeners: function(){
		this.stopListening(this.get("patterns"));
	},

	// Event Listeners --------------------------------------------------------------

	onAddPattern: function(model){
		this.trigger("pattern:add", model);
	},
	onSetController: function(){
		console.log("Scene::onSetController", arguments);
		this.listenTo(this.get("controller"), "copy-request", this.onCopyRequest);
		this.listenTo(this.get("controller"), "execute-copy", this.onExecuteCopy);
		this.listenTo(this.get("controller"), "16th", this.on16th);
	},
	onExecuteCopy: function(source){
		this.trigger("execute-copy", source);
	},
	onCopyRequest: function(source){
		this.trigger("copy-request", source);
	},
	onChangeKey: function(obj, val){
		this.get("patterns").each(function(pattern){
			pattern.set("key", val);
		});
	},
	onSetPatterns: function(){
		this.setPatternListeners();
	},
	on16th: function(status){
		//if the message isn't for me, ignore it
		if (status.currentSceneId !== this.get("sceneId")) {
			return;
		}
		var sceneStatus = {};
		if (status.currentMeasure > this.get("maxNumMeasures")){
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


	// Directives --------------------------------------------------------------
	triggerCopyRequest: function(sourcePattern){
		this.trigger("copy-request", sourcePattern);
	},
	cancelCopyRequest: function(){
		this.trigger("cancel-copy-request");
	},
	executeCopy: function(){
		this.trigger("execute-copy-request");
	},
	export: function(){
		var output = Backbone.Model.prototype.toJSON.call(this);
		delete output.controller;
		output.patterns = output.patterns.export();
		return output;
	},
	import: function(){
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
	addPattern: function(track){
		var p = this.get("patterns").add({
			trackId: track.get("trackId"),
			sceneId: this.get("sceneId"),
			track: track,
			scene: this
		});
	},
	getLongestMeasureLength: function(){
		this.set("maxNumMeasures",
			this.get("patterns")
				.pluck("length")
				.reduce(function(memo, num){
				return memo > num ? memo: num;
			}, 1)
		);
	},
	setCurrentScene: function(){
		this.get("controller").model.set("currentSceneId", this.id);
	},
	cleanup:function(){
	}
});


module.exports = SceneModel;
