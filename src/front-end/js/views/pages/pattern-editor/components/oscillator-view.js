require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view");

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/oscillator",
	initialize: function(options){
		console.log("oscillator");
		this.listenTo(this.model, "change", this.onChange);
	},
	setControlListeners: function(){
		this.$controls.find(".amplitude-input input").on("input blur", this.onChangeAmplitudeInput.bind(this));
		this.$controls.find(".frequency-input input").on("input blur", this.onChangeFrequencyInput.bind(this));
		this.$controls.find(".offset-input    input").on("input blur", this.onChangeOffsetInput.bind(this)   );
	},
	clearControlListeners: function(){
		this.$controls.find(".amplitude-input input").off("input blur");
		this.$controls.find(".frequency-input input").off("input blur");
		this.$controls.find(".offset-input    input").off("input blur");
	},
	afterRender: function(){
		ComponentView.prototype.afterRender.call(this);
	},
	onChange: function(){
		this.renderWaveforms();
	},
		
	renderWaveforms: function(){

		var $outputDisplay = $("#sequencer-display .output-display .waveform");
		this.renderWaveform($outputDisplay, this.model.get("values") || [0], "#0ff");
		$outputDisplay.parent().addClass("active");

		var $oscillationDisplay = $("#sequencer-display .oscillation-display .waveform");
		this.renderWaveform($oscillationDisplay, this.model.getOscillation() || [0], "#0aa");
		$oscillationDisplay.parent().addClass("active");

		var $rhythmDisplay = $("#sequencer-display .rhythm-display .waveform");
		$rhythmDisplay.parent().removeClass("active");

		var $pitchDisplay = $("#sequencer-display .pitch-display .waveform");
		$pitchDisplay.parent().removeClass("active");


		return this;
	},
	
	// control event handlers
	onChangeAmplitudeInput: function(e){
		this.model.set("amplitude", parseFloat(e.target.value));
	},
	onChangeFrequencyInput: function(e){
		this.model.set("frequency", parseFloat(e.target.value));
	},
	onChangeOffsetInput: function(e){
		this.model.set("offset", parseFloat(e.target.value));
	},


	serialize: function(){
		var ports = this.model.get("ports");
		return _.extend(this.model.toJSON(), {
			addInputId: ports.findWhere({type: "input", control: "add"}).id,
			multiplyInputId: ports.findWhere({type: "input", control: "multiply"}).id,
			outputId: ports.findWhere({type: "output"}).id
		});
	}
});

module.exports = View;