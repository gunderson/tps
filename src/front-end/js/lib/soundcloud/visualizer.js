var _ = require("underscore");

var prefixMethod = require("./prefixmethod");
prefixMethod("requestAnimationFrame");
prefixMethod("cancelAnimationFrame");

var Visualizer = function(options) {
    var audioSource = options.audioSource;
    var canvas = options.canvas;
    var ctx = canvas.getContext("2d");
    var loopFrame;
    var streamData = new Uint8Array(255);
    var prevStreamData = new Uint8Array(255);
    var prevStreamData2 = new Uint8Array(255);
    var isPlaying = false;
    var inc = 0;
    this.play = function(){
        if (!isPlaying){
            isPlaying = true;
            loop();
        }
    };

    this.stop = function(){
        isPlaying = false;
        if (loopFrame){
            cancelAnimationFrame(loopFrame);
        }
    };

    function update(){
        prevStreamData2 = new Uint8Array(prevStreamData.buffer.slice());
        prevStreamData = new Uint8Array(streamData.buffer.slice());
        streamData = new Uint8Array(audioSource.streamData.buffer.slice());
        inc++;
    }

    function draw(){
        //cheap clear
        canvas.width = canvas.width;
        var barWidth = canvas.width / (streamData.length >> 3);
        ctx.fillStyle = "#ff0000";

        for (var i = 0, endi = streamData.length; i < endi; i+=8){
            var val = streamData[i];
            var barHeight = (canvas.height * streamData[i] / 0xff);
            ctx.fillRect((i >> 3) * (barWidth + 1), canvas.height - barHeight, barWidth, barHeight);
        }
        //detect a peak
        i = 0x3f;
        if (prevStreamData2[i] > prevStreamData[i] && prevStreamData[i] < streamData[i]){
            $.get("http://localhost:3030/pulse/trigger/2");
        }
        i = 0x1f;
        if (prevStreamData2[i] > prevStreamData[i] && prevStreamData[i] < streamData[i]){
            $.get("http://localhost:3030/pulse/trigger/1");
        }
    }

    function loop(){
        update();
        draw();
        if (isPlaying) requestAnimationFrame(loop);
    }
};
module.exports = Visualizer;