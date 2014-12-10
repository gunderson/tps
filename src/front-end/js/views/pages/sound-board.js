require("backbone");
require("backbone.layoutmanager");
var _ = require("underscore");
var AbstractPage = require("./Page");
var SoundManager = require("../../controllers/Sound-manager")();
var instruments = require("../../music/Instruments");
var InstrumentView = require("./sound-board/instrument");




var instrumentViews = [];
_.each(instruments, function(instrumentData){
	var instrumentView = new InstrumentView({
		instrument:instrumentData,
		SoundManager: SoundManager
	});
	instrumentViews.push(instrumentView);
});

//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:5,
	el: "#sound-board",
	views: {
		"#instruments": instrumentViews
	},
	initialize: function(){
		var _this = this;
		AbstractPage.prototype.initialize.call(this);
		SoundManager.loading.done(function(){
			console.log("instruments loaded:",instruments);
		});


	},
	beforeRender: function(){
	},
	afterRender: function(){
		console.log("I'm rendered", this.el);
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