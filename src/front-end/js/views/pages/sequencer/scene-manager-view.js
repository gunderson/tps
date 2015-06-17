require("backbone");
require("backbone.layoutmanager");
var SceneView = require("./scene-view");

var SceneManager = Backbone.Layout.extend({
	keep:false,
	el:"#scene-manager",
	events: {
		"click #add-new-scene-button": "onClickAddNewSceneButton"
	},
	initialize: function(options){
		this.$ph = $("<div class='scene-placeholder scene' />");
		this.trackCollection = options.trackCollection;
		this.sceneCollection = options.sceneCollection;
		this.listenTo(this.sceneCollection, "add", this.onAddScene);
		this.listenTo(this.trackCollection, "add", this.onAddTrack);
		this.listenTo(this.sceneCollection, "reset", this.render);
		this.listenTo(this.trackCollection, "reset", this.render);
	},
	beforeRender: function(){
		console.log("Scene-manager-view::beforeRender", this.sceneCollection.length);
		this.getViews(".scenes").each(function(nestedView) {
			nestedView.remove();
		});
		_.each(this.sceneCollection.sortBy("sceneId"),function(sceneModel){
			this.onAddScene(sceneModel,this.sceneCollection);
		}.bind(this));
	},

	//-----------------------------------------------------
	// Scene reordering

	$dragSceneView: null,
	dragStartOffsetY: 0,
	dragStartOffset: null,
	onBeginDragScene: function(data){
		console.log("SceneManagerView::onBeginDragScene")
		event.preventDefault();
		this.dragSceneView = data.scene;
		this.$dragSceneView = data.scene.$el;
		// note offsets
		this.dragStartOffset = this.$dragSceneView.offset();
		this.dragStartOffsetY = data.event.pageY - this.dragStartOffset.top;
		// insert placeholder
		this.$dragSceneView
			.addClass("dragging")
			.after(this.$ph)
			.css({
				"top": data.event.pageY - this.dragStartOffsetY,
				"left": this.dragStartOffset.left
			})
			.appendTo(this.$(".drag-holder"));
		// add view to drag layer
		this.$el.addClass("dragging");
		// set listeners
		$(window).on("mousemove.sceneDrag", this.onDragSceneMove.bind(this));
		$(window).on("mouseup.sceneDrag", this.onDragSceneDropIn.bind(this));
		// $(window).on("mouseleave.sceneDrag", this.onDragSceneDropOut.bind(this));
	},
	onDragSceneMove: function(e){
		console.log("SceneManagerView::onDragSceneMove");
		e.preventDefault();
		// move view to mouse position + starting offsets
		var sceneView = this.dragSceneView;
		sceneView.$el.css({
			"top": e.pageY - this.dragStartOffsetY
		});
		// find closest sibling scene by position().top
		var $scenes = this.$(".scene");
		var offsetY = sceneView.$el.offset().top;
		var smallestOffset = window.innerHeight;
		var _this = this;
		$scenes.each(function(index, scene){
			var $scene = $(this);
			//exclude the placeholder
			if ($scene[0] == _this.$ph[0] || $scene[0] == sceneView.el) return;

			var offsetY2 = $scene.offset().top;
			var dist = Math.abs(offsetY - offsetY2);

			console.log("SceneManagerView::onDragSceneMove", dist, offsetY2);

			if( //it's smaller
				(dist < smallestOffset) &&
				// it's on stage
				(offsetY2 + $scene.height() > 0 && offsetY2 < window.innerHeight)){
				smallestOffset = dist;
				// move placeholder to that spot
				$scene.after(_this.$ph);
			}
		});


	},
	onDragSceneDropIn: function(e){
		console.log("SceneManagerView::onDragSceneDropIn");
		this.$el.removeClass("dragging");
		$(window).off(".sceneDrag");
		// replace placeholder with view
		this.$ph.replaceWith(this.$dragSceneView);
		// this.$ph.detach();
		// reset all scene scene ids
		console.log(this.sceneCollection.pluck("sceneId"))

		this.getViews(".scenes").each(function(scene, index){
			scene.model.set("sceneId", scene.$el.index());
			scene.$el.removeClass("dragging");
		});

		console.log(this.sceneCollection.pluck("sceneId"))

		this.sceneCollection.sort();

		console.log(this.sceneCollection.pluck("sceneId"))

		// render
		this.render();
	},
	onDragSceneDropOut: function(){
		console.log("SceneManagerView::onDragSceneDropOut");
		this.$el.removeClass("dragging");
		$(window).off(".sceneDrag");
		// replace placeholder with view
		// reset all scene scene ids
		// render
	},

	//-----------------------------------------------------

	addScene: function(){
		this.sceneCollection.add({});
	},
	onChangeLoop: function(){

	},
	onChangeNextScene: function(){
		// remove 'next' class from all scenes
		// add 'next' class to active scene
	},
	onClickAddNewSceneButton: function(){
		this.addScene();
	},
	onAddTrack: function(trackModel){
		// console.log("Scene-manager-view::onAddTrack", arguments)
	},
	onAddScene: function(sceneModel, collection, skipRender){
		console.log("Scene-manager-view::onAddScene num scenes", collection.length);
		// TODO: strange place to set this, move to sequencer model
		sceneModel.set("controller", this.controller);
		var sceneView = new SceneView({
			model: sceneModel
		});

		var patterns = sceneModel.get("patterns");
		// console.log(sceneModel);
		if (patterns.length < this.trackCollection.length){
			// add patterns to scene
			// console.log("Scene-manager-view::num tracks", collection.length);
			this.trackCollection.each(function(trackModel, i){
				// insert any track into the scene that doesn't already exist
				if (!patterns.findWhere({trackId: trackModel.id})){
					sceneModel.addPattern(trackModel);
				}
			});
		}

		this.insertViews({
				".scenes": sceneView
			})
			.listenTo(sceneView, "begin-drag-scene", this.onBeginDragScene);
		sceneView.render();
	}
});

module.exports = SceneManager;
