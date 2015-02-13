require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view")

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/filter",
	initialize: function(options){
		console.log("filter")
	},
	serialize: function(){
		var ports = this.model.get("ports");
		return {
			lineInputId: _.findWhere(ports, {type: "input", control: "line"}).id,
			levelInputId: _.findWhere(ports, {type: "input", control: "level"}).id,
			outputId: _.findWhere(ports, {type: "output"}).id,
		}
	}
});

module.exports = View;