var _ = require("underscore");
var THREE = require("three.js");
require("underscore.filledArray");


var prefixMethod = require("./prefixmethod");
prefixMethod("requestAnimationFrame");
prefixMethod("cancelAnimationFrame");




var Visualizer = function(options) {
    var audioSource = options.audioSource;
    var container = options.container;
    //var ctx = canvas.getContext("2d");
    var loopFrame;
    var streamData = new Uint8Array(1024);
    var prevStreamData = new Uint8Array(1024);
    var prevStreamData2 = new Uint8Array(1024);
    var isPlaying = false;
    var inc = 0;

    var THE_ORIGIN = new THREE.Vector3(0,0,0);
    Math.PHI = 2.399963229728653;

    this.play = play;
    this.stop = stop;
    this.setup = setup;

        // ------------------------------------

    var tick = 0;
    var prevTick = -1;
    var prevFFTData = _.filledArray(1024, 0);

    function update(time, fftData) {
        tick = time / millisPerTick;
        // if (prevTick != tick){
        //     getParticles(30, {birthday: time});
        // }

        colorMapOffset.x += colorMapDrift.x;
        colorMapOffset.y += colorMapDrift.y;

        activeParticles.forEach(function(p, i){
            updateParticle(p, time, fftData[i]);
        });

        var cameraTick = Math.PI * 2 * ((tick % 1080) / 1080);
        //camera.rotation.z =  cameraTick
        //camera.position.x = Math.cos(cameraTick) * WIDTH * 0.25
        //camera.position.y = Math.sin(cameraTick) * HEIGHT * 0.25
        //camera.lookAt(center);
        prevTick = tick;


        prevStreamData2 = new Uint8Array(prevStreamData.buffer.slice());
        prevStreamData = new Uint8Array(streamData.buffer.slice());
        streamData = new Uint8Array(audioSource.streamData.buffer.slice());

        // normalize stream data


        // streamData = new Uint8Array(
        //     _.map(streamData, function(val, i, arr){
        //         var len = arr.length;
        //         var prop = i / len;
        //         if (prop < 0.5){
        //             val *= 0.5 * (0.5 - prop);
        //         } else {
        //             val *= 4 * (prop - 0.5);
        //         }
        //         return val;
        //     })
        // );



        inc++;

    }

    // function draw(){
    //     //cheap clear
    //     canvas.width = canvas.width;
    //     var barWidth = canvas.width / (streamData.length >> 0);
    //     ctx.fillStyle = "#ff0000";

    //     for (var i = 0, endi = streamData.length; i < endi; i+=1){
    //         var val = streamData[i];
    //         var barHeight = (canvas.height * streamData[i] / 0xff);
    //         if (i == 0x42 || i == 0x20) {
    //             ctx.fillStyle = "#0000ff";
    //         } else {
    //             ctx.fillStyle = "#ff0000";
    //         }
    //         ctx.fillRect((i >> 0) * (barWidth + 1), canvas.height - barHeight, barWidth, barHeight);
    //     }
    //     //detect a peak
    //     i = 0x42;
    //     if (prevStreamData2[i] < prevStreamData[i] && prevStreamData[i] > streamData[i]){
    //         // $.get("http://localhost:3030/pulse/trigger/3");
    //     }
    //     i = 0x20;
    //     if (prevStreamData2[i] < prevStreamData[i] && prevStreamData[i] > streamData[i]){
    //         // $.get("http://localhost:3030/pulse/trigger/4");
    //     }
    // }

    // function loop(){
    //     update();
    //     draw();
    //     if (isPlaying) requestAnimationFrame(loop);
    // }


    // ------------------------------------

    var WIDTH,HEIGHT,center,particleDestination;

    // set some camera attributes
    var VIEW_ANGLE,ASPECT,NEAR,FAR;

    // get the DOM element to attach to
    var renderer, camera, scene;

    var standardGeometry;

    function setup(){
        activeParticles.forEach(function(p){
            scene.remove(p);
        });
        activeParticles = [];

        // set the scene size
        WIDTH = $(container).width();
        HEIGHT = $(container).height();
        center = new THREE.Vector3(0, 0, 0);
        particleDestination = new THREE.Vector3(0, 0, 900);

        // set some camera attributes
        VIEW_ANGLE = 90;
        ASPECT = WIDTH / HEIGHT;
        NEAR = 0.01;
        FAR = 4000;

        // create a WebGL renderer, camera
        // and a scene
        renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
        renderer.autoClear = true;
        camera = new THREE.PerspectiveCamera(
            VIEW_ANGLE,
            ASPECT,
            NEAR,
            FAR);

        scene = new THREE.Scene();


        // the camera starts at 0,0,0
        // so pull it back
        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = 1000;
        camera.lookAt(new THREE.Vector3(0, 0, -10));

        // add the camera to the scene
        scene.add(camera);

        // add light to the scene
        var light = new THREE.AmbientLight( 0xffffff ); // soft white light
        scene.add( light );

        standardGeometry = new THREE.CylinderGeometry(
            (WIDTH + HEIGHT) * 0.12, // upper radius
            (WIDTH + HEIGHT) * 0.12, // lower radius
            100, // height
            3 // segments
        );
        standardGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );


        // start the renderer
        renderer.setSize(WIDTH, HEIGHT);

        // attach the render-supplied DOM element
        container.appendChild(renderer.domElement);

        loadColorMap();
    }


    // create the sphere's material
    var standardMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        opacity: 0,

    });





    // ------------------------------------

    // create object pool
    var availableParticles = [];
    var activeParticles = [];


    // ------------------------------------

    function getParticles(quantity, options) {
        quantity = quantity || 1;
        while (availableParticles.length < quantity) {
            availableParticles.push(new Particle());
        }
        var newParticles = availableParticles.splice(0, quantity);
        newParticles.forEach(function(p){
            // setupParticle(p, options);
            scene.add(p);
        });
        activeParticles = activeParticles.concat(newParticles);
        return newParticles;
    }

    // ------------------------------------

    var rows = 32, cols = 32, totalChannels = rows * cols;

    function setupParticles(){
        getParticles(totalChannels, {birthday: Date.now()})
            .forEach(function(p,i){
                setupParticle(p, {index: i});
            });
    }


    // ------------------------------------

    function setupParticle(particle, options){
        var p = _.extend(particle, options);
        p.geometry.dynamic = true;

        // changes to the vertices
        p.geometry.verticesNeedUpdate = true;

        // changes to the normals
        p.geometry.normalsNeedUpdate = true;

        // assign particles to home positions
        // p.computeGridPosition(cols, rows);
        p.computeSpiralPosition();

        p.angle = Math.atan2(p.homePosition.y, p.homePosition.x);
        p.speed = 0.5;
        
        var color = getRGB(colorMap, colorMapData, p.homePosition.x *0.5, p.homePosition.y* 0.5);
        p.material.color = new THREE.Color(color);
    }

    var spiralStartIndex = 1;

    function computeSpiralPosition(){
        var finalRadius = Math.sqrt (activeParticles.length + spiralStartIndex);
        var p = this;
            
        var angle = p.index * Math.PHI; //Golden angle relative to TWO_PI
        
        p.homePosition = new THREE.Vector3(
            Math.cos(angle) * Math.sqrt(p.index + spiralStartIndex) * 2 * (WIDTH / finalRadius),
            Math.sin(angle) * Math.sqrt(p.index + spiralStartIndex) * 2 * (HEIGHT / finalRadius),
            0
        );

        // console.table(p.homePosition)
        
        p.position.x = p.homePosition.x;       
        p.position.y = p.homePosition.y;       
    }

    function computeGridPosition(cols, rows){
        var p = this;
        p.gridPosition = {x: p.index % cols, y: Math.floor(p.index / cols), z: 0};
        p.homePosition.x = ((p.gridPosition.x / cols) * WIDTH) - (WIDTH*0.5);
        p.homePosition.y = ((p.gridPosition.y / rows) * HEIGHT) - (HEIGHT*0.5);
        p.homePosition.z = 0;

        p.position.x = p.homePosition.x;       
        p.position.y = p.homePosition.y;       
    }

    // ------------------------------------

    function recycleParticle(particle) {
        scene.remove(particle);
        var index = activeParticles.indexOf(particle);
        activeParticles.splice(index, 1);
        availableParticles.push(particle);
    }

    // ------------------------------------

    var Particle =  function(options){
        var p = _.extend(new THREE.Mesh(
                standardGeometry,
                standardMaterial.clone()
            ),
            {
                index: 0,
                age: 0,
                lifespan: 2000,
                birthday: startTime,
                peak:255,
                endTime: this.birthday + this.lifespan,
                homePosition: {x:0,y:0,z:0},
                setLevel: setLevel,
                getLevel: getLevel,
                computeGridPosition: computeGridPosition,
                computeSpiralPosition: computeSpiralPosition,
            }, options);
       

        // ------------------------------------

        function setLevel(level){
            if (level > this.getLevel()){
                //reset to new peak
                this.peak = level;
                this.age = 0;
                p.birthday = Date.now();
            }
        }

        function getLevel(){
            return  this.peak * (1 - this.age);
        }

        return p;
    };

    // ------------------------------------

    function updateParticle(p, time, level){
        p.age = (time - p.birthday) / p.lifespan;  

        p.setLevel(level);
        
        if (p.age >= 1){
            // recycleParticle(p);
            p.age = 1;
        }

        // p.position.x = p.homePosition.x + p.age * Math.cos(p.angle) * p.speed;
        // p.position.y = p.homePosition.y + p.age * Math.sin(p.angle) * p.speed;
        p.position.z = (particleDestination.z * (p.peak / 255)) * (1-p.age);
        p.material.opacity = (1-p.age) * 0.12;


        var color = getRGB(colorMap, colorMapData, (p.homePosition.x + WIDTH) * 0.5, (p.homePosition.y+ HEIGHT) * 0.5);
        p.material.color = new THREE.Color(color);
        



        // p.lookAt(camera.position);
    }

    // ------------------------------------

    var startTime = Date.now();
    var ticksPerSecond = 60;
    var millisPerTick = 1000 / ticksPerSecond;
    var now = startTime;
    var animationFrameID = null, updateIntervalID = null;

    function play() {
        if (animationFrameID === null) {
            onAnimationFrame();
        }
        if (updateIntervalID === null){
            updateIntervalID = setInterval(onUpdateInterval, 1000 / 60);
        }
    }

    function stop() {
        cancelAnimationFrame(animationFrameID);
        animationFrameID = null;
        clearInterval(updateIntervalID);
        updateIntervalID = null;
    }

    var fftData;

    function onUpdateInterval(){
        update(Date.now(), streamData);
    }

    function onAnimationFrame() {
        animationFrameID = requestAnimationFrame(onAnimationFrame);
        renderer.render(scene, camera);
    }





    // ----------------------

    var colorMap;
    var colorMapCanvas;
    var colorMapCtx;
    var colorMapData;
    var colorMapOffset = {x:0,y:0};
    var colorMapDrift = {x:0.001,y:0.003};

    function loadColorMap() {
         var imgSrc = "http://www.theorigin.net/silkbrush/img/colormap.png";
     //var imgSrc = "http://www.theorigin.net/silkbrush/img/capsecone.jpg";
        colorMap = new Image();
        colorMap.crossOrigin = "anonymous";
        colorMap.src = imgSrc;
        colorMap.onload = postColorMapLoad;
    }

    function postColorMapLoad(){
        var colorMapCanvas = document.createElement("canvas");
        colorMapCanvas.attributes.height = colorMapCanvas.attributes.width = 100;
        colorMapCtx = colorMapCanvas.getContext("2d");
        colorMapCtx.drawImage(colorMap,0,0, 100, 100);
        colorMapData = colorMapCtx.getImageData(0,0,100,100);
        setupParticles();
    }

    function getRGB(colorMap, colorMapData, x, y){
        var data = colorMapData.data;
        var propX = Math.abs(x / WIDTH) + colorMapOffset.x;
        var propY = Math.abs(y / HEIGHT) + colorMapOffset.y;
        propX %= 1;
        propY %= 1;
        var col = (propX * colorMapData.width) << 2; // multiply by 4 per pixel to account for [r,g,b,a] order
        var row = (propY * colorMapData.height) >> 0; // math.floor
        var rowWidth = colorMapData.width << 2;
        return (data[col + (row * rowWidth) + 0] << 16) | (data[col + (row * rowWidth) + 1] << 8) | data[col + (row * rowWidth) + 2];
    }


    setup();


};




module.exports = Visualizer;