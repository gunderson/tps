// Waveform-manager-view.js

require("backbone");
require("backbone.layoutManager");

var View = Backbone.Layout.extend({
	el: "#waveform-manager",
	keep: true,
	template: "/pattern-editor/waveform-manager-view",
	initialize: function(){

	}
});

module.exports = View;