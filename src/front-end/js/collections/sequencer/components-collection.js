require("backbone");

var Collection = Backbone.Collection.extend({
	initialize: function(){
	},
	destroyPort: function(port){
		this.remove(this.where(
			[
				{
					input: port
				},
				{
					output: port
				}
			]
		));
	}
});

module.exports = Collection;