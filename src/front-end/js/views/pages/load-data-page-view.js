require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");

//abstract page class
var Page = AbstractPage.extend({
	row:0,
	col:0,
	keep:true,
	el: "#load-data-page",
	events: {
		"click #load-brain-data-button": "onClickLoadBrainData"
	},
	initialize: function(){
		AbstractPage.prototype.initialize.call(this);
	},
	fetch: function(params){
		var promise = new $.Deferred();
	
		this.render();

		this.once("afterRender", function(){
			promise.resolve();
		});

		return promise;
	},

	// RENDERING

	/*
	beforeRender: function(){

	},
	afterRender: function(){

	},

	*/


	// EVENT HANDLERS

	onClickLoadBrainData: function(){
		var $loadFile = this.$("#load-brain-data");
		$loadFile.on("change", this.loadData.bind(this));
		$loadFile[0].click();
	},
	loadData: function(e){
		var $loadFile = this.$("#load-brain-data");
		$loadFile.off();
		if ($loadFile[0].files.length > 0){
			this.model.loadBrainData($loadFile[0].files[0]);
			$loadFile.val([]);
		}
	},

	// TRANSITIONS
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