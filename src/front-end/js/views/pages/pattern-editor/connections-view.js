require("backbone");
require("backbone.layoutmanager");
var Snap = require("snapsvg");

var View = Backbone.Layout.extend({
	el: "#connections",
	keep: true,
	initialize: function(){
		this.listenTo(this.collection, "add remove reset", this.render);
	},
	beforeRender: function(){

	},
	afterRender: function(){
		// make connections	
		this.paper = Snap(this.el);
	},
	drawConnection: function(a,b){

	},
	beginConnection: function(data){
		this.currentPortId = data.sourceId;
		this.portModel = data.model;
		//create new svg object in svg layer
		this.$el.on("mousemove", this.whileMakingConnection.bind(this));
		this.$el.css("pointer-events", "auto");

		this.path = this.paper.path().attr({
			id: this.currentPortId,
			class: "connection",
			stroke: "black",
			fill: "transparent"
		});
	},
	whileMakingConnection: function(e){
		this.drawPartial(e.pageX, e.pageY);
	},
	cancelConnection: function(data){
		this.$el.find("#" + this.currentPortId).remove();
		this.$el.off("mousemove");
		this.$el.css("pointer-events", "none");
	},
	completeConnection: function(a,b){

	},
	drawPartial: function(pageX, pageY){
		var el_hw = this.$el.width() >> 1;
		var el_hh = this.$el.height() >> 1;
		var el_offset = this.$el.offset();
		var localX = pageX - el_offset.left;
		var localY = pageY - el_offset.top;

		var portId = this.currentPortId;

		var portX = el_offset.left + el_hw + this.portModel.get("x");
		var portY = el_offset.top + el_hh + this.portModel.get("y");

		var dx = localX - portX;
		var dy = localY - portY;

		var dist = Math.sqrt((dx*dx)+(dy*dy));


		path = [
			"M", portX, portY,
			"C", portX - (dist >> 1), portY, ",", localX - (dx >> 1), localY - (dy >> 1), ",", localX, localY

		].join(" ");


		this.path.attr({
			d: path
		});
	},
	onResize: function(){
		this.cancelConnection();
		this.$el.attr({
			height: this.$el.height(),
			width: this.$el.width(),
		});
	}
});

module.exports = View;