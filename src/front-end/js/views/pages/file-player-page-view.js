require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");

var FileAudioSource = require("../../lib/soundcloud/audiosource").FileAudioSource;
var TriangleVis = require("../../lib/soundcloud/TriangleVis");
var TunnelVis = require("../../lib/soundcloud/TunnelVis");
var GroundVis = require("../../lib/soundcloud/GroundVis");
var ColumnVis = require("../../lib/soundcloud/ColumnVis");
var AnimationPlayer = require("../../lib/soundcloud/AnimationPlayer");

//abstract page class
var Page = AbstractPage.extend({
	keep: true,
	row:1,
	col:2,
	playing: false,
	el: "#file-player",
	events: {
		"click button.play": "onClickPlay",
		"click button.stop": "onClickStop",
        "click button.goFullScreen": "onClickGoFullScreen",
        "change input#file-picker": "onChangeFile",
        "change select#vis-picker": "onChangeVis",
	},
	initialize: function(){
		// this.player.addEventListener('ended', this.onSongEnd.bind(this));
		
		visualizers.push(new ColumnVis());
		visualizers.push(new TriangleVis());
		visualizers.push(new TunnelVis());
		visualizers.push(new GroundVis());

		this.setupPlayer(2048);
		this.onFullScreen = this.onFullScreen.bind(this);
		this.onKeyPress = this.onKeyPress.bind(this);

	},

	afterRender: function(){
		this.animationPlayer = new AnimationPlayer({
			audioSource: this.audioSource,
			container: this.$("#visualizer")[0],
			audioPlayer: this.player
		});
		this.animationPlayer.setVisualizer(visualizers[0]);
		//$("#soundcloud .content").append(this.player);
	},
	onChangeVis: function(e){
		var index = e.target.value;
		this.animationPlayer.setVisualizer(visualizers[index]);
	},

	onChangeFile: function(e){
		var file = e.target.files[0];
		this.fileAddress = "file:///"+file.path;
	},
	
    onSongEnd: function(){
    },
    onClickPlay: function(){
    	this.playing = true;
    	var deferred = $.Deferred();

    	if (!this.fileAddress){
			deferred.reject();
    	} else {
			this.audioSource.playStream(this.fileAddress);
			this.animationPlayer.play();
			deferred.resolve();
    	}

    	return deferred.promise;
    },
    onClickStop: function(){
    	this.playing = false;
    	this.player.pause();
    	this.animationPlayer.stop();
    },

    onClickGoFullScreen: function(){
    	this.animationPlayer.el.webkitRequestFullScreen();
    },

    onFullScreen: function(){
    	console.log("!!!!!!!!!!!!!!")
    	this.animationPlayer.onFullScreen();
    },
    onNormalScreen: function(){
    },

    onKeyPress: function(e){
    	console.log(e)
    	switch(e.keyCode){
    		case 32:
    			e.preventDefault();
    			if (this.playing){
    				this.onClickStop();
    			} else {
    				this.onClickPlay();
    			}
    		break;
    	}
    },

	transitionIn: function(){
		AbstractPage.prototype.transitionIn.apply(this, arguments);
	},
	transitionInComplete: function(){
		this.animationPlayer.play();

		console.log("&&&&&&&&")

		$(document)
			.on("webkitfullscreenchange fullscreenchange", this.onFullScreen)
			.on("keypress", this.onKeyPress);
	},
	transitionOut: function(){
		AbstractPage.prototype.transitionOut.apply(this, arguments);
		this.animationPlayer.stop();

		$(document)
			.off("webkitfullscreenchange fullscreenchange", this.onFullScreen)
			.off("keypress", this.onKeyPress);
	},
	transitionOutComplete: function(){

	},
	setupPlayer: setupPlayer
});

var visualizers = [];

function setupPlayer(fftSize){
	this.player = new Audio();
	// this.player.controls = true;
	this.audioSource = new FileAudioSource(this.player, fftSize);
}

module.exports = Page;