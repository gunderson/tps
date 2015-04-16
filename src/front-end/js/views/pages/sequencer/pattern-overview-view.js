require("backbone");
require("backbone.layoutmanager");
var OutputNotesView = require("../pattern-editor/output-notes-view");

var PatternOverviewView = Backbone.Layout.extend({
	el: false,
	keep: true,
	template: "sequencer/pattern-overview",
	events: {
		"click": "onClickPattern"
	},
	initialize: function(options){
		this.outputNotesView = new OutputNotesView();
		this.outputNotesView.setModel(this.model);
		this.listenTo(this.model, "16th", this.on16th);

	},
	beforeRender: function(){
		this.setViews({
			".pattern-graph": this.outputNotesView
		});
	},
	afterRender: function(){
	},
	on16th: function(patternStatus){
		// console.log("patternStatus", patternStatus)
		this.$(".sixteenth")
			.removeClass("playing")
				.eq(patternStatus.current16th)
				.addClass("playing");
	},
	onClickPattern: function(e){
		this.model.trigger("edit-pattern", this.model);
	},
	drawPattern: function(){
		
	},
	serialize: function(){
		return _.extend(this.model.toJSON(), {
			trackId: this.model.get("track").get("trackId"),
			sceneId: this.model.get("scene").get("sceneId")
		});
	}
});

module.exports = PatternOverviewView;