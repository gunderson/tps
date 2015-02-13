require("backbone");
require("backbone.layoutmanager");
var AbstractPage	= require("./Page-view");
var ConnectionsView = require("./pattern-editor/connections-view");
var MasterView		= require("./pattern-editor/components/master-view");
var FilterView		= require("./pattern-editor/components/filter-view");
var OscillatorView	= require("./pattern-editor/components/oscillator-view");
var UserPatternView	= require("./pattern-editor/components/user-pattern-view");
var SplitterView	= require("./pattern-editor/components/splitter-view");
var PatternModel	= require("../../models/sequencer/pattern");

//abstract page class
var Page = AbstractPage.extend({
	row:1,
	col:2,
	el: "#pattern-editor",
	views: {
	},
	events: {
		"click .add-filter-button"			: "onClickAddFilter",
		"click .add-oscillator-button"		: "onClickAddOscillator",
		"click .add-user-pattern-button"	: "onClickAddUserPattern",
		"click .add-splitter-button"		: "onClickAddSplitter",
	},
	initialize: function(options){

		// a default patternModel
		this.patternModel = new PatternModel();

		// set views
		this.masterView = new MasterView({
			model: this.patternModel.get("components").findWhere({"type": "master"})
		});
		this.connectionsView = new ConnectionsView();

		this.insertViews({
			"#connections": [this.connectionsView],
			"#components": [this.masterView]
		});

		// set listeners
		this.connectionsView.ListenTo(this.patternModel.get("components"), "draw-partial", this.connections.drawPartial);
		this.listenTo(this.patternModel.get("components"), "add", this.onAddComponent);
		this.listenTo(this.controller.model, "edit-pattern", this.onEditPatternEvent);
	},

	// RENDERING
	/*
	beforeRender: function(){
		console.log("pattern-editor::beforeRender", this.getViews().value())
	},
	afterRender: function(){
	},
	*/
	onResize: function(){
		var $connections = this.$("#connections");
		this.$("#connections").attr({
			width: $connections.width(),
			height: $connections.height()
		})
	},

	// EVENT HANDLERS


	onEditPatternEvent: function(patternModel){
		this.stopListening(this.patternModel.get("components"));
		this.patternModel = patternModel;
		this.listenTo(patternModel.get("components"), "add", this.onAddComponent);
		this.masterView.model = this.patternModel.get("components").findWhere({"type": "master"});
		// this.masterView.render();
	},
	onAddComponent: function(componentModel){
		function insertView(ViewClass, model){

			var view = new ViewClass({
				model: model
			});
			this.insertViews({
				"#components": view
			});
			view.render();
		}

		switch(componentModel.get("type")){
			case "filter":
				insertView.call(this, FilterView, componentModel);
				break;
			case "oscillator":
				insertView.call(this, OscillatorView, componentModel);
				break;
			case "user-pattern":
				insertView.call(this, UserPatternView, componentModel);
				break;
			case "splitter":
				insertView.call(this, SplitterView, componentModel);
				break;
		}
	},

	onClickAddFilter: function(){
		var model = this.patternModel.addFilter();
	},
	onClickAddOscillator: function(){
		var model = this.patternModel.addOscillator();
	},
	onClickAddUserPattern: function(){
		var model = this.patternModel.addUserPattern();
	},
	onClickAddSplitter: function(){
		var model = this.patternModel.addSplitter();
	},

	// TRANSITIONS
	transitionIn: function(){
		//TODO: Short circuit if no model is passed and send to the main sequencer page
		/*if(!this.model){
			this.__manager__.parent.router.navigate("/sequencer", {trigger: true});
			return;
		}*/
		requestAnimationFrame(this.onResize.bind(this));
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