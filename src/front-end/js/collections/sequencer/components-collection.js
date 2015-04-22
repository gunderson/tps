require("backbone");

var Collection = Backbone.Collection.extend({
	initialize: function(){
	},
	export: function(){
		return this.map(function(component){
			return component.export();
		});
	}
});

module.exports = Collection;