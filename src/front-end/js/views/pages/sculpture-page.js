"use strict";

var _ = require("underscore");
var $ = require("jquery");
require("backbone");
require("backbone.layoutmanager");
var THREE = require("three.js");
var AbstractPage = require("./Page-view");

var AudioSource = require("../../lib/soundcloud/audiosource").MicrophoneAudioSource;
var TriangleVis = require("../../lib/soundcloud/TriangleVis");
var TunnelVis = require("../../lib/soundcloud/TunnelVis");
var GroundVis = require("../../lib/soundcloud/GroundVis");
var GroundVisIn = require("../../lib/soundcloud/GroundVis.in");
var ColumnVis = require("../../lib/soundcloud/ColumnVis");
var ColumnVisRight = require("../../lib/soundcloud/ColumnVis.right");
var ColumnVisIn = require("../../lib/soundcloud/ColumnVis.in");
var ColumnVisCirc = require("../../lib/soundcloud/ColumnVis.circ");
var ConcentricSlopeScuplture = require("../../lib/sculptures/Concentric.slope");
var GridWaveScuplture = require("../../lib/sculptures/Grid.wave");
var AnimationPlayer = require("../../lib/soundcloud/AnimationPlayer");

//abstract page class
var Page = AbstractPage.extend({
    keep: true,
    row: 1,
    col: 2,
    playing: false,
    el: "#microphone",
    events: {
        "click button.play": "onClickPlay",
        "click button.stop": "onClickStop",
        "click button.goFullScreen": "onClickGoFullScreen",
        "change select#vis-picker": "onChangeVis"
    },
    initialize: function() {
        // this.player.addEventListener('ended', this.onSongEnd.bind(this));
        this.renderer = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true
        });
        var visualizerOptions = {
            renderer: this.renderer
        };

        visualizers.push(new GridWaveScuplture(visualizerOptions));
        visualizers.push(new ConcentricSlopeScuplture(visualizerOptions));
        visualizers.push(new ColumnVisCirc(visualizerOptions));
        visualizers.push(new TriangleVis(visualizerOptions));
        visualizers.push(new TunnelVis(visualizerOptions));
        visualizers.push(new GroundVis(visualizerOptions));
        visualizers.push(new GroundVisIn(visualizerOptions));
        visualizers.push(new ColumnVis(visualizerOptions));
        visualizers.push(new ColumnVisIn(visualizerOptions));
        visualizers.push(new ColumnVisRight(visualizerOptions));

        this.setupAudio(2048);
        this.onFullScreen = this.onFullScreen.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);

    },

    afterRender: function() {
        this.animationPlayer = new AnimationPlayer({
            audioSource: this.audioSource,
            container: this.$("#visualizer")[0]
        });
        this.$("#visualizer").append(this.renderer.domElement);
        this.animationPlayer.setVisualizer(visualizers[0]);
        //$("#soundcloud .content").append(this.player);

        var $options = _.map(visualizers, (v, i) => $("<option />").val(i).text(i));
        this.$("#vis-picker").append($options);
    },
    onChangeVis: function(e) {
        e;
        var index = this.$("#vis-picker").val();
        this.animationPlayer.setVisualizer(visualizers[index]);
    },

    onChangeFile: function(e) {
        var file = e.target.files[0];
        this.fileAddress = "file:///" + file.path;
    },

    onSongEnd: function() {},
    onClickPlay: function() {
        this.playing = true;
        var deferred = $.Deferred();

        this.animationPlayer.play();
        deferred.resolve();

        return deferred.promise;
    },
    onClickStop: function() {
        this.playing = false;
        this.animationPlayer.stop();
    },

    onClickGoFullScreen: function() {
        this.animationPlayer.el.webkitRequestFullScreen();
    },

    onFullScreen: function() {
        this.animationPlayer.onFullScreen();
    },
    onNormalScreen: function() {},

    onKeyPress: function(e) {
        console.log(e);
        if (e.keyCode === 32) {
            e.preventDefault();
            if (this.playing) {
                this.onClickStop();
            } else {
                this.onClickPlay();
            }
        } else if (e.keyCode >= 49 && e.keyCode <= 58) {
            var visId = e.keyCode - 49;
            this.$("select#vis-picker").val(visId);
            this.animationPlayer.setVisualizer(visualizers[visId]);
        }
    },

    transitionIn: function() {
        AbstractPage.prototype.transitionIn.apply(this, arguments);
    },
    transitionInComplete: function() {
        // this.animationPlayer.play();

        $(document)
            .on("webkitfullscreenchange fullscreenchange", this.onFullScreen)
            .on("keypress", this.onKeyPress);

        setTimeout(this.onClickPlay.bind(this), 1000);
    },
    transitionOut: function() {
        AbstractPage.prototype.transitionOut.apply(this, arguments);
        this.animationPlayer.stop();

        $(document)
            .off("webkitfullscreenchange fullscreenchange", this.onFullScreen)
            .off("keypress", this.onKeyPress);
    },
    transitionOutComplete: function() {

    },
    setupAudio: setupAudio
});

var visualizers = [];

function setupAudio(fftSize) {
    this.audioSource = new AudioSource(fftSize);
}

module.exports = Page;
