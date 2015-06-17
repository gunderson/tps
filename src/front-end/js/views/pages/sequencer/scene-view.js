require("backbone");
require("backbone.layoutmanager");
var PatternOverviewView = require("./pattern-overview-view");
var Theory = require("../../../music/Theory");

var SceneView = Backbone.Layout.extend({
	el: false,
	keep: true,
	template: "sequencer/scene",
	events: {
		"click .scene-id": "setCurrentScene",
		"click .settings-button": "onClickSettingsButton",
		"click .remove-button": "onClickRemoveButton",
		"click .duplicate-button": "onClickDuplicateButton",
		"mousedown .scene-id": "onMouseDown",
		"mousedown select": "cancelDrag",
		"change .scene-id>.settings>label.key>select,.scene-id>.settings>label.mode>select ": "onChangeKeyUI",
		"change .scene-id>.settings>label.repeat>select": "onChangeRepeatUI",

	},
	initialize: function(options){
		this.listenTo(this.model, "pattern:add", this.onAddPattern);
		this.listenTo(this.model, "change:active", this.onChangeActive);
		this.listenTo(this.model, "change:sceneId", this.render);
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
		var repeat = this.model.get("repeat");
		this.$(".settings label.repeat option").each(function(i, el){
			if (parseInt(el.value, 10) === repeat){
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

	dragging: false,
	dragStartX: 0,
	dragStartY: 0,
	minDragDist: 4,
	dragDist: 0,
	onMouseDown: function(e){
		this.dragStartX = e.pageX;
		this.dragStartY = e.pageY;
		this.dragging = true;
		$(window)
			.on("mousemove.drag-check", this.considerDrag.bind(this))
			.on("mouseup.drag-check mouseleave.drag-check", this.cancelDrag.bind(this));
		console.log("SceneView::onMouseDown");
	},
	considerDrag: function(e){
		e.preventDefault();
		console.log("SceneView::considerDrag");
		var dx = e.pageX - this.dragStartX;
		var dy = e.pageY - this.dragStartY;
		var dist = Math.sqrt((dx*dx)+(dy*dy));
		if (this.minDragDist < dist){
			this.trigger("begin-drag-scene", {
				scene: this, 
				event: e, 
				offset: {
					x: this.dragStartX, 
					y: this.dragStartY
				}
			});
			this.cancelDrag();
		}
	},
	cancelDrag: function(){
		console.log("SceneView::cancelDrag");
		this.dragging = false;
		$(window).off(".drag-check");
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
		this.model.triggerDuplicate();
	},
	setCurrentScene: function(){
		this.model.setNextScene(this);
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
