require("backbone");
require("backbone.layoutmanager");
var AbstractPage	= require("./Page-view");
var ConnectionsView = require("./pattern-editor/connections-view");
var MasterView		= require("./pattern-editor/components/master-view");
var FilterView		= require("./pattern-editor/components/filter-view");
var OscillatorView	= require("./pattern-editor/components/oscillator-view");
var UserPatternView	= require("./pattern-editor/components/user-pattern-view");
var SplitterView	= require("./pattern-editor/components/splitter-view");
var OutputNotesView	= require("./pattern-editor/output-notes-view");

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

		this.connectionsCollection = options.connectionsCollection;
		this.controller = options.controller;

		// set views
		this.masterView = new MasterView({
		});
		this.connectionsView = new ConnectionsView({ collection: this.connectionsCollection });
		this.ouptutNotesView = new OutputNotesView();

		// set listeners
		this.listenTo(this.controller.model, "edit-pattern", this.onEditPatternEvent);
	},
	fetch: function(params){
		var promise = new $.Deferred();
		
		if (this.patternModel){
			this.removePatternModelListeners();
		}

		this.patternModel = this.controller.model
			.get("scenes").findWhere({ sceneId: parseInt(params[0]) })
			.get("patterns").findWhere({ trackId: parseInt(params[1]) });
		this.setPatternModelListeners();

		this.ouptutNotesView.setModel(this.patternModel);

		this.connectionsCollection = this.patternModel.get("connections");
		this.connectionsView.setConnectionCollection(this.patternModel.get("connections"));
		this.connectionsView.setComponentCollection(this.patternModel.get("components"));

		this.masterView.model = this.patternModel.get("components").findWhere({"type": "master"});

		this.render();

		_.defer(function(){
			promise.resolve();
		});

		return promise;
	},
	setPatternModelListeners: function(){
		var components = this.patternModel.get("components");
		this.listenTo(components, "connection-request", 		this.beginConnection);
		this.listenTo(components, "cancel-connection-request", 	this.cancelConnection);
		this.listenTo(components, "activate-component", 		this.onActivateComponent);
		this.listenTo(components, "connection-response", 		this.completeConnection);
		this.listenTo(components, "remove", 					this.onRemoveComponent);
		this.listenTo(components, "add", 						this.onAddComponent);
		this.listenTo(this.patternModel, "change:values",		this.onPatternChange);
		this.listenTo(this.patternModel, "change:threshold",	this.onThresholdChange);

	},
	removePatternModelListeners: function(){
		if (this.patternModel) {
			this.stopListening(this.patternModel.get("components"));
			this.stopListening(this.patternModel);
		}
	},


	// RENDERING
	beforeRender: function(){
		
		this.getViews("#components").each(function(nestedView) {
			nestedView.remove();
		});

		this.setViews({
			"": this.connectionsView,
			"#output-notes": this.ouptutNotesView
		});

		this.patternModel.get("components").each(
			function(componentModel){
				this.onAddComponent(componentModel, true);
			}.bind(this)
		);
	},
	afterRender: function(){
		this.$(".rhythm-display .threshold").css({
			top: ((1 - this.patternModel.get("threshold")) * 100) + "%"
		});
		this.onResize();
	},
	onResize: function(){
	},

	// EVENT HANDLERS
	onThresholdChange: function(model, val){
		this.$(".threshold").css({
			top: ((1-val) * 100) + "%"
		});
		this.onPatternChange();
	},
	onPatternChange: function(){
		this.ouptutNotesView.render();
	},
	onActivateComponent: function($controls){
		var $controlHolder = this.$("#component-control-holder");
		var $currentControls = $controlHolder.find(".component-controls");
		if ($currentControls) $currentControls.detach();
		$controlHolder.append($controls);
	},
	onEditPatternEvent: function(patternModel){
		this.removePatternModelListeners();
		this.patternModel = patternModel;
		this.setPatternModelListeners();
	},
	onAddComponent: function(componentModel, deferRender){
		function insertView(ViewClass, model){
			var view = new ViewClass({
				model: model
			});
			this.insertViews({
				"#components": view
			});


			if (deferRender !== true) view.render();
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
			case "master":
				insertView.call(this, MasterView, componentModel);
				break;
		}
	},
	onRemoveComponent: function(componentModel){
		var view = this.getViews("#components").findWhere({model: componentModel}).value();
		view.remove();
	},

	beginConnection: function(data){
		// data = { $target: $(element) }
		this.connectionsView.beginConnection(data);
	},

	cancelConnection: function(){
		this.connectionsView.cancelConnection();
	},

	completeConnection: function(){
		this.connectionsView.cancelConnection();
	},

	clearConnection: function(data){

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
		this.connectionsView.updateAllConnections();
	},
	transitionOut: function(){
		AbstractPage.prototype.transitionOut.apply(this, arguments);
	},
	transitionOutComplete: function(){

	}
});

module.exports = Page;