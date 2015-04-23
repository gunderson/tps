require("backbone");
var _ = require("underscore");
var SceneCollection = require("../../collections/sequencer/scene-collection");
var TrackCollection = require("../../collections/sequencer/track-collection");

var SequencerModel = Backbone.Model.extend({
	defaults: function(){
		return {
			bpm: 120,
			beatsPerMeasure: 4,
			currentSceneId: 0,
			tracks: new TrackCollection([{}]),
			scenes: new SceneCollection([{}])
		};
	},
	initialize: function(){
		this.get("scenes").trackCollection = this.get("tracks");
		this.listenTo(this.get("scenes"), "edit-pattern", this.onEditPatternEvent);

		$(window).on("keydown", this.onKeyDown.bind(this));
	},
	save: function(){
		var filecontents = JSON.stringify(this.export());
		var $a = $("a").attr({
			href: "data:application/json;," + filecontents,
			download: "autopeggiator_" + btoa(Date.now().toString().split("").reverse().join("")).substr(0,5)
		});
		$a[0].click();
		return filecontents;
	},
	load: function(file){
		var reader = new FileReader();
		reader.onload = function(){
			var data;
			// if the json data doesn't parse we don't want to kill the app
			try{
				data = JSON.parse(reader.result);
			} catch(err){
				return;
			}
			this.import(data);
		}.bind(this);
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
		console.log("Key Pressed", e.keyCode);
		switch (e.keyCode){
			case 32: //spacebar
				console.log("export", this.save());
				break;
		}
	},
	onEditPatternEvent: function(patternModel){
		//forward the event
		this.trigger("edit-pattern", patternModel);
	}
});

module.exports = SequencerModel;
