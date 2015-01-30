require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page");

var SoundCloudAudioSource = require("../../lib/soundcloud/audiosource").SoundCloudAudioSource;
var SoundCloudLoader = require("../../lib/soundcloud/soundcloudloader");
var Visualizer = require("../../lib/soundcloud/visualizer");

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
		"click button.stop": "onClickStop"
	},
	initialize: function(){
		this.player = new Audio();
		this.loader = new SoundCloudLoader(this.player);
		this.audioSource = new SoundCloudAudioSource(this.player);
		this.visualizer = new Visualizer({
			audioSource: this.audioSource,
			canvas: this.$("#visualizer")[0]
		});
		this.player.addEventListener('ended', this.onSongEnd.bind(this));
		this.listenTo(this.model.get("current"), "change reset", this.onChangeCurrent);
		this.listenTo(this.model.get("next"), "change reset", this.onChangeNext);
	},

	afterRender: function(){
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
					this.visualizer.play();
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
					this.visualizer.play();
					deferred.resolve();
	    		}.bind(this));
    	}
    	return deferred.promise;
    },
    onClickStop: function(){
    	this.playing = false;
    	this.player.pause();
    	this.visualizer.stop();
    },



	transitionIn: function(){
		AbstractPage.prototype.transitionIn.apply(this, arguments);
	},
	transitionInComplete: function(){
		this.visualizer.play();
	},
	transitionOut: function(){
		AbstractPage.prototype.transitionOut.apply(this, arguments);
		this.visualizer.stop();
	},
	transitionOutComplete: function(){

	}
});

module.exports = Page;