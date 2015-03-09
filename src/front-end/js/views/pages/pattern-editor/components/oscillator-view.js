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
		this.$controls.find(".amplitude-input input").on("input change blur", this.onChangeAmplitudeInput.bind(this));
		this.$controls.find(".frequency-input input").on("input change blur", this.onChangeFrequencyInput.bind(this));
		this.$controls.find(".offset-input    input").on("input change blur", this.onChangeOffsetInput.bind(this)   );
	},
	clearControlListeners: function(){
		this.$controls.find(".amplitude-input input").off("input change blur");
		this.$controls.find(".frequency-input input").off("input change blur");
		this.$controls.find(".offset-input    input").off("input change blur");
	},
	afterRender: function(){
		ComponentView.prototype.afterRender.call(this);
	},
	onChange: function(){
		this.renderWaveforms();
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