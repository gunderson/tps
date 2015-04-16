require("backbone");
require("backbone.layoutmanager");
var _ = require("underscore");

//-------------------------------------------------------------
// Top Level Models

var SoundcloudModel        = require("./models/soundcloud-player-model");
var SequencerModel         = require("./models/sequencer/sequencer");

//-------------------------------------------------------------
// Controllers

var Sequencer              = require("./controllers/sequencer/sequencer");

// Instances

var connectionsCollection  = new (require("./collections/sequencer/connections-collection"))();
var router                 = require("./controllers/router");
var sequencer              = new Sequencer({model:new SequencerModel()});
sequencer.model.controller = sequencer;

//-------------------------------------------------------------
// Top level Views

var AbstractPage           = require("./views/pages/Page-view");
var MainMenu               = require("./views/ui/main-menu-view");
var HomePage               = require("./views/pages/home-view");
var AboutPage              = require("./views/pages/about-view");
var PatternEditorPage      = require("./views/pages/pattern-editor-view");
var SequencerPage          = require("./views/pages/sequencer-view");
var SoundcloudPage         = require("./views/pages/soundcloud-view");
var SoundBoardPage         = require("./views/pages/sound-board-view");

// Instances

var pages = {
    "#home"           : new HomePage({route: "/"}),
    "#about"          : new AboutPage({route: "/about"}),
    // "#soundcloud"     : new SoundcloudPage({model: new SoundcloudModel(), route: "/soundcloud"}),
    "#pattern-editor" : new PatternEditorPage({controller: sequencer, route: "/pattern-editor", connectionsCollection: connectionsCollection}),
    "#sound-board"    : new SoundBoardPage({controller: sequencer, route: "/sound-board"}),
    "#sequencer"      : new SequencerPage({controller: sequencer, route: "/sequencer"}),
};

var overlays = {
	//error messages
};

var ui = {
    "#main-menu"      : new MainMenu()
};


//-------------------------------------------------------------
// Application

module.exports = AbstractPage.extend({

    controller: _.extend({}, Backbone.Events),
    router: router,
    el: "#main",
    views: _.extend({}, ui, pages, overlays),
    initialize: function (options) {
        var _this = this;
        this.copy = options.copy;
        _.each(this.pages, function(p){
            p.copy = _this.copy;
        });
        // assign controller to each view
        _.each(this.views, function(v){
    		v.appController = _this.controller;
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
    }
});
