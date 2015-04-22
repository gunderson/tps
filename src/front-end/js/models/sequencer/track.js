require("backbone");
var _				= require("underscore");
var SoundManager	= require("../../controllers/sequencer/sound-manager")();

var TrackModel = Backbone.Model.extend({
	defaults: function(){
		return {
			//TODO, replace with instrument class
			instrument: {
				name: "piano"
			},
			trackId: 0,
		};
	},
	initialize: function(){
		this.on("change:instrument", this.onChangeInstrument, this);
		this.onChangeInstrument();
	},
	export: function(){
		return this.toJSON();
	},
	onChangeInstrument: function(){
		SoundManager.load(this.get("instrument").name);
	},
	onAddScene: function(){

	},
	onRemoveScene: function(){

	}
});

module.exports = TrackModel;
