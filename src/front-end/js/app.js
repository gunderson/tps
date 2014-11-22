// require("jquery.velocity");
require("backbone");
require("backbone.layoutmanager");
var _ = require("underscore");

var MainMenu = require("./views/ui/main-menu");
var HomePage = require("./views/pages/home");
var AboutPage = require("./views/pages/about");
var ContentsPage = require("./views/pages/contents");


var pages = {
	"#home"	 : new HomePage({route: "/"}),
    "#about" : new AboutPage({route: "/about"}),
	"#contents" : new ContentsPage({route: "/contents"}),
};

var overlays = {
	//error messages
};


module.exports = Backbone.Layout.extend({

    controller: _.extend({}, Backbone.Events),
    router: require("./controllers/router"),
    el: "#main",
    views: _.extend({
		"#main-menu" : new MainMenu(),
		// "#orientation-error" : new ErrorView()
    }, pages, overlays),

    initialize: function () {
        console.log('app.initialize');

        // assign controller to each view
        _.each(this.views, function(v){
    		v.controller = this.controller;
    	});

        $(window).on('orientationchange', this.onOrientationChange);
        this.onOrientationChange();

        this.router.app = this;
        this.router.pages = pages;
        this.listenTo(this.router, 'route', this.onRoute);
        Backbone.history.start();

    },


    onOrientationChange: function (e) {
        // alert('onOrientationChange', window.orientation);
        if (Math.abs(window.orientation) == 90) {
        	//don't create and destroy views, populate with correct data, show and hide them

            // this.error = new ErrorView({type: 'orientation'});

        } else {
            //destroy error view if it exists
            if (this.error) {
                this.error.transitionOut();
            }
        }
    },

    currentRoute: '',
    onRoute: function (route, params) {
        //console.log('onRoute', route, params);
        params.app = this;
        // only do this if new route is different from the last
        if (this.currentRoute != route) {
        	//determine new page
        	var currentPage = this.page;
        	var newPage = this.views["#" + route];
        	if (!newPage) return;

        	newPage.fetch();
        	newPage.once("afterRender", function(){
        		currentPage && currentPage.transitionOut(newPage);
        		newPage.transitionIn(currentPage);
        	});

        	this.page = newPage;
        }
        this.currentRoute = route;
    }

});