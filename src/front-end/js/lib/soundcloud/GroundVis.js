var _ = require("underscore");
var THREE = require("three.js");
require("underscore.filledArray");


var prefixMethod = require("../prefixmethod");
prefixMethod("requestAnimationFrame");
prefixMethod("cancelAnimationFrame");



var Visualizer = function(options) {

	var THE_ORIGIN = new THREE.Vector3(0, 0, 0);
	Math.PHI = 2.399963229728653;
	Math.TAU = 2 * Math.PI;

	this.setup = setup;
	this.update = update;
	this.render = render;
	this.reset = reset;
	this.setSize = setSize;
	this.renderer = null;
	this.fftSize = 32;


	var renderer,
		WIDTH = 720,
		HEIGHT = 420,
		tick = 0,
		prevTick = -1;


	function update(fftData, time, _tick) {
		tick = _tick;
		var tickDelta = tick - prevTick;

		colorMapOffset.x += tickDelta * colorMapDrift.x;
		colorMapOffset.y += tickDelta * colorMapDrift.y;

		var segs = Math.floor(fftData.length / this.fftSize);

		fftData = _.map(_.range(this.fftSize), function(i) {
			return _.reduce(fftData.slice(i * segs, (i + 1) * segs), function(a, b) {
				return a + b;
			}, 0) / segs;
		});



		var lastRing = _.chain(activeParticles)

		.each(function(p) {
				updateParticle(p, tick, p.layerIndex === numLayers ? fftData[p.positionIndex] : 0);
			})
			.value();


		// var cameraTick = Math.PI * 2 * ((tick % 2048) / 2048);
		// camera.rotation.z =  cameraTick;
		// camera.position.x = Math.cos(cameraTick) * WIDTH * 0.125
		// camera.position.y = Math.sin(cameraTick) * HEIGHT * 0.125
		// camera.lookAt(center);
		prevTick = tick;



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
	}


	function render() {
		renderer.render(scene, camera);
	}

	// ------------------------------------

	var center, particleDestination;

	// set some camera attributes
	var VIEW_ANGLE, ASPECT, NEAR, FAR;

	// get the DOM element to attach to
	var camera, scene;

	var standardGeometry;

	function setup() {
		activeParticles.forEach(recycleParticle);
		// set the scene size
		center = new THREE.Vector3(0, 0, 0);
		particleDestination = new THREE.Vector3(0, 0, 4000);

		// set some camera attributes
		VIEW_ANGLE = 40;
		ASPECT = WIDTH / HEIGHT;
		NEAR = 0.01;
		FAR = 10000;

		// create a WebGL renderer, camera
		// and a scene
		renderer = options.renderer || new THREE.WebGLRenderer({
			preserveDrawingBuffer: true
		});
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
		camera.position.z = 2200;
		camera.lookAt(new THREE.Vector3(0, 0, 0));

		// add the camera to the scene
		scene.add(camera);

		// add light to the scene
		var light = new THREE.AmbientLight(0xffffff); // soft white light
		scene.add(light);

		standardGeometry = new THREE.CylinderGeometry(
			200, // upper radius
			200, // lower radius
			450, // height
			4 // segments
		);
		standardGeometry.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI / 2));


		// start the renderer
		renderer.setSize(WIDTH, HEIGHT);

		loadColorMap();
		return this;
	}


	// create the sphere's material
	var standardMaterial = new THREE.MeshLambertMaterial({
		color: 0xffffff,
		transparent: true,
		blending: THREE.AdditiveBlending,
		opacity: 0,

	});


	function setSize(WIDTH, HEIGHT) {
		camera.aspect = WIDTH / HEIGHT;
		renderer.setSize(WIDTH, HEIGHT);
		renderer.domElement.width = WIDTH;
		renderer.domElement.height = HEIGHT;
	}

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
		newParticles.forEach(function(p) {
			// setupParticle(p, options);
			scene.add(p);
		});
		activeParticles = activeParticles.concat(newParticles);
		return newParticles;
	}

	// ------------------------------------

	var rows = 32,
		cols = 32,
		totalChannels = rows * cols;

	function setupParticles() {
		getParticles(numLayers * particlesPerLayer, {
				birthday: tick
			})
			.forEach(function(p, i) {
				setupParticle(p, {
					index: i
				});
			});
	}

	// ------------------------------------

	function setupParticle(particle, options) {
		var p = _.extend(particle, options);
		p.geometry.dynamic = true;

		// changes to the vertices
		p.geometry.verticesNeedUpdate = true;

		// changes to the normals
		p.geometry.normalsNeedUpdate = true;

		// assign particles to home positions
		// p.computeGridPosition(cols, rows);
		// p.computeSpiralGridPosition(cols, rows);
		// p.computeSpiralPosition();
		// p.computeRingPosition();
		p.computeGroundPosition();

		// p.lookAt(new THREE.Vector3(0, p.index * ringDepth, 0));

		// p.angle = Math.atan2(p.homePosition.y, p.homePosition.x);
		p.speed = -100;

		var color = getRGB(colorMap, colorMapData, p.homePosition.x * 2, p.homePosition.y * 2);
		p.material.color = new THREE.Color(color);
	}

	function resizeParticle(p) {}

	// ------------------------------------

	var particlesPerLayer = 48;
	var numLayers = 32;
	var layerSize = 1800;
	var particleDistance = layerSize / particlesPerLayer;
	var layerDepth = 800 / numLayers;

	var buffers = _.map(_.range(numLayers), function() {
		return _.filledArray(particlesPerLayer);
	});

	function computeGroundPosition() {
		var p = this;

		p.positionIndex = p.index % particlesPerLayer;
		p.layerIndex = Math.floor(p.index / particlesPerLayer);

		p.top = p.positionIndex % 2 === 1 ? 1 : -1;
		var dir = p.positionIndex % 4 < 2 ? 1 : -1;

		p.homePosition = new THREE.Vector3(
			dir * particleDistance * p.positionIndex + 5 * Math.cos(Math.TAU * p.layerIndex / numLayers),
			400 * p.top,
			p.ringIndex * layerDepth
		);


		p.position.x = p.homePosition.x;
		p.position.y = p.homePosition.y;
		p.position.z = p.homePosition.z;
	}


	function computeRingPosition() {
		var p = this;

		p.positionIndex = p.index % particlesPerLayer;
		p.angle = p.positionIndex * Math.TAU * 2.5 / particlesPerLayer;
		p.ringIndex = Math.floor(p.index / particlesPerLayer);

		p.homePosition = new THREE.Vector3(
			Math.cos(p.angle) * ringRadius * 2,
			Math.sin(p.angle) * ringRadius,
			p.ringIndex * layerDepth
		);


		p.position.x = p.homePosition.x;
		p.position.y = p.homePosition.y;
		p.position.z = p.homePosition.z;

	}

	// ------------------------------------


	var spiralStartIndex = 0;

	function computeSpiralPosition() {
		var finalRadius = Math.sqrt(activeParticles.length + spiralStartIndex);
		var p = this;

		var angle = p.index * Math.PHI; //Golden angle relative to TWO_PI

		p.homePosition = new THREE.Vector3(
			Math.cos(angle) * Math.sqrt(p.index + spiralStartIndex) * 2 * (720 / finalRadius),
			Math.sin(angle) * Math.sqrt(p.index + spiralStartIndex) * 2 * (480 / finalRadius),
			0
		);

		// console.table(p.homePosition)

		p.position.x = p.homePosition.x;
		p.position.y = p.homePosition.y;
	}

	// ------------------------------------

	function computeGridPosition(cols, rows) {
		var p = this;
		p.gridPosition = {
			x: p.index % cols,
			y: Math.floor(p.index / cols),
			z: 0
		};
		p.homePosition.x = ((p.gridPosition.x / cols) * WIDTH) - (WIDTH * 0.5);
		p.homePosition.y = ((p.gridPosition.y / rows) * HEIGHT) - (HEIGHT * 0.5);
		p.homePosition.z = 0;

		p.position.x = p.homePosition.x;
		p.position.y = p.homePosition.y;
		p.position.z = p.particleDestination.z;
	}

	// ------------------------------------

	var currentGridPosition = {
		x: (cols / 2) - 1,
		y: (rows / 2) - 1
	};
	var sideIndex = 0;
	var sideLength = 1;
	var sidePosition = 0;


	// ------------------------------------

	function computeSpiralGridPosition(cols, rows) {
		var p = this;
		switch (sideIndex) {
			case 0:
				p.gridPosition = _.extend({}, currentGridPosition);
				currentGridPosition.x++;
				report();
				if (++sidePosition >= sideLength) {
					sidePosition = 0;
					sideIndex++;
				}
				break;
			case 1:
				p.gridPosition = _.extend({}, currentGridPosition);
				currentGridPosition.y++;
				report();
				if (++sidePosition >= sideLength) {
					sidePosition = 0;
					sideIndex++;
				}
				break;
			case 2:
				p.gridPosition = _.extend({}, currentGridPosition);
				currentGridPosition.x--;
				report();
				if (++sidePosition >= sideLength) {
					sidePosition = 0;
					sideIndex++;
				}
				break;
			case 3:
				p.gridPosition = _.extend({}, currentGridPosition);
				currentGridPosition.y--;
				report();
				if (++sidePosition >= sideLength) {
					sidePosition = 0;
					sideIndex = 0;
					currentGridPosition.x--;
					currentGridPosition.y--;
					sideLength += 2;
				}

				break;
		}


		p.homePosition.x = ((p.gridPosition.x / cols) * 3200) - (3200 / 2);
		p.homePosition.y = ((p.gridPosition.y / rows) * 1800) - (1800 / 2);
		p.homePosition.z = 0;


		p.position.x = p.homePosition.x;
		p.position.y = p.homePosition.y;
		p.position.z = particleDestination.z;

		function report() {
			// console.log({index: p.index, sideIndex: sideIndex, sidePosition: sidePosition, sideLength: sideLength}, currentGridPosition);
		}
	}

	// ------------------------------------

	function recycleParticle(particle) {
		scene.remove(particle);
		var index = activeParticles.indexOf(particle);
		activeParticles.splice(index, 1);
		availableParticles.push(particle);
	}

	// ------------------------------------

	var Particle = function(options) {
		var p = _.extend(new THREE.Mesh(
			standardGeometry,
			standardMaterial.clone()
		), {
			index: 0,
			age: 1,
			lifespan: numLayers,
			birthday: tick,
			peak: 0,
			endTime: this.birthday + this.lifespan,
			homePosition: {
				x: 0,
				y: 0,
				z: 0
			},
			setLevel: setLevel,
			getLevel: getLevel,
			// computeGridPosition: computeGridPosition,
			// computeSpiralPosition: computeSpiralPosition,
			// computeSpiralGridPosition: computeSpiralGridPosition,
			// computeRingPosition: computeRingPosition,
			computeGroundPosition: computeGroundPosition
		}, options);


		// ------------------------------------

		function setLevel(level) {
			if (level > this.getLevel()) {
				//reset to new peak
				this.peak = level;
				this.age = 0;
				p.birthday = tick;
			}
		}

		function getLevel() {
			return this.peak * (1 - this.age);
		}

		return p;
	};

	// ------------------------------------

	function updateParticle(p, tick, level) {
		p.setLevel(level);
		p.age = (tick - p.birthday) / p.lifespan;
		var height = 450;
		var peakLevel = p.peak / 255;



		p.layerIndex = p.layerIndex - 1 >= 0 ? p.layerIndex - 1 : numLayers;

		if (p.age === 0) {

			var scale = 1.65 * (peakLevel + 0.01);
			// scale = Math.pow(scale, 0.25);
			p.scale.set(1, scale, 1);
			// p.position.y = p.homePosition.y;
			p.position.y = ((-p.top * scale * height * 0.5) + p.homePosition.y);
			p.position.x = p.homePosition.x;
			// p.position.y = p.homePosition.y;
		}



		p.position.z = p.layerIndex * layerDepth;

		// less opaque with age
		// less opaque with higher index

		p.material.opacity = 0.1 * Math.pow(peakLevel, 0.5);


		var color = getRGB(colorMap, colorMapData, (p.homePosition.x + p.position.z) * 0.15, (p.homePosition.y + p.position.z) * 0.15);
		p.material.color = new THREE.Color(color);



		// p.lookAt(camera.position);
	}

	// ------------------------------------


	function reset() {
		activeParticles.forEach(function(p) {
			p.age = 0;
			p.birthday = 0;
			p.level = 0;
		});
	}



	// ----------------------

	var colorMap;
	var colorMapCanvas;
	var colorMapCtx;
	var colorMapData;
	var colorMapOffset = {
		x: 0,
		y: 0
	};
	var colorMapDrift = {
		x: 0.001,
		y: 0.0012
	};

	function loadColorMap() {
		// var imgSrc = "http://www.theorigin.net/participlejs/img/colormap0.jpg";
		var imgSrc = "http://www.theorigin.net/silkbrush/img/colormap.png";
		// var imgSrc = "http://www.theorigin.net/silkbrush/img/comp54.jpg";
		// var imgSrc = "assets/images/colormap_1.jpg";
		// var imgSrc = "/assets/images/colormap_0.jpg";
		// var imgSrc = "/assets/images/colormap_4.jpg";
		// var imgSrc = "http://www.theorigin.net/silkbrush/img/capsecone.jpg";
		colorMap = new Image();
		colorMap.crossOrigin = "anonymous";
		colorMap.src = imgSrc;
		colorMap.onload = postColorMapLoad;
	}

	function postColorMapLoad() {
		var colorMapCanvas = document.createElement("canvas");
		colorMapCanvas.attributes.height = colorMapCanvas.attributes.width = 100;
		colorMapCtx = colorMapCanvas.getContext("2d");
		colorMapCtx.drawImage(colorMap, 0, 0, 100, 100);
		colorMapData = colorMapCtx.getImageData(0, 0, 100, 100);
		setupParticles();
	}

	function getRGB(colorMap, colorMapData, x, y) {
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


	setup.call(this);
	return this;

};



module.exports = Visualizer;
