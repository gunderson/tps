require('backbone');
require("backbone.layoutmanager");

var Partial = Backbone.Layout.extend({
	template: "partial",
	initialize: function(){

	},
	afterRender: function(){
		console.log("Render Partial", this.parent);
		
	},
	// id: "Temp Partial",
	serialize: function(){
		return { id: "temp partial"};
	}
});

module.exports = Partial;