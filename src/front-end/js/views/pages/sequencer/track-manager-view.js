require("backbone");
require("backbone.layoutmanager");
var TrackView = require("./track-view");

var TrackManager = Backbone.Layout.extend({
	keep:true,
	el: "#track-manager",
	events: {
		"click #add-new-track-button": "onClickAddNewTrackButton"
	},
	initialize: function(options){
		this.trackCollection = options.trackCollection;
		this.sceneCollection = options.sceneCollection;
		this.listenTo(this.trackCollection, "reset add", this.render);
	},
	beforeRender: function(){
		//for each model in the track collection insert a new view
		this.trackCollection.each(function(trackModel){
			this.insertViews({
				"#user-tracks": new TrackView({model: trackModel})
			});
		}.bind(this));
	},
	addTrack: function(){
		this.trackCollection.add({});
	},
	onClickAddNewTrackButton: function(){
		this.addTrack();
	}
});

module.exports = TrackManager;