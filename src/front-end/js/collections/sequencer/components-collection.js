require("backbone");

var Collection = Backbone.Collection.extend({
	initialize: function(){
	},
	export: function(){
		return this.map(function(component){
			return component.export();
		});
	},
	import: function(){
		// all componenets must be set up prior to import
		this.each(function(component){
			component.setupCollection();
		});
		this.each(function(component){
			component.import();
		});
	}
});

module.exports = Collection;