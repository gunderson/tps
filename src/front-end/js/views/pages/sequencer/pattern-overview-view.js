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
	},
	initialize: function(options){
		this.outputNotesView = new OutputNotesView();
		this.outputNotesView.setModel(this.model);
		this.listenTo(this.model, "16th", this.on16th);
		this.listenTo(this.model, "change:key", this.onChangeKey);
		this.listenTo(this.model, "change:length", this.onChangeLength);
		this.listenTo(this.model, "copy-request", this.onChangeLength);
		this.listenTo(this.model, "change:length", this.onChangeLength);

	},
	beforeRender: function(){
		this.setViews({
			".pattern-graph": this.outputNotesView
		});
	},
	afterRender: function(){
		//select key in settings
		var parsedKey = Theory.parseKey(this.model.get("key"));
		this.$(".settings label.mode selct").val(parsedKey.root);

		this.$(".settings label.mode selct").val(parsedKey.mode);

		this.$(".settings label.length selct").val(this.model.get("length"));
	},
	on16th: function(patternStatus){
		// console.log("patternStatus", patternStatus)
		this.$(".sixteenth")
			.removeClass("playing")
				.eq(patternStatus.current16th)
				.addClass("playing");
	},
	onClickSettings: function(e){
		e.stopImmediatePropagation();
		this.$(".settings").toggle();
	},
	onClickCopy: function(e){
		e.stopImmediatePropagation();
		this.model.triggerCopyRequest();
		this.$el.addClass("copy-from");
	},
	onClickPaste: function(){
		this.$el.addClass("copy-to");
	},
	onCopyComplete: function(){
		this.removeClass("copy-from copy-to");
	},
	onClickPattern: function(e){
		this.model.trigger("edit-pattern", this.model);
	},
	serialize: function(){
		// console.log("PatternOverviewView::serialize", this.model.get("track"));
		return _.extend(this.model.toJSON(), {
			trackId: this.model.get("track").get("trackId"),
			sceneId: this.model.get("scene").get("sceneId")
		});
	},
	onChangeKeyUI: function(e){
		var $settings = this.$(".settings");
		this.model.set(
			"key", 
			$settings.find("label.key select").val() +
			$settings.find("label.module select").val()
		);
	},
	onChangeKey: function(obj, val){
		var $settings = this.$(".settings");
		var root = Theory.parseKey(val).root; 
		var mode = Theory.parseKey(val).mode; 
		$settings.find("label.key>select").val(root);
		$settings.find("label.mode>select").val(mode);
		console.log("PatternOverviewView::onChangeKey", val, root , mode);
		this.outputNotesView.render();	
	},
	onChangeLengthUI: function(e){
		console.log("PatternOverviewView::onChangeLengthUI", e.target.value);
		this.model.set("length", parseInt(e.target.value));
	},
	onChangeLength: function(){
		console.log("PatternOverviewView::onChangeLength", this.model.get("length"));
		this.outputNotesView.render();
	}
});

module.exports = PatternOverviewView;