"use strict";

require("backbone");
require("backbone.layoutmanager");
var _ = require("underscore");

//-------------------------------------------------------------
// Top Level Models

var SoundcloudPlayerModel = require("./models/soundcloud-player-model");

//-------------------------------------------------------------
// Controllers


// Instances

var router         = require("./controllers/router");

//-------------------------------------------------------------
// Top level Views

var AbstractPage   = require("./views/pages/Page-view");
var MainMenu       = require("./views/ui/main-menu-view");
var HomePage       = require("./views/pages/home-view");
var SoundCloudPage = require("./views/pages/soundcloud-view");
var FilePlayerPage = require("./views/pages/file-player-page-view");
var MicrophonePage = require("./views/pages/microphone-page-view");



// Instances

var pages = {
    "#home"        : new HomePage({route: "/"}),
    "#soundcloud"  : new SoundCloudPage({model: new SoundcloudPlayerModel(), route: "/soundcloud"}),
    "#file-player" : new FilePlayerPage({route: "/file-player"}),
    "#microphone"  : new MicrophonePage({route: "/microphone"}),
};

var overlays = {
	//error messages
};

var ui = {
    "#main-menu"  : new MainMenu()
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
            if (v.setAppController){
                v.setAppController(_this.controller);
            }
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
