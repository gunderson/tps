require("backbone");
var _ = require("_");

var Scene = Backbone.Model.extend({
	defaults: {
		tracks: new Backbone.Collection(),
		sceneId: 0
	},
	initialize: function(){
		//get patterns from tracks
		for(var i = 0; endi = this.tracks.length){
			this.patterns[i] = this.tracks[i].patterns[sceneId]
		}
	},
	onDeleteTrack: function(){

	},
	cleanup:function(){
		this.tracks = null;
	}
})

function getPatternsFromTrack(sceneId, track){
	return track.patterns[sceneId];
}

module.exports = Scene;
