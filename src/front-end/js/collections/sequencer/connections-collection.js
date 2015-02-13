require("backbone");

var ConnectionsCollection = Backbone.Collection.extend({
	initialize: function(){
	},
	model: Backbone.Model.extend({
		defaults: {
			input: null,
			output: null
		},
		initialize: function(options){
			this.set(options);
		}
	})
});

module.exports = ConnectionsCollection;