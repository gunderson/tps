require("backbone");
require("backbone.layoutmanager");
var Snap = require("snapsvg");

var View = Backbone.Layout.extend({
	el: "#connections",
	// keep: true,
	initialize: function(){
		this.listenTo(this.collection, "add remove reset", this.render);
	},
	setConnectionCollection: function(collection){
		if (this.collection) this.stopListening(this.collection);
		this.collection = collection;
		this.listenTo(this.collection, "add remove reset", this.render);
	},
	setComponentCollection: function(componentCollection){
		if (this.componentCollection) this.stopListening(this.componentCollection);
		this.componentCollection = componentCollection;
		this.listenTo(this.componentCollection, "add remove reset", this.render);
	},
	beforeRender: function(){
	},
	afterRender: function(){
		// make connections	
		this.paper = Snap(this.el);
		Snap.selectAll("path").remove();
		console.log("render", this.collection.length);
		//for each connection
		this.collection.each(function(connection){
			this.drawConnection(connection);
		}.bind(this));
	},
	drawConnection: function(connection){
		var $input = $('.input[data-connection-id="' + connection.get("input").id + '"]');
		var inputOffset = $input.offset();
		var $output = $('.output[data-connection-id="' + connection.get("output").id + '"]');
		var outputOffset = $output.offset();
		var dx = inputOffset.left - outputOffset.left;
		var dy = inputOffset.top - outputOffset.top;
		var dist = Math.sqrt((dx*dx)+(dy*dy));
		var elOffset = this.$el.offset();

		var inputX = inputOffset.left - elOffset.left;
		var inputY = inputOffset.top - elOffset.top;
		var outputX = outputOffset.left - elOffset.left;
		var outputY = outputOffset.top - elOffset.top;

		var d = [
			"M", inputX, inputY,
			"C", inputX - (dist >> 1), inputY, ",", outputX - (dist >> 1), outputY, ",", outputX, outputY

		].join(" ");

		var path = this.paper.path().attr({
			d: d,
			inputId: connection.get("input").id,
			outputId: connection.get("output").id,
			class: "connection",
			stroke: "#fa0",
			strokeWidth: "5px",
			fill: "transparent"
		});
		connection.set("path", path);

	},
	setComponents: function(componentCollection){
		this.componentCollection = componentCollection;
	},
	beginConnection: function(data){
		console.log("BEGIN CONNECTION")
		this.currentPortId = data.port.id;
		this.port = data.port;
		this.portModel = data.model;
		$(window)
			.on("mousemove", this.whileMakingConnection.bind(this))
			.on("mouseup",   this.cancelConnection.bind(this));

		//create new svg object in svg layer
		this.path = this.paper.path().attr({
			id: this.currentPortId,
			class: "connection",
			stroke: "#fa0",
			strokeWidth: "5px",
			fill: "transparent"
		});
	},
	whileMakingConnection: function(e){
		this.drawPartial(e.pageX, e.pageY);
	},
	cancelConnection: function(){
		if (this.path){
			this.path.remove();
			this.path = null;
			$(window).off("mousemove mouseup");
		}
	},
	completeConnection: function(a,b){
		$(window).off("mousemove");
	},
	drawPartial: function(pageX, pageY){
		var el_hw = this.$el.width() >> 1;
		var el_hh = this.$el.height() >> 1;
		var el_offset = this.$el.offset();
		var localX = pageX - el_offset.left;
		var localY = pageY - el_offset.top;

		var portId = this.currentPortId;

		var $port = $(".input[data-connection-id='"+this.port.id+"'], .output[data-connection-id='"+this.port.id+"']");


		var portX = $port.offset().left - el_offset.left ;
		var portY = $port.offset().top - el_offset.top;

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