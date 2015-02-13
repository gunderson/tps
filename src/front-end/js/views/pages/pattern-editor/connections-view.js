require("backbone");
require("backbone.layoutmanager");

var View = Backbone.Layout.extend({
	initialize: function(){

	},
	afterRender: function(){
		
	},
	drawConnection: function(a,b){

	},
	drawPartial: function(portView, pageX, pageY){
		var $portView = $(portView);
		var $portParent = $portView.parent();
		var portViewPosition = $portView.position();
		var portParentPosition = $portParent.position();
		var canvasOffset = this.$el.offset();
		var startX = portViewPosition.left + portParentPosition.left;
		var startY = portViewPosition.top + portParentPosition.top;
		var endX = pageX - canvasOffset.left;
		var endY = pageY - canvasOffset.top;

		var ctx = this.el.getContext("2d");
		ctx.strokeStyle = "#f00";
		ctx.strokeWidth = 1;
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
		ctx.stroke();
	},
	onResize: function(){
		this.$el.attr({
			height: this.$el.height(),
			width: this.$el.width(),
		})
	}
});

module.exports = View;