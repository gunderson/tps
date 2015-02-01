require("backbone");
require("backbone.layoutmanager");

var PatternOverviewView = Backbone.Layout.extend({
	el: false,
	keep: true,
	template: "sequencer/pattern-overview",
	events: {
		"click": "onClickPattern"
	},
	initialize: function(options){
	},
	afterRender: function(){
		this.drawPattern();
	},
	onClickPattern: function(e){
		this.model.trigger("show:pattern", {model: model});
	},
	drawPattern: function(){
		var $canvas = this.$("canvas");
		var ctx = $canvas[0].getContext("2d");
		ctx.fillStyle = "white";
		ctx.arc(50,50,25,0,Math.PI*2);
		ctx.fill();
	}
});

module.exports = PatternOverviewView;