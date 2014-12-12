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
	el: "#soundcloud",
	events: {
		"submit form": "onSubmitForm",
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
	},

	afterRender: function(){
		
	},

	loadAndUpdate: function(trackUrl) {
		var _this = this;
        this.loader.loadStream(trackUrl,
            function() {
                _this.audioSource.playStream(_this.loader.streamUrl());
            },
            function() {
                console.error("Error", _this.loader.errorMessage);
            });
    },
    onSubmitForm: function(e){
    	e.preventDefault();
    	this.loadAndUpdate(this.$("input#url-field").val());
		this.visualizer.play();
    },

    onClickPlay: function(){
    	this.player.play();
    	this.visualizer.play();
    },
    onClickStop: function(){
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