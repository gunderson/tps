require("backbone");
require("backbone.layoutmanager");

var Instrument = Backbone.Layout.extend({
	template:"sound-board/instrument",
	el: false,
	events:{
		"click .load": "onClickLoad",
		"click .trigger": "onClickTrigger"
	},
	initialize: function(options){
		this.instrument = options.instrument;
		this.SoundManager = options.SoundManager;
	},
	afterRender: function(){

	},
	serialize: function(){
		return {
			instrument: this.instrument
		};
	},

	onClickLoad: function(e){
		$(e.target).text("loading").addClass("loading");
		this.SoundManager.load(this.instrument.name).done(function(){
			$(e.target).text("ready").addClass("loaded").removeClass("loading");
		});
	},
	onClickTrigger: function(e){
		this.SoundManager.noteOn(this.instrument.name, this.$("input.noteValue").val() / 1, 127);
	}
});

module.exports = Instrument;