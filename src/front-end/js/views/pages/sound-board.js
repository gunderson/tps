require("backbone");
require("backbone.layoutmanager");
var _ = require("underscore");
var AbstractPage = require("./Page");
var SoundManager = require("../../controllers/Sound-manager")();
var instruments = require("../../music/Instruments");
var InstrumentView = require("./sound-board/Instrument");


//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:5,
	el: "#sound-board",
	initialize: function(){
		AbstractPage.prototype.initialize.call(this);
		SoundManager.loading.done(function(){
			console.log(instruments);
		});

		var instrumentViews = [];
		_.each(instruments, function(instrumentData){
			var instrumentView = new InstrumentView(instrumentData);
			instrumentViews.push(instrumentView);
		});
		this.insertViews({"#instruments": instrumentViews});
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