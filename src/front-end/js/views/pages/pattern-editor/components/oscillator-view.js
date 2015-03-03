require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view");

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/oscillator",
	initialize: function(options){
		console.log("oscillator");
	},
	serialize: function(){
		var ports = this.model.get("ports");
		return {
			addInputId: ports.findWhere({type: "input", control: "add"}).id,
			multiplylInputId: ports.findWhere({type: "input", control: "multiply"}).id,
			outputId: ports.findWhere({type: "output"}).id
		};
	}
});

module.exports = View;