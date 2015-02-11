require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view")

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/oscillator",
	initialize: function(options){
		console.log("oscillator")
	},
	serialize: function(){
		var ports = this.model.get("ports");
		return {
			addInputId: _.findWhere(ports, {type: "input", control: "add"}).id,
			multiplylInputId: _.findWhere(ports, {type: "input", control: "multiply"}).id,
			outputId: _.findWhere(ports, {type: "output"}).id
		}
	}
});

module.exports = View;