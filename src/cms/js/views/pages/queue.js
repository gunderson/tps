require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page");
var QueueItemView = require("./queue/queue-item");

//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:0,
	el: "#queue",
	beforeRender: function(){
		var _this = this;
		var views = [];
		this.collection.each(function(model, i, collection){
			views.push(new QueueItemView({model:model, copy: _this.copy}));
		});
		this.insertViews({".content":views});
	},
	transitionIn: function(){
		AbstractPage.prototype.transitionIn.apply(this, arguments);
	},
	transitionInComplete: function(){
	
	},
	transitionOut: function(){
		AbstractPage.prototype.transitionOut.apply(this, arguments);
	},
	transitionOutComplete: function(){

	}
});

module.exports = Page;