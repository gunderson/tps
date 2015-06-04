require("backbone");
var _				= require("underscore");
var SoundManager	= require("../../controllers/sequencer/sound-manager")();

var TrackModel = Backbone.Model.extend({
	defaults: function(){
		return {
			//TODO, replace with instrument class
			instrument: {
				name: "prophet_3"
			},
			trackId: 0,
			solo: false,
			mute: false,
			instruments: require("../../music/Instruments")
		};
	},
	initialize: function(){
		this.on("change:instrument", this.onChangeInstrument, this);
		this.onChangeInstrument();
	},
	export: function(){
		// TODO: replace instrument with flat version
		// track.instrument = track.instrument.toJSON();
		return this.toJSON();
	},
	toggleSolo: function(){
		var v = this.get("solo");
		return this.set("solo", !v);
	},
	toggleMute: function(){
		var v = this.get("mute");
		return this.set("mute", !v);
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
