require("backbone");
require("backbone.layoutmanager");
var PatternOverviewView = require("./pattern-overview-view");
var Theory = require("../../../music/Theory");

var SceneView = Backbone.Layout.extend({
	el: false,
	keep: true,
	template: "sequencer/scene",
	events: {
		"click": "setCurrentScene",
		"click .settings-button": "onClickSettingsButton",
		"click .remove-button": "onClickRemoveButton",
		"click .duplicate-button": "onClickDuplicateButton",
		"change .scene-id>.settings>label.key>select,.scene-id>.settings>label.mode>select ": "onChangeKeyUI",
		"change .scene-id>.settings>label.repeat>select": "onChangeRepeatUI",

	},
	initialize: function(options){
		this.listenTo(this.model, "pattern:add", this.onAddPattern);
		this.listenTo(this.model, "change:active", this.onChangeActive);
	},
	beforeRender: function(){
		// make a fresh slate
		this.getViews(".patterns").each(function(nestedView){
			nestedView.remove();
		});

		var patterns = this.model.get("patterns");
		patterns.each(function(pattern){
			this.onAddPattern(pattern);
		}.bind(this));
	},
	afterRender: function(){
		//select key in settings
		var length = this.model.get("length");
		this.$(".settings label.length option").each(function(i, el){
			if (parseInt(el.value, 10) === length){
				el.selected = true;
			}
		});

		//select key in settings
		var key = this.model.get("key");
		var root = key.charAt(0);
		this.$(".settings label.key option").each(function(i, el){
			if (el.value === root){
				el.selected = true;
			}
		});

		var mode = Theory.parseKey(key).mode;
		this.$(".settings label.mode option").each(function(i, el){
			if (el.value === mode){
				el.selected = true;
			}
		});
	},
	onChangeActive: function(model, value){
		if (!value){
			this.$(".sixteenth").removeClass("playing");
		}
		this.$el.toggleClass("active", value);
	},
	onAddPattern: function(patternModel){
		console.log("scene-view::onAddPattern");
		var patternView = new PatternOverviewView({
			model: patternModel
		});
		this.insertViews({
			".patterns": patternView
		});
		patternView.render();
	}, 
	onClickSettingsButton: function(){
		this.$(".scene-id .settings").toggle();
	},
	onClickRemoveButton: function(){
		this.model.destroy();
	},
	onClickDuplicateButton: function(){

	},
	setCurrentScene: function(){
		this.model.setCurrentScene();
	},
	onChangeKeyUI: function(e){
		var $settings = this.$(".settings");
		this.model.set(
			"key", 
			$settings.find("label.key>select").val() +
			$settings.find("label.mode>select").val()
		);
		console.log("SceneView::onChangeKeyUI", $settings.find("label.key>select").val() +
			$settings.find("label.mode>select").val());
	},
	onChangeKey: function(e){
		var $settings = this.$(".scene-id>.settings");
		var parsedKey = Theory.parseKey(this.model.get("key"));
		var root = parsedKey.root; 
		var mode = parsedKey.mode; 
		$settings.find("label.key>select").val(root);
		$settings.find("label.mode>select").val(mode);
		console.log("SceneView::onChangeKey", root + mode);
	},
	onChangeRepeatUI: function(e){
		var $settings = this.$(".settings");
		this.model.set(
			"repeat", 
			parseInt($settings.find("label.repeat>select").val(), 10)
		);
		console.log("SceneView::onChangeRepeatUI", 
			parseInt($settings.find("label.repeat>select").val(), 10));
	},
	onChangeRepeat: function(e){
		var $settings = this.$(".scene-id>.settings");
		var repeat = this.model.get("repeat"); 
		$settings.find("label.repeat>select").val(repeat);
		console.log("SceneView::onChangeRepeat", repeat);
	}

});

module.exports = SceneView;
