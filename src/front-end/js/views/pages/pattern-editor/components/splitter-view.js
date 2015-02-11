require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view")

var View = ComponentView.extend({
	el: false,
	keep: true,
	template: "pattern-editor/components/splitter",
	initialize: function(options){
		console.log("splitter")
	},
	serialize: function(){
		var ports = this.model.get("ports");
		return {
			intputId: _.findWhere(ports, {type: "input"}).id,
			outputAId: _.findWhere(ports, {type: "output", control: "a"}).id,
			outputBId: _.findWhere(ports, {type: "output", control: "b"}).id
		};
	}
});

module.exports = View;