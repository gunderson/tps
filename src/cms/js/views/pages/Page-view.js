require("backbone");
require("backbone.layoutmanager");

var PAGE_TRANSITION_TIME = 1000;


//abstract page class
var Page = Backbone.Layout.extend({
	col:0,
	row: 0,
	initialize: function(options){
		this.copy = options.copy;
	},
	fetch: function(){
		var promise = new $.Deferred();
		var _this = this;
		
		if (this.model){
			this.once("afterRender", promise.resolve);
			this.model
				.fetch()
				.done(_this.render);
		} else if (this.collection){
			this.once("afterRender", promise.resolve);
			this.collection
				.fetch()
				.done(function(){
					console.log("fetched collection")
					_this.render();
				});
		} else if (!this.hasRendered) {
			this.once("afterRender", promise.resolve);
			this.render();
		} else {
			_.defer(function(){
				promise.resolve();
			});
		}

		return promise;
	},
	transitionIn: function(prev){
		var _this = this;
		this.$el.addClass('active');

		if (!prev){
			console.log("No Previous Page");
			this.$el.show();
			this.trigger("transitionInComplete");
			return this;
		}

		
		var startX = 0,startY = 0;

		if (this.col < prev.col){
			startX = "-100%";
		} else if (this.col > prev.col){
			startX = "100%";
		} else if (this.row < prev.row){
			startY = "100%";
		} else if (this.row > prev.row){
			startY = "-100%";
		}
		
		this.$el
			.velocity("stop")
			// add in initial position with duration 0 so the first time through velocity catches
			.velocity({
				translateX: startX,
				translateY: startY
			}, {
				duration:0
			})
			.velocity({
				translateX: 0,
				translateY: 0
			},{
				display:"block",
				duration: PAGE_TRANSITION_TIME,
				complete: function(){
					_this.trigger("transitionInComplete");
				}
			});
		return this;
	},
	transitionOut: function(next){
		var _this = this;
		this.$el.removeClass('active');

		var endX = 0,endY = 0;

		if (this.col < next.col){
			endX = "-100%";
		} else if (this.col > next.col){
			endX = "100%";
		} else if (this.row < next.row){
			endY = "100%";
		} else if (this.row > next.row){
			endY = "-100%";
		}

		this.$el
			.velocity("stop")
			// add in initial position with duration 0 so the first time through velocity catches
			.velocity({
				translateX: 0,
				translateY: 0
			}, {
				duration:0
			})
			.velocity({
				translateX: endX,
				translateY: endY
			},{
				display:"none",
				duration: PAGE_TRANSITION_TIME,
				complete: function(){
					_this.trigger("transitionOutComplete");
				}
			});
		return this;
	},

	//sequencer specific implementation

});

module.exports = Page;