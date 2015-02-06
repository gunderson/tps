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
		"click"                     : "onClick"
	},
	initialize: function(options){
	},
	onClick: function(){
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
	select: function(){

	},
	deselect: function(){

	},
	onInputMouseDown: function(e){
		e.preventDefault();
		console.log("port down");
		//if connection exists
			//clear other connection
		//start dragging connection
	},
	onOutputMouseDown: function(e){
		e.preventDefault();
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