require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view");

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/filter",
	initialize: function(options){
		console.log("filter");
	},
	serialize: function(){
		var ports = this.model.get("ports");
		return _.extend(this.model.toJSON, {
			lineInputId: ports.findWhere({type: "input", control: "line"}).id,
			levelInputId: ports.findWhere({type: "input", control: "level"}).id,
			outputId: ports.findWhere({type: "output"}).id,
		});
	}
});

module.exports = View;