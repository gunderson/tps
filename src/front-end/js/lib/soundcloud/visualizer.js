var _ = require("underscore");
var THREE = require("three.js");


var prefixMethod = require("./prefixmethod");
prefixMethod("requestAnimationFrame");
prefixMethod("cancelAnimationFrame");


var Visualizer = function(options) {
    var audioSource = options.audioSource;
    var canvas = container = options.canvas;
    var ctx = canvas.getContext("2d");
    var loopFrame;
    var streamData = new Uint8Array(255);
    var prevStreamData = new Uint8Array(255);
    var prevStreamData2 = new Uint8Array(255);
    var isPlaying = false;
    var inc = 0;
    this.play = function(){
        play();
        // if (!isPlaying){
        //     isPlaying = true;
        //     loop();
        // }
    };

    this.stop = function(){
        stop();
        // isPlaying = false;
        // if (loopFrame){
        //     cancelAnimationFrame(loopFrame);
        // }
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
            // $.get("http://localhost:3030/pulse/trigger/3");
        }
        i = 0x20;
        if (prevStreamData2[i] < prevStreamData[i] && prevStreamData[i] > streamData[i]){
            // $.get("http://localhost:3030/pulse/trigger/4");
        }
    }

    function loop(){
        update();
        draw();
        if (isPlaying) requestAnimationFrame(loop);
    }

    setup();

};


// ------------------------------------

var WIDTH,HEIGHT,center,particleDestination;

// set some camera attributes
var VIEW_ANGLE,ASPECT,NEAR,FAR;

// get the DOM element to attach to
var container, renderer, camera, scene;


function setup(){
    // set the scene size
    WIDTH = container.offsetWidth;
    HEIGHT = container.offsetHeight;
    center = new THREE.Vector3(0, 0, 0);
    particleDestination = new THREE.Vector3(0, 0, 800);

    // set some camera attributes
    VIEW_ANGLE = 100;
    ASPECT = WIDTH / HEIGHT;
    NEAR = 0.01;
    FAR = 1200;

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
    camera.position.z = 900;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // add the camera to the scene
    scene.add(camera);
    pointLight.position = camera.position;



    // add light to the scene
    scene.add(pointLight);

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
    opacity: 0.10,

});

var standardGeometry = new THREE.CylinderGeometry(
        (WIDTH + HEIGHT) * 0.075, // upper radius
        (WIDTH + HEIGHT) * 0.075, // lower radius
        100, // height
        3 // segments
);
standardGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

// create a point light
var pointLight = new THREE.PointLight(0xFFFFFF);

// set its position
pointLight.position.x = 0;
pointLight.position.y = 400;
pointLight.position.z = 1000;



// ------------------------------------

// create object pool
var availableParticles = [];
var activeParticles = [];


// ------------------------------------

function getParticles(quantity, options) {
    quantity = quantity || 1;
    while (availableParticles.length < quantity) {
        availableParticles.push(spawnParticle());
    }
    var newParticles = availableParticles.splice(0, quantity);
    newParticles.forEach(function(p){
        setupParticle(p, options);
        scene.add(p);
    });
    activeParticles = activeParticles.concat(newParticles);
    return newParticles;
}

// ------------------------------------

function setupParticle(particle, options){
    particle = _.extend(particle, options);
    particle.geometry.dynamic = true;

    // changes to the vertices
    particle.geometry.verticesNeedUpdate = true;

    // changes to the normals
    particle.geometry.normalsNeedUpdate = true;
    var rX = Math.random()
    var rY = Math.random()
    var x = (rX * WIDTH) - (WIDTH*0.5);
    var y = (rY * HEIGHT) - (HEIGHT*0.5);
    particle.position.x = x;
    particle.position.y = y;
    particle.angle = Math.atan2(y, x);
    particle.speed = 0;
    
    var color = getRGB(colorMap, colorMapData, x + WIDTH*0.5, y + HEIGHT*0.5);
    particle.material.color = new THREE.Color(color);
}

// ------------------------------------

function recycleParticle(particle) {
    scene.remove(particle);
    var index = activeParticles.indexOf(particle);
    activeParticles.splice(index, 1);
    availableParticles.push(particle);
}

// ------------------------------------

function spawnParticle(options) {
    var particle =  _.extend(new THREE.Mesh(
                standardGeometry,
                standardMaterial.clone()
        ),
        {
            age: 0,
            lifespan: 2000,
            birthday: startTime
        }, options
    );
    particle.endTime = particle.birthday + particle.lifespan;
    return particle;
}

// ------------------------------------

function updateParticle(p, time){
    p.age = (time - p.birthday) / p.lifespan;   
    p.position.x += Math.cos(p.angle) * p.speed;
    p.position.y += Math.sin(p.angle) * p.speed;
    p.position.z = particleDestination.z * p.age;
    p.lookAt(camera.position)
    if (p.age > 1){
        recycleParticle(p);
    }
}

// ------------------------------------

var startTime = Date.now();
var ticksPerSecond = 60;
var millisPerTick = 1000 / ticksPerSecond;
var now = startTime;
var afID;

function play() {
    if (afID) return;
    onAnimationFrame();
}

function stop() {
    cancelAnimationFrame(afID);
    afID = null;
}

function onAnimationFrame() {
    update(Date.now() - startTime);
    afID = requestAnimationFrame(onAnimationFrame);
    renderer.render(scene, camera);
}



// ------------------------------------

var tick = 0;
var prevTick = -1;

function update(time) {
    tick = time / millisPerTick;
    if (prevTick != tick){
        getParticles(30, {birthday: time});
    }
    activeParticles.forEach(function(p){
        updateParticle(p, time);
    });
    var cameraTick = Math.PI * 2 * ((tick % 1080) / 1080)
    //camera.rotation.z =  cameraTick
    //camera.position.x = Math.cos(cameraTick) * WIDTH * 0.25
    //camera.position.y = Math.sin(cameraTick) * HEIGHT * 0.25
    //camera.lookAt(center);
    prevTick = tick;
}

// ----------------------

var colorMap;
var colorMapCanvas;
var colorMapCtx;
var colorMapData;
function loadColorMap() {
    var imgSrc = "http://www.theorigin.net/silkbrush/img/colormap.png";
//  var imgSrc = "http://www.theorigin.net/silkbrush/img/capsecone.jpg";
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
    colorMapData = colorMapCtx.getImageData(0,0,100,100)
    play();
}

function getRGB(colorMap, colorMapData, x, y){
    var data = colorMapData.data;
    var propX = x / WIDTH;
    var propY = y / HEIGHT;
    var col = (propX * colorMapData.width) << 2;
    var row = (propY * colorMapData.height) >> 0;
    var rowWidth = colorMapData.width << 2
    return (data[col + (row * rowWidth) + 0] << 16) | (data[col + (row * rowWidth) + 1] << 8) | data[col + (row * rowWidth) + 2];
}



module.exports = Visualizer;