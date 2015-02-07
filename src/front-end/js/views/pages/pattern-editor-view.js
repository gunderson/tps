require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");
var MasterView = require("../sequencer/components/master-view");
var FilterView = require("../sequencer/components/filter-view");
var OscillatorView = require("../sequencer/components/oscillator-view");

//abstract page class
var Page = AbstractPage.extend({
	row:1,
	col:2,
	el: "#pattern-editor",
	events: {
		"click .add-filter-button": "onClickAddFilter",
		"click .add-oscillator-button": "onClickAddOscillator",
	},
	initialize: function(options){
		var masterView = new MasterView();
		this.insertViews({
			"#components": [masterView]
		});

		this.listenTo(this.controller.model, "edit-pattern", this.onEditPatternEvent);
	},

	// RENDERING

	
	beforeRender: function(){
		console.log("pattern-editor::beforeRender", this.getViews().value())
	},
	/*
	afterRender: function(){
	},
	*/


	// EVENT HANDLERS


	onEditPatternEvent: function(patternModel){
		this.patternModel = patternModel;
	},
	onAddFilter: function(model){
		var view = new FilterView({
			model: model
		});
		this.insertViews({
			"#components": view
		});
		view.render();
		//add model to patternModel

	},
	onAddOscillator: function(model){
		var view = new OscillatorView({
			model: model
		});
		this.insertViews({
			"#components": view
		});
		view.render();
	},

	onClickAddFilter: function(){
		// tell the controller to add a filter
		var model = this.patternModel.addFilter();
		this.onAddFilter(model);
	},
	onClickAddOscillator: function(){
		var model = this.patternModel.addOscillator();
		this.onAddOscillator(model);
	},

	// TRANSITIONS
	transitionIn: function(){
		//TODO: Short circuit if no model is passed and send to the main sequencer page
		/*if(!this.model){
			this.__manager__.parent.router.navigate("/sequencer", {trigger: true});
			return;
		}*/
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