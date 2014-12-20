// require("jquery.velocity");
require("backbone");
require("backbone.layoutmanager");
var _ = require("underscore");

var MainMenu = require("./views/ui/main-menu-view");
var HomePage = require("./views/pages/home-view");
var AboutPage = require("./views/pages/about-view");
var SequencerPage = require("./views/pages/sequencer-view");
var SoundcloudPage = require("./views/pages/soundcloud-view");
var SoundcloudModel = require("./models/soundcloud-player-model");
var SoundBoardPage = require("./views/pages/sound-board-view");

var Sequencer = require("./controllers/sequencer/sequencer");
var SequencerModel = require("./models/sequencer/sequencer");
var sequencer = new Sequencer({model:new SequencerModel()});
sequencer.model.controller = sequencer;

var sequencerStatus = sequencer.getStatus();

var pages = {
	"#home"	 : new HomePage({route: "/"}),
    "#about" : new AboutPage({route: "/about"}),
    "#sequencer" : new SequencerPage({controller: sequencer, route: "/sequencer"}),
    "#sound-board" : new SoundBoardPage({controller: sequencer, route: "/sound-board"}),
	"#soundcloud" : new SoundcloudPage({model: new SoundcloudModel(), route: "/soundcloud"}),
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

    initialize: function (options) {
        var _this = this;
        this.copy = options.copy;
        _.each(this.pages, function(p){
            p.copy = _this.copy;
        });
        // assign controller to each view
        _.each(this.views, function(v){
    		v.controller = _this.controller;
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

            $("html")
                .removeClass(this.currentRoute + "-page")
                .addClass(route + "-page");

        	//determine new page
        	var currentPage = this.page;
        	var newPage = this.views["#" + route];
        	if (!newPage) return;

        	newPage.fetch()
                .done(function(){
            		currentPage && currentPage.transitionOut(newPage);
            		newPage.transitionIn(currentPage);
            	});

        	this.page = newPage;
        }
        this.currentRoute = route;
    }

});
