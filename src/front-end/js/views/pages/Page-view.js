require("backbone");
require("backbone.layoutmanager");

var PAGE_TRANSITION_TIME = 1000;


//abstract page class
var Page = Backbone.Layout.extend({
	col:0,
	row: 0,
	currentRoute: "",
	page: null,
	views: {},
	fetch: function(){

		var promise = new $.Deferred();
		
		if (this.model && this.model.url){
			// this.once("afterRender", promise.resolve);
			this.model
				.fetch()
				.done(function(){
						this.render()
							.then(promise.resolve);
					}.bind(this)
				);
		} else if (!this.hasRendered) {
			this.render()
				.then(promise.resolve);
		} else {
			_.defer(function(){
				promise.resolve();
			});
		}

		return promise;
	},
	onRoute: function (route, params) {
        console.log('onRoute', route, params);

        var currentPage = this.page;
        var newPage = null;

        // only do this if new route is different from the last
        if (route !== null && route !== this.currentRoute ) {

        	// remove the old page
            $("html").removeClass(this.currentRoute + "-page");

            if (route){
                $("html").addClass(route + "-page");
	        	
	        	//determine new page
	        	newPage = this.views["#" + route];
            }

            //if the route is invalid, do nothing
        	if (!newPage) return;
        	newPage.fetch()
                .done(function(){
            		if (currentPage) { currentPage.transitionOut(newPage); }
            		newPage.transitionIn(currentPage);
            	});

        	this.page = newPage;
        } else if(route === null) {
        	console.log("====", currentPage);
        	currentPage.transitionOut();
        } else {
            // it's probably a sub-page
            // tell the current page to display the new info
            console.log('onRoute: currentRoute is the same as new route\n', route, params);
            currentPage.onRoute(params[0], params.slice(1));
        }
        this.currentRoute = route;
    },
    clearSubPage: function(){

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

		var endX = 0, endY = 0;

		//transition out to the right by default
		if (!next || this.col > next.col){
			endX = "100%";
		} else if (this.col < next.col){
			endX = "-100%";
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