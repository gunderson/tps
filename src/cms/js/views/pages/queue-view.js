require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");
var QueueItemView = require("./queue/queue-item-view");

//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:0,
	el: "#queue",

	// RENDERING

	beforeRender: function(){
		var _this = this;
		var views = [];
		this.collection.each(function(model, i, collection){
			views.push(new QueueItemView({model:model, copy: _this.copy}));
		});
		views.sort(function(a,b){
			return a.model.get("order") - b.model.get("order");
		});
		this.insertViews({".queue-items":views});
	},
	afterRender: function(){
		var onReorder = this.onReorder.bind(this);
		//make queue items sortable
		this.$(".queue-items").sortable({
			containerSelector: 'table',
			itemPath: '> tbody',
			itemSelector: 'tr.queue-item',
			placeholder: '<tr class="queue-placeholder"><td colspan="4"/></tr>',
			onDrop: function(){
				onReorder();
			}
		});
	},
	
	// EVENT HANDLERS

	onClickRefresh: function(){

	},

	onReorder: function(){
		var els = this.$(".queue-item")
			.map(function(){
				return this; 
			})
			.get();


		var views = this.getViews(".queue-items").each(function(view, i){
			view.updateOrder(
				els.indexOf(view.el)
			);
		});

		this.collection.save();
	},

	// TRANSITIONS

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