require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");

var SoundCloudAudioSource = require("../../lib/soundcloud/audiosource").SoundCloudAudioSource;
var SoundCloudLoader = require("../../lib/soundcloud/soundcloudloader");
var TriangleVis = require("../../lib/soundcloud/TriangleVis");
var TunnelVis = require("../../lib/soundcloud/TunnelVis");
var GroundVis = require("../../lib/soundcloud/GroundVis");
var ColumnVis = require("../../lib/soundcloud/ColumnVis");
var AnimationPlayer = require("../../lib/soundcloud/AnimationPlayer");

//abstract page class
var Page = AbstractPage.extend({
	keep: true,
	row:1,
	col:1,
	playing: false,
	el: "#soundcloud",
	events: {
		"click button.advance": "onClickAdvance",
		"click button.play": "onClickPlay",
		"click button.stop": "onClickStop",
        "click button.goFullScreen": "onClickGoFullScreen"
	},
	initialize: function(){
		this.setupSoundCloudPlayer();
		this.player.addEventListener('ended', this.onSongEnd.bind(this));
		this.listenTo(this.model.get("current"), "change reset", this.onChangeCurrent);
		this.listenTo(this.model.get("next"), "change reset", this.onChangeNext);
		
		// visualizers.push(new GroundVis());
		// visualizers.push(new TunnelVis());
		visualizers.push(new TriangleVis());
		visualizers.push(new ColumnVis());

		$(document)
			.on("webkitfullscreenchange fullscreenchange", this.onFullScreen.bind(this))
			.on("keypress", this.onKeyPress.bind(this));
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
	onChangeCurrent: function(){
		this.updateSongTitles();
		if (this.playing){
			this.onClickPlay();
		}
	},
	onChangeNext: function(){
		this.updateSongTitles();
	},
	updateSongTitles:function(){
		var currentModel = this.model.get("current");
		var nextModel = this.model.get("next");
		var currentURL = currentModel.get("soundcloud_url");
		var nextextURL = nextModel.get("soundcloud_url");

		var currentText = currentModel.get("soundcloudData") ? currentModel.get("soundcloudData").title : currentURL;
		var nextText = nextModel.get("soundcloudData") ? nextModel.get("soundcloudData").title : nextextURL;

		this.$(".now-playing a").attr("href", currentURL).text(currentText);
		this.$(".up-next a").attr("href", nextextURL).text(nextText);
	},
    onClickAdvance: function(){
    	this.model.advance();
    },
    onSongEnd: function(){
    	this.model.advance();
    },
    onClickPlay: function(){
    	this.playing = true;
    	var deferred = $.Deferred();
    	if (this.model.get("current").get("soundcloud_url")){
    		this.loader.loadStream(this.model.get("current").get("soundcloud_url"),
    			function(song){
    				//on success
					// this.player.play();
					this.audioSource.playStream(this.loader.streamUrl());
					this.animationPlayer.play();
					deferred.resolve();
    			}.bind(this), function(){
    				//on error
					deferred.reject();
    			});
    	} else {
    		this.model.start()
	    		.done(function(){
	    			this.audioSource.playStream(this.loader.streamUrl());
					// this.player.play();
					this.animationPlayer.play();
					deferred.resolve();
	    		}.bind(this));
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
	},
	transitionOut: function(){
		AbstractPage.prototype.transitionOut.apply(this, arguments);
		this.animationPlayer.stop();
	},
	transitionOutComplete: function(){

	},
	setupSoundCloudPlayer: setupSoundCloudPlayer
});

var visualizers = [];

function setupSoundCloudPlayer(){
	this.player = new Audio();
	// this.player.controls = true;
	this.loader = new SoundCloudLoader(this.player);
	this.audioSource = new SoundCloudAudioSource(this.player, 2048);
}

module.exports = Page;