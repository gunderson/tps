require("backbone");
var _ = require("underscore");
var SceneCollection = require("../../collections/sequencer/scene-collection");
var TrackCollection = require("../../collections/sequencer/track-collection");

var SequencerModel = Backbone.Model.extend({
	defaults: function(){
		return {
			playing: false,
			bpm: 120,
			beatsPerMeasure: 4,
			currentSceneId: 0,
			loop: false,
			tracks: new TrackCollection([{}]),
			scenes: new SceneCollection([{}]),
			nextSceneId: null,
			repeat: 1,
			copyRequest: null
		};
	},
	initialize: function(options){
		this.get("scenes").trackCollection = this.get("tracks");
		this.listenTo(this.get("scenes"), "edit-pattern", this.onEditPatternEvent);
		this.listenTo(this.get("tracks"), "add", this.onAddTrack);
		this.listenTo(this.get("scenes"), "add", this.onAddScene);

		$(window).on("keydown", this.onKeyDown.bind(this));
	},
	play: function(){
		var scenes = this.get("scenes");
		var activeScene = scenes.getActiveScene();
		this.set("repeat", activeScene.get("repeat"));
		this.controller.play();
	},
	stop: function(){
		this.controller.stop();
	},
	reset: function(){
		this.get("scenes")
			.invoke("set", {"active": false});
		this.controller.reset();
	},
	setController: function(controller){
		this.controller = controller;
		this.listenTo(controller, "16th", this.on16th);
		this.listenTo(controller, "play stop", this.onChangePlay);
	},

	triggerCopyRequest: function(pattern){
		this.get("scenes").triggerCopyRequest(pattern);
		this.set("copyRequest", pattern);
	},
	triggerCancelCopyRequest: function(){
		this.get("scenes").triggerCancelCopyRequest();
		this.set("copyRequest", null);
	},
	triggerExecuteCopy: function(pattern){
		this.get("scenes").executeCopy(pattern);
		this.set("copyRequest", null);
	},
	onChangePlay: function(){
		this.set("playing", this.controller.playing);
	},
	on16th: function(status){
		// get active scene
		var scenes = this.get("scenes");
		var activeScene = scenes.getActiveScene();

		// check how long it is against current 16th
		if (status.currentMeasure >= activeScene.get("maxNumMeasures")){
			status.currentMeasure = 0;
			this.controller.setMeasure(0);
			if (this.get("repeat")){
				// advance the scene
				if (!this.get("loop")){

					activeScene.set("active", false);

					var nextSceneId = this.get("nextSceneId") || 1 + activeScene.get("sceneId");
					activeScene = scenes.findWhere({sceneId: nextSceneId});
					
					if (activeScene){
						activeScene.set("active", true);
						this.set("repeat", activeScene.get("repeat"));
					} else {
						this.set({
							"currentSceneId": 0,
							"loop": false
						});
						this.reset();
						return;
					}
				}
			} else {
				this.set("repeat", this.get("repeat") - 1);
			}


		}

		this.trigger("16th", _.extend(status, {
			currentSceneId: activeScene.get("sceneId")
		}));
	},
	onChangeCurrentScene: function(){

	},
	// autosave to localstorage
	
	autosave: function(){

	},
	save: function(){
			// console.log("pre-stringify",JSON.stringify(this.export()));
		try{
			var filecontents = JSON.stringify(this.export());
			// console.log(filecontents);
			var $a = $("a#saver").attr({
				href: "data:application/json;," + filecontents,
				download: "autopeggiator_" + btoa(Date.now().toString().split("").reverse().join("")).substr(0,5)
			});
			$a[0].click();
			return filecontents;
		} catch (err){
			// console.log(this.export());
			console.error(err);
			return "";
		}
	},
	load: function(file){
		var promise = $.Deferred();
		var reader = new FileReader();

		promise.done(function(){
			reader.onload = null;
			var data;
			// if the json data doesn't parse we don't want to kill the app
			try{
				data = JSON.parse(reader.result);
			} catch(err){
				return;
			}
			this.import(data);
		}.bind(this));

		reader.onload = function(){
			promise.resolve();
		};
		reader.readAsText(file);
	},
	export: function(){
		var output = this.toJSON();
		delete output.controller;
		output.tracks = output.tracks.export();
		output.scenes = output.scenes.export();
		return output;
	},
	import: function(data){
		this.set({
			bpm: data.bpm,
			beatsPerMeasure: data.beatsPerMeasure
		});
		this.get("tracks").import(data.tracks);
		this.get("scenes").import(data.scenes);
	},
	onKeyDown: function(e){
		// console.log("Key Pressed", e.keyCode);
		switch (e.keyCode){
			case 32: //spacebar
				console.log("export", this.save());
				break;
		}
	},
	onEditPatternEvent: function(patternModel){
		//forward the event
		this.trigger("edit-pattern", patternModel);
	},
	onAddTrack: function(trackModel){
		this.triggerCancelCopyRequest();
		// console.log("Sequencer::onAddTrack");
		//add a pattern to each scene model
		this.get("scenes").each(function(sceneModel){
			sceneModel.addPattern(trackModel);
		});
	},
	onAddScene: function(trackModel){
		this.triggerCancelCopyRequest();
		// console.log("Sequencer::onAddTrack");
		//add a pattern to each scene model
		
	}
});

module.exports = SequencerModel;
