require("backbone");
require("backbone.layoutmanager");
var ComponentView = require("./component-view");

var View = ComponentView.extend({
	// el: false,
	// keep: true,
	template: "pattern-editor/components/master",
	initialize: function(options){
		console.log("master");
	},
	beforeRender: function(){
		console.log("render master");
	},
	serialize: function(){
		var ports = this.model.get("ports");
		return {
			rhythmInputId: ports.findWhere({type: "input", control: "rhythm"}).id,
			pitchInputId: ports.findWhere({type: "input", control: "pitch"}).id
		};
	}
});

module.exports = View;