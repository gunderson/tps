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
		if (this.componentCollection) {
			console.log("setComponentCollection release listeners", this.componentCollection);
			this.stopListening(this.componentCollection);
		}

		console.log("setComponentCollection set new listeners", componentCollection);
		this.componentCollection = componentCollection;
		this.listenTo(componentCollection, "add reset", this.render);
		this.listenTo(componentCollection, "remove", this.onRemoveConnection);
		this.listenTo(componentCollection, "change", this.updateConnections);

	},
	beforeRender: function(){
		this.$('path').remove();
		this.collection.each(function(connectionModel){
			connectionModel.set("path", null);
		});
	},
	updateAllConnections: function(){
		this.componentCollection.each(function(componentModel){
			this.updateConnections(componentModel);
		}.bind(this));
	},
	updateConnections: function(componentModel, event){
		console.log("updateConnections",componentModel);
		componentModel.get("ports")
			.each(this.updatePort.bind(this));
	},
	updatePort: function(port){
		console.log("updatePort",port);
		var connectionsCollection = this.collection;
		var connection = connectionsCollection.find(function(conn){
			if (port.get("type") === "input" && conn.get("input") === port){
				return conn;
			} else if (port.get("type") === "output" && conn.get("output") === port){
				return conn;
			} else {
				return false;
			}
		});
		if (connection){
			this.drawConnection(connection);
		}
	},
	afterRender: function(){
		this.setConnectionCollection(this.collection);
		this.setComponentCollection(this.componentCollection);
		// make connections	
		this.paper = Snap(this.el);
		this.updateAllConnections();
	},
	onRemoveConnection: function(connection, collection, event){
		this.paper.remove(connection.path);
	},
	drawConnection: function(connection){
		console.log("render connection inputOffset", connection);

		var $input = $('.input[data-connection-id="' + connection.get("input").id + '"]');
		var $inputPort = $input.find(".port");
		var inputOffset = $input.offset();

		console.log("render connection inputOffset", inputOffset);

		var $output = $('.output[data-connection-id="' + connection.get("output").id + '"]');
		var $outputPort = $input.find(".port");
		var outputOffset = $output.offset();

		console.log("render connection outputOffset", outputOffset);

		var dx = inputOffset.left - outputOffset.left;
		var dy = inputOffset.top - outputOffset.top;
		var dist = Math.sqrt((dx*dx)+(dy*dy));
		var elOffset = this.$el.offset();

		console.log("render connection elOffset", elOffset);

		var inputX = ($inputPort.width() >> 1) + inputOffset.left - elOffset.left;
		var inputY = ($inputPort.height() >> 1) + inputOffset.top - elOffset.top;
		var outputX = ($outputPort.width() >> 1) + outputOffset.left - elOffset.left;
		var outputY = ($outputPort.height() >> 1) + outputOffset.top - elOffset.top;

		var d = [
			"M", inputX, inputY,
			"C", inputX - (dist >> 1), inputY, ",", outputX + (dist >> 1), outputY, ",", outputX, outputY

		].join(" ");

		var path = connection.get("path");
		//if path exists use path
		if (path){
			path.attr({
				d: d
			});
		} else {
			//else create a new path
			path = this.paper.path().attr({
				d: d,
				inputId: connection.get("input").id,
				outputId: connection.get("output").id,
				class: "connection",
				stroke: "#fa0",
				strokeWidth: "5px",
				fill: "transparent"
			});
		}


		console.log("render connection path", d, path);


		connection.set("path", path);

	},
	setComponents: function(componentCollection){
		this.componentCollection = componentCollection;
	},
	beginConnection: function(data){
		console.log("BEGIN CONNECTION");
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

		var $io = $(".input[data-connection-id='"+this.port.id+"'], .output[data-connection-id='"+this.port.id+"']");
		var $port = $io.find(".port"); 

		var portX = ($port.width() >> 1) + $io.offset().left - el_offset.left ;
		var portY = ($port.height() >> 1) + $io.offset().top - el_offset.top;

		var dx = localX - portX;
		var dy = localY - portY;

		var dist = Math.sqrt((dx*dx)+(dy*dy));

		var dir = (this.port.get("type") === "input") ? -1: 1;


		path = [
			"M", portX, portY,
			"C", portX + dir * (dist >> 1), portY, ",", localX - (dx >> 1), localY - (dy >> 1), ",", localX, localY

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