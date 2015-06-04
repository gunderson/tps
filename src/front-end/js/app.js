require("backbone");
require("backbone.layoutmanager");
var _ = require("underscore");

//-------------------------------------------------------------
// Top Level Models

var SequencerModel         = require("./models/sequencer/sequencer");
var LoadDataPageModel      = require("./models/load-data-page-model");

//-------------------------------------------------------------
// Controllers

var Sequencer              = require("./controllers/sequencer/sequencer");

// Instances

var router                 = require("./controllers/router");
var sequencer              = new Sequencer({model:new SequencerModel()});
sequencer.model.setController(sequencer);

//-------------------------------------------------------------
// Top level Views

var AbstractPage           = require("./views/pages/Page-view");
var MainMenu               = require("./views/ui/main-menu-view");
var LoadDataPage           = require("./views/pages/load-data-page-view");
var PatternEditorPage      = require("./views/pages/pattern-editor-view");
var SequencerPage          = require("./views/pages/sequencer-view");
var SoundBoardPage         = require("./views/pages/sound-board-view");

// Instances

var pages = {
    "#load-data-page"   : new LoadDataPage({model: new LoadDataPageModel(), route: "/"}),
    "#pattern-editor"   : new PatternEditorPage({controller: sequencer, route: "/pattern-editor"}),
    "#sound-board"      : new SoundBoardPage({controller: sequencer, route: "/sound-board"}),
    "#sequencer"        : new SequencerPage({controller: sequencer, model: sequencer.model, route: "/sequencer"}),
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
