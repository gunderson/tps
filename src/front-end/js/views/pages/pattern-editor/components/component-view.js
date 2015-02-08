require("backbone");
require("backbone.layoutmanager");

var View = Backbone.Layout.extend({
	el: false,
	keep: true,
	events: {
		"mousedown .input>.port"	: "onInputMouseDown",
		"mouseup .input>.port"		: "onOInputMouseUp",
		"mousedown .output>.port"	: "onOutputMouseDown",
		"mouseup .output>.port"		: "onOutputMouseUp",
		"click"                     : "onClick",
		"mousedown"                 : "onDragStart",
	},
	views: {},
	initialize: function(options){
		//bind dom event handlers
	},
	onClick: function(){
		if (this.cancelClick) return;
		//trigger menu to show correct options for type
		var $patternEditor = $('#pattern-editor');
		var componentType = this.model.get("componentType");
		var subType = this.model.get("type");
		var className = "component-selected-" + componentType + " component-selected-" + subType;
		var currentClasses = $patternEditor[0].className.split(/\s+/);
		var componentClasses = _.filter(currentClasses, function(c){
			return c.indexOf("component-selected") > -1;
		});
		// deactivate everything
		// then activate this
		$patternEditor
			.removeClass(componentClasses.join(" "))
			.addClass(className);
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
		$("body").off("mousemove mouseup mouseleave");
	},
	select: function(){

	},
	deselect: function(){

	},
	onInputMouseDown: function(e){
		e.preventDefault();
		e.stopPropagation();
		console.log("port down");
		//if connection exists
			//clear other connection
		//start dragging connection
	},
	onOutputMouseDown: function(e){
		e.preventDefault();
		e.stopPropagation();
		console.log("port down");
		//if connection exists
			//clear other connection
		//start dragging connection
	},
	onMouseLeave: function(){
		this.cancelConnection();
	},
	cancelConnection: function(){

	},
	onInputMouseUp: function(e){
		//if source is an output
		//and source parent is not this
		//create connection
	},
	onOutputMouseUp: function(e){
		//if source is an input
		//and source parent is not this
		//if connection exists
			//clear other connection
		//create connection
	},
	onStageUp: function(){
		this.cancelConnection();
	}
});

module.exports = View;