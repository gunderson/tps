require("backbone");
require("backbone.layoutmanager");

var View = Backbone.Layout.extend({
	el: false,
	keep: true,
	connectionRequest: null,
	events: {
		"mousedown .port"				: "onPortMouseDown",
		"mouseup .port"					: "onPortMouseUp",
		"click"							: "onClick",
		"mousedown"						: "onDragStart",
		"change .component-controls"	: "onChangeComponentControls" 
	},
	views: {},
	initialize: function(options){
		//bind dom event handlers
	},
	afterRender: function(){
		this.$el.css({
			translateX: this.model.get("x"),
			translateY: this.model.get("y"),
		});
		this.$controls = this.$(".component-controls");
		this.$controls.detach();
	},
	cleanup: function(){
		if (this.$controls) {
			this.$controls.empty().remove();
		}
	},
	// event handlers
	onClick: function(){
		if (this.cancelClick) return;
		//trigger menu to show correct options for type
		this.model.trigger("activate-component", this.$controls);
		// deactivate everything
		// then activate this
		this.$el.parent().find(".component").removeClass("active");
		this.$el.addClass("active");

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
		e.preventDefault();
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
	},
	onStageUp: function(){
		this.cancelConnection();
	}
});

module.exports = View;