require("backbone");
require("backbone.layoutmanager");

var Instrument = new Backbone.Layout.extend({
	template:"sound-board/instrument",
	initialize: function(options){
		this.instrument = options.instrument;
	},
	serialize: function(){
		return {
			instrument: this.instrument
		};
	}
});

module.exports = Instrument;