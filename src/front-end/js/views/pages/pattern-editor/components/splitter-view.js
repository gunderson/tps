require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view");

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/splitter",
	initialize: function(options){
		console.log("splitter");
	},
	serialize: function(){
		var ports = this.model.get("ports");
		return {
			inputId: ports.findWhere({type: "input"}).id,
			outputAId: ports.findWhere({type: "output", control: "a"}).id,
			outputBId: ports.findWhere({type: "output", control: "b"}).id
		};
	}
});

module.exports = View;