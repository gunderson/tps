require("backbone");
require("backbone.layoutmanager");
var TrackView = Backbone.Layout.extend({
	el: false,
	template: "sequencer/track",
	events:{
		// "click .content": "onClickContent",
		"click .button.solo": "onClickSolo",
		"click .button.mute": "onClickMute",
		"change .instrument": "onChangeInstrument"
	},
	initialize: function(){
		this.listenTo(this.model, "change:solo", this.onChangeSolo);
		this.listenTo(this.model, "change:mute", this.onChangeMute);
	},
	onChangeSolo: function(){
		if (this.model.get("solo")){
			this.$("button.solo").addClass("active");
		} else {
			this.$("button.solo").removeClass("active");
		}
	},
	onChangeMute: function(){
		if (this.model.get("mute")){
			this.$("button.mute").addClass("active");
		} else {
			this.$("button.mute").removeClass("active");
		}
	},
	onClickSolo: function(){
		this.model.toggleSolo();
	},
	onClickMute: function(){
		this.model.toggleMute();
	},
	onChangeInstrument: function(e){
		this.model.set("instrument", e.target.value);
	}
});

module.exports = TrackView;
