require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view")

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/user-pattern",
	initialize: function(options){
		console.log("user-pattern")
	},
	serialize: function(){
		var ports = this.model.get("ports");
		return {
			thresholdInputId: _.findWhere(ports, {type: "input", control: "threshold"}).id,
			outputId: _.findWhere(ports, {type: "output"}).id
		}
	}
});

module.exports = View;