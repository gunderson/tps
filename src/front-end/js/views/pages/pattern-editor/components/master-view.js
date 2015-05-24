require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view");

var View = ComponentView.extend({
	// el: false,
	// keep: true,
	template: "pattern-editor/components/master",
	initialize: function(options){
		// console.log("master");
	},
	setControlListeners: function(){
		this.$controls.find(".scale-bias input").on("input blur", this.onChangeScaleBias.bind(this));
		this.$controls.find(".scale-resolution input").on("input blur", this.onChangeScaleResolution.bind(this));
		this.$controls.find(".num-octaves input").on("input blur", this.onChangeNumOctaves.bind(this));
		this.$controls.find(".base-octave input").on("input blur", this.onChangeBaseOctave.bind(this));
		this.$controls.find(".threshold input").on("input blur", this.onChangethreshold.bind(this));
	},
	clearControlListeners: function(){
		this.$controls.find(".scale-bias input").off("input blur");
		this.$controls.find(".scale-resolution input").off("input blur");
		this.$controls.find(".num-octaves input").off("input blur");
		this.$controls.find(".base-octave input").off("input blur");
		this.$controls.find(".threshold input").off("input blur");
	},
	afterRender: function(){
		ComponentView.prototype.afterRender.call(this);
		this.renderWaveforms();
	},
	onChange: function(){
		this.renderWaveforms();
	},
	onChangethreshold: function(e){
		this.model.get("pattern").set("threshold", parseFloat(e.target.value));
	},
	// control event handlers
	onChangeScaleBias: function(e){
		this.model.get("pattern").set("scaleBias", parseFloat(e.target.value));
	},
	onChangeScaleResolution: function(e){
		this.model.get("pattern").set("scaleResolution", parseFloat(e.target.value));
	},
	onChangeNumOctaves: function(e){
		this.model.get("pattern").set("numOctaves", parseFloat(e.target.value));
	},
	onChangeBaseOctave: function(e){
		this.model.get("pattern").set("baseOctave", parseFloat(e.target.value));
	},
	renderWaveforms: function(){
		var ports = this.model.get("ports");

		var $outputDisplay = $("#sequencer-display .output-display .waveform");
		Snap($outputDisplay[0]).clear();
		$outputDisplay.parent().removeClass("active");

		var $oscillationDisplay = $("#sequencer-display .oscillation-display .waveform");
		Snap($oscillationDisplay[0]).clear();
		$oscillationDisplay.parent().removeClass("active");

		var $rhythmDisplay = $("#sequencer-display .rhythm-display .waveform");
		this.model.getValues();
		this.renderWaveform($rhythmDisplay, this.model.get("values").rhythm, "#ff0");
		$rhythmDisplay.parent().addClass("active");

		var $pitchDisplay = $("#sequencer-display .pitch-display .waveform");
		this.renderWaveform($pitchDisplay,  this.model.get("values").pitch, "#f0f");
		$pitchDisplay.parent().addClass("active");

		return this;
	},
	serialize: function(){
		var ports = this.model.get("ports");
		var pattern = this.model.get("pattern");
		return {
			rhythmInputId: ports.findWhere({type: "input", control: "rhythm"}).id,
			pitchInputId: ports.findWhere({type: "input", control: "pitch"}).id,
			scaleBias: pattern.get("scaleBias"),
			scaleResolution: pattern.get("scaleResolution"),
			numOctaves: pattern.get("numOctaves"),
			baseOctave: pattern.get("baseOctave"),
			threshold: pattern.get("threshold")
		};
	}
});

module.exports = View;