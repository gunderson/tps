require("backbone");
require("backbone.layoutmanager");
var OutputNotesView = require("../pattern-editor/output-notes-view");
var Theory = require("../../../music/Theory");
window.Theory = Theory;

var PatternOverviewView = Backbone.Layout.extend({
	el: false,
	keep: true,
	template: "sequencer/pattern-overview",
	events: {
		"click": "onClickPattern",
		"click .settings-button": "onClickSettings",
		"change .key>select, .mode>select": "onChangeKeyUI",
		"change .length>select": "onChangeLengthUI",
		"click .copy-button": "onClickCopy",
		"click .copy-to-toggle-button": "onToggleCopy",
		"click .execute-copy-button": "onClickExecuteCopy",
	},

	// Setup && Rendering ---------------------------------------------------------

	initialize: function(options){
		this.outputNotesView = new OutputNotesView();
		this.outputNotesView.setModel(this.model);
		this.listenTo(this.model, "16th", this.on16th);
		this.listenTo(this.model, "change:key", this.onChangeKey);
		this.listenTo(this.model, "change:length", this.onChangeLength);
		this.listenTo(this.model, "change:copyRequest", this.onChangeCopyRequest);
		this.listenTo(this.model, "change:executeCopy", this.onChangeExecuteCopy);
	},
	beforeRender: function(){
		this.setViews({
			".pattern-graph": this.outputNotesView
		});
	},
	afterRender: function(){
		//select key in settings
		var parsedKey = Theory.parseKey(this.model.get("key"));
		this.$(".settings label.key select").val(parsedKey.root);
		this.$(".settings label.mode select").val(parsedKey.mode);
		this.$(".settings label.length select").val(this.model.get("length"));
	},
	serialize: function(){
		return _.extend(this.model.toJSON(), {
			trackId: this.model.get("track").get("trackId"),
			sceneId: this.model.get("scene").get("sceneId")
		});
	},
	
	// Model attribute handlers ---------------------------------------------------------

	on16th: function(patternStatus){
		this.$(".sixteenth")
			.removeClass("playing")
				.eq(patternStatus.current16th)
				.addClass("playing");
	},
	onChangeCopyRequest: function(){

	},
	onChangeExecuteCopy: function(model, value){
		this.$el.toggleClass("copy-on", value);
	},
	onChangeKey: function(obj, val){
		var $settings = this.$(".settings");
		var parsed = Theory.parseKey(val);
		var root = parsed.root; 
		var mode = parsed.mode; 
		$settings.find("label.key>select").val(root);
		$settings.find("label.mode>select").val(mode);
		this.outputNotesView.render();	
	},
	onChangeLength: function(){
		this.outputNotesView.render();
	},

	// UI handlers ---------------------------------------------------------

	onClickSettings: function(e){
		e.stopImmediatePropagation();
		this.$(".settings").toggle();
	},
	onClickCopy: function(e){
		e.stopImmediatePropagation(e);
		this.model.triggerCopyRequest();
		this.$el.removeClass("copy-from");
		this.$el.addClass("copy-from");
	},
	onClickExecuteCopy: function(e){
		e.stopImmediatePropagation();
		this.model.triggerExecuteCopy();
		this.$el.removeClass("copy-from");
	},
	onToggleCopy: function(e){
		e.stopImmediatePropagation();
		this.model.set("executeCopy", !this.model.get("executeCopy"));
	},
	onClickPattern: function(e){
		this.model.trigger("edit-pattern", this.model);
	},
	onChangeKeyUI: function(e){
		var $settings = this.$(".settings");
		this.model.set(
			"key", 
			$settings.find("label.key select").val() +
			$settings.find("label.mode select").val()
		);
	},
	onChangeLengthUI: function(e){
		console.log("PatternOverviewView::onChangeLengthUI", e.target.value);
		this.model.set("length", parseInt(e.target.value));
	}
});

module.exports = PatternOverviewView;