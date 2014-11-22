require("backbone");
require("backbone.layoutmanager");

var PAGE_TRANSITION_TIME = 1000;


//abstract page class
var Page = Backbone.Layout.extend({
	col:0,
	row: 0,

	fetch: function(){
		if (this.model){
			this.model
				.fetch()
				.done(this.render);
		} else {
			this.render();
		}
	},
	transitionIn: function(prev){
		var _this = this;
		this.$el.addClass('active');
		
		if (!prev){
			console.log("No Previous Page");
			this.$el.show();
			this.trigger("transitionEnd");
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
					_this.trigger("transitionEnd");
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
					_this.trigger("transitionEnd");
				}
			});
		return this;
	}
});

module.exports = Page;