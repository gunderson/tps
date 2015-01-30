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
        var barWidth = canvas.width / (streamData.length >> 0);
        ctx.fillStyle = "#ff0000";

        for (var i = 0, endi = streamData.length; i < endi; i+=1){
            var val = streamData[i];
            var barHeight = (canvas.height * streamData[i] / 0xff);
            if (i == 0x42 || i == 0x20) {
                ctx.fillStyle = "#0000ff";
            } else {
                ctx.fillStyle = "#ff0000";
            }
            ctx.fillRect((i >> 0) * (barWidth + 1), canvas.height - barHeight, barWidth, barHeight);
        }
        //detect a peak
        i = 0x42;
        if (prevStreamData2[i] < prevStreamData[i] && prevStreamData[i] > streamData[i]){
            $.get("http://localhost:3030/pulse/trigger/3");
        }
        i = 0x20;
        if (prevStreamData2[i] < prevStreamData[i] && prevStreamData[i] > streamData[i]){
            $.get("http://localhost:3030/pulse/trigger/4");
        }
    }

    function loop(){
        update();
        draw();
        if (isPlaying) requestAnimationFrame(loop);
    }
};
module.exports = Visualizer;