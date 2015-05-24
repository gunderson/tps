require("backbone");
require("backbone.layoutmanager");
var Snap = require("snapsvg");
var makeDragNumberInput = require("../../../../lib/DragNumberInput");


var View = Backbone.Layout.extend({
	el: false,
	keep: true,
	connectionRequest: null,
	events: {
		"mousedown .port"				: "onPortMouseDown",
		"mouseup .port"					: "onPortMouseUp",
		"click"							: "onClick",
		"mousedown"						: "onDragStart",
		"click .remove-button"          : "onClickRemove",
		"click .settings-button"		: "onClickSettings"
	},
	views: {},
	initialize: function(options){
		//bind dom event handlers
		this.listenTo(this.model, "regenerate", this.renderWaveforms, this);
	},
	afterRender: function(){

		// console.log("afterRender:: place components");

		this.$el.css({
			transform: "translate(" + this.model.get("x") + "px," + this.model.get("y") + "px)"
		});
		this.$controls = this.$(".component-controls");
		this.$controls.find("input[type=number]").each(function(){
			makeDragNumberInput(this);
		});

		// this.renderWaveforms();

		this.$controls.hide();

		this.setControlListeners();
	},
	cleanup: function(){
		this.clearControlListeners();
		if (this.$controls) {
			this.$controls.empty().remove();
		}
	},
	setControlListeners: function(){},
	clearControlListeners: function(){},
	// event handlers

	onClickSettings: function(){
		this.$controls.toggle();
	},
	onClickRemove: function(e){
		e.stopImmediatePropagation();
		this.model.destroy();
	},
	onClick: function(){
		if (this.cancelClick) return;
		//trigger menu to show correct options for type
		// this.model.trigger("activate-component", this.$controls);

		// deactivate everything
		// then activate this
		this.$el.parent().find(".component").removeClass("active");
		this.$el.addClass("active");

		this.renderWaveforms();

	},
	onDragStart: function(e){
		this.cancelClick = false;

		var pos = this.$el.offset();
		this.startX = pos.left;
		this.startY = pos.top;
		this.mouseDownX = e.pageX - pos.left;
		this.mouseDownY = e.pageY - pos.top;
		$("body")
			.on("mousemove", this.onDrag.bind(this))
			.on("mouseup mouseleave",this.onDragEnd.bind(this));
	},
	onDrag:function(e){
		//TODO cancel click
		// e.preventDefault();
		var parentPos = $("#components").offset();
		var newX = e.pageX - parentPos.left;
		var newY = e.pageY - parentPos.top;
		var dx = newX - this.startX;
		var dy = newY - this.startY;

		var distance = Math.sqrt((dx*dx)+(dy*dy));

		if (distance > 3){
			this.cancelClick = true;
		}
		this.model.set({
			x: newX - this.mouseDownX,
			y: newY - this.mouseDownY
		});

		this.$el.velocity({
			//TODO: switch to using mouse telemetrics class to handle this.
			translateX: newX - this.mouseDownX,
			translateY: newY - this.mouseDownY,	
		},{
			duration:0
		});
	},
	onDragEnd: function(e){
		e.preventDefault();
		e.stopImmediatePropagation();
		var position = this.$el.position();
		$("body").off("mousemove mouseup mouseleave");
		this.model.cancelConnectionRequest();
	},
	select: function(){

	},
	deselect: function(){

	},
	onPortMouseDown: function(e){
		var $target = $(e.currentTarget).parent();
		e.preventDefault();
		e.stopPropagation();
		this.model.triggerConnectionRequest($target.data("connection-id"));
		//start dragging connection
		this.trigger("connection-request", {$target: $target});
	},
	onPortMouseUp: function(e){
		var $currentTarget = $(e.currentTarget);
		var $target = $currentTarget.parent();
		this.model.triggerConnectionResponse($target.data("connection-id"));
	},
	onMouseLeave: function(){
		this.cancelConnection();
	},
	cancelConnection: function(){
		this.model.cancelConnectionRequest();
		this.trigger("cancel-connection-request");
		return this;
	},
	onStageUp: function(){
		this.cancelConnection();
		return this;
	},
	renderWaveforms: function(){
		var $outputDisplay = $("#sequencer-display .output-display .waveform");
		this.renderWaveform($outputDisplay, this.model.get("values") || [0], "#0ff");
		$outputDisplay.parent().addClass("active");

		var $oscillationDisplay = $("#sequencer-display .oscillation-display .waveform");
		Snap($oscillationDisplay[0]).clear();
		$oscillationDisplay.removeClass("active");

		var $rhythmDisplay = $("#sequencer-display .rhythm-display .waveform");
		$rhythmDisplay.parent().removeClass("active");

		var $pitchDisplay = $("#sequencer-display .pitch-display .waveform");
		$pitchDisplay.parent().removeClass("active");

		return this;
	},
	renderWaveform: function($el, data, color){
		color = color || "#0ff";
		var paper = Snap($el[0]);
		paper.clear();

		var wavescale = $el.height() >> 1;
		var tickWidth = $el.width() / data.length;
		var commands = ["M", 0, (data[0] * -wavescale) + wavescale];

		for (var i = 1, endi = data.length; i < endi; i++){
			commands.push("L", i * tickWidth, (data[i] * -wavescale) + wavescale);
		}


		var p = paper.path({
			d: commands.join(" "),
			stroke: color,
			strokeWidth: "1px",
			fill: "transparent"
		});



	}
});

module.exports = View;