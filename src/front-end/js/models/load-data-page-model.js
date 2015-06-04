// globally declared by lib
require("backbone");
require("operative");


var Model = Backbone.Model.extend({
	fetch: function(){
		// short circuit fetching
		var def = $.Deferred();
		_.defer(function(){
			def.resolve();
		});
		return def;
	},
	setAppController: function(appController){
		this.appController = appController;
	},
	loadBrainData: function(file){

		var promise = $.Deferred();
		var reader = new FileReader();

		promise.done(function(){
			reader.onload = null;
			var data;
			// if the json data doesn't parse we don't want to kill the app
			try{
				data = JSON.parse(reader.result);
				$.when($.get("data/presets.json"), $.get("data/markers.json"), parseData(data))
					.then(function(presetObj, markerObj, dataObj){
						var data = dataObj;
						this.presets = presetObj[0];
						//cast marker object as array
						this.markers = arrayify(markerObj[0].v4);
						return makeAsyncOp("averageAgainstMarkers")(data, this.markers);
					}.bind(this))
					.done(function(data){
						constructSong0.bind(this)(data, this.presets.preset0);
					}.bind(this))
					.fail(function(err){
						console.error(err);
					});
			} catch(err){
				console.error(err);
				return;
			}
		}.bind(this));

		reader.onload = function(){
			promise.resolve();
		};
		reader.readAsText(file);
	}
});

function arrayify(obj){
	var arr = [];
	for (var key in obj){
		arr.push(obj[key]);
	}
	return arr;
}

function constructSong0(data, preset){

	var ranges = {
			alpha: [8,  13],
			beta : [13, 30],
			gamma: [30, 70],
			delta: [1,  4],
			theta: [4,  8]
		};
	
	//the following will be very specific to each individual presets

	_.each(preset.scenes, function(scene, i){
		var alpha = data.alpha[i];
		var beta = data.beta[i];
		var delta = data.delta[i];
		var gamma = data.gamma[i];
		var theta = data.theta[i];

		//only change pattern 0
		var components = scene.patterns[0].components;
		// component 0 == master
		// component 1-3 == rhythm oscillators
		// component 4-5 == pitch oscillators
		components[1].frequency = 1 / delta;
		components[2].frequency = theta;
		components[3].frequency = alpha;
		components[4].frequency = beta;
		components[5].frequency = 1 / gamma;
	});
	this.appController.trigger("generate", preset);
	/*
	var preset_ = {
		"playing": false,
		"bpm": 120,
		"beatsPerMeasure": 4,
		"currentSceneId": 0,
		"loop": false,
		"tracks": [
			{
				"instrument": {
					"name": "prophet_3"
				},
				"trackId": 0,
				"solo": false,
				"mute": false
			}
		],
		"scenes": [
			{
				"sceneId": 0,
				"patterns": [
					{
						"trackId": 0,
						"sceneId": 0,
						"track": 0,
						"scene": 0,
						"url": "",
						"measureLength": 1,
						"components": [
							{
								"x": 292,
								"y": -257,
								"defaultValue": 1,
								"ports": [
									{
										"control": "rhythm",
										"type": "input",
										"id": "i_85",
										"partner": null,
										"defaultValue": 0,
										"partnerPort": "o_104"
									},
									{
										"control": "pitch",
										"type": "input",
										"id": "i_86",
										"partner": null,
										"defaultValue": 0,
										"partnerPort": "o_133"
									},
									{
										"control": "duration",
										"type": "input",
										"id": "i_87",
										"partner": null,
										"defaultValue": 1
									}
								],
								"type": "master",
								"threshold": 0.5,
								"scene": 0
							},
							{
								"x": -7,
								"y": -307,
								"defaultValue": 1,
								"type": "oscillator",
								"mode": "cos",
								"ports": [
									{
										"control": "add",
										"type": "input",
										"id": "i_102",
										"partner": null,
										"defaultValue": 0,
										"partnerPort": "o_114"
									},
									{
										"control": "multiply",
										"type": "input",
										"id": "i_103",
										"partner": null,
										"defaultValue": 1
									},
									{
										"id": "o_104",
										"type": "output",
										"partner": null,
										"partnerPort": "i_85"
									}
								],
								"amplitude": 0.5,
								"frequency": 1,
								"offset": 0,
								"scene": 0
							},
							{
								"x": -240,
								"y": -307,
								"defaultValue": 1,
								"type": "oscillator",
								"mode": "cos",
								"ports": [
									{
										"control": "add",
										"type": "input",
										"id": "i_112",
										"partner": null,
										"defaultValue": 0
									},
									{
										"control": "multiply",
										"type": "input",
										"id": "i_113",
										"partner": null,
										"defaultValue": 1,
										"partnerPort": "o_124"
									},
									{
										"id": "o_114",
										"type": "output",
										"partner": null,
										"partnerPort": "i_102"
									}
								],
								"amplitude": 0.5,
								"frequency": 1,
								"offset": 0,
								"scene": 0
							},
							{
								"x": -461,
								"y": -304,
								"defaultValue": 1,
								"type": "oscillator",
								"mode": "cos",
								"ports": [
									{
										"control": "add",
										"type": "input",
										"id": "i_122",
										"partner": null,
										"defaultValue": 0
									},
									{
										"control": "multiply",
										"type": "input",
										"id": "i_123",
										"partner": null,
										"defaultValue": 1
									},
									{
										"id": "o_124",
										"type": "output",
										"partner": null,
										"partnerPort": "i_113"
									}
								],
								"amplitude": 1,
								"frequency": 0.71,
								"offset": 0,
								"scene": 0
							},
							{
								"x": 3,
								"y": -113,
								"defaultValue": 1,
								"type": "oscillator",
								"mode": "cos",
								"ports": [
									{
										"control": "add",
										"type": "input",
										"id": "i_131",
										"partner": null,
										"defaultValue": 0
									},
									{
										"control": "multiply",
										"type": "input",
										"id": "i_132",
										"partner": null,
										"defaultValue": 1,
										"partnerPort": "o_142"
									},
									{
										"id": "o_133",
										"type": "output",
										"partner": null,
										"partnerPort": "i_86"
									}
								],
								"amplitude": 0.99,
								"frequency": 1,
								"offset": 0,
								"scene": 0
							},
							{
								"x": -197,
								"y": -115,
								"defaultValue": 1,
								"type": "oscillator",
								"mode": "cos",
								"ports": [
									{
										"control": "add",
										"type": "input",
										"id": "i_140",
										"partner": null,
										"defaultValue": 0
									},
									{
										"control": "multiply",
										"type": "input",
										"id": "i_141",
										"partner": null,
										"defaultValue": 1
									},
									{
										"id": "o_142",
										"type": "output",
										"partner": null,
										"partnerPort": "i_132"
									}
								],
								"amplitude": 1,
								"frequency": 0.81,
								"offset": 0,
								"scene": 0
							}
						],
						"connections": [
							{
								"input": "i_85",
								"output": "o_104",
								"patternId": null
							},
							{
								"input": "i_102",
								"output": "o_114",
								"patternId": null
							},
							{
								"input": "i_86",
								"output": "o_133",
								"patternId": null
							},
							{
								"input": "i_132",
								"output": "o_142",
								"patternId": null
							},
							{
								"input": "i_113",
								"output": "o_124",
								"patternId": null
							}
						],
						"length": 4,
						"executeCopy": false,
						"copyRequest": null,
						"key": "dm",
						"sixteenths": [],
						"availableNotes": [
							"d4",
							"e4",
							"f4",
							"g4",
							"a5",
							"ab5",
							"d5",
							"e5",
							"f5",
							"g5",
							"a6",
							"ab6",
							"d6",
							"e6",
							"f6",
							"g6",
							"a7",
							"ab7"
						],
						"scaleBias": 0,
						"scaleResolution": 5,
						"numOctaves": 3,
						"baseOctave": 4,
						"threshold": 0.5,
						"tickWidth": null
					}
				],
				"ticksPerBeat": 128,
				"beatsPerMeasure": 4,
				"key": "dm",
				"currentMeasure": 0,
				"maxNumMeasures": 4,
				"active": false,
				"repeat": 1,
				"tickWidth": 0.04908738521234052
			}
		],
		"nextSceneId": null,
		"repeat": 1,
		"copyRequest": null
	}
*/

}


function makeAsyncOp(func){
	return function(){
		var args = Array.prototype.slice.call(arguments);
		var promise = $.Deferred();
			asyncOp[func].apply(this, args.concat(
					function(result){
						promise.resolve(result);
						return result;
					}
				)
			);
			return promise;
		};
}

function parseData(data){
	// process values
	var processDataPromise = makeAsyncOp("stripMarkers")(data)
		.then(makeAsyncOp("averageLists"))
		// .then(makeAsyncOp("squeeze"))
		.then(makeAsyncOp("mapRanges"));

	return $.when(processDataPromise);
}

var asyncOp = operative({
	findMarkers: function(alphaWaves){
		var markerPositions = [];
		var currentMarker = alphaWaves[0][0];
		alphaWaves.forEach(function(datapoint){
			if (datapoint[0] !== currentMarker){
				currentMarker = datapoint[0];
				markerPositions.push(i);
			}
		});
		return markerPositions;
	},
	map: function(){

	},
	stripMarkers: function(data){
		function stripFirst(arr){
			return arr.slice(1);
		}

		for (var key in data){
			data[key] = data[key].map(stripFirst);
		}
		return data;
	},
	meanAverage: function (values){
		var len = values.length;
		return values.reduce(sum, 0) / len;
	},
	averageLists: function(data){

		function sum(val, memo){
			return memo + val;
		}

		function meanAverage(values){
			var len = values.length;
			return values.reduce(sum, 0) / len;
		}

		for (var key in data){
			data[key] = data[key].map(meanAverage);
		}
		return data;
	},
	squeeze: function(data, factor){
		// intentionally reject 0
		factor = Math.abs(factor) || 2;

		function doSqueeze(val){
			if (val < 0.5) return 0.5 * Math.pow(val * 2, factor);
			if (val >= 0.5) return 0.5 * Math.pow((val - 0.5) * 2, 1 / factor) + 0.5;
		}

		for (var key in data){
			data[key] = data[key].map(doSqueeze);
		}
		return data;
	},
	mapRanges: function(data){
		var ranges = {
			alpha: [8,  13],
			beta : [13, 30],
			gamma: [30, 70],
			delta: [1,  4],
			theta: [4,  8]
		};

		function mapToRange(val){
			//key is scoped to the containing function
			var min = ranges[key][0];
			var max = ranges[key][1];
			return (val * (max - min)) + min;
		}

		for (var key in data){
			data[key] = data[key].map(mapToRange);
		}
		return data;
	},
	averageAgainstMarkers: function(data, markers){	
		// console.log("top averageAgainstMarkers", data, markers);


		var currentMarker = 0;
		function sum(val, memo){
			return memo + val;
		}

		function meanAverage(values){
			var len = values.length;
			return values.reduce(sum, 0) / len;
		}

		var averaged = {};

		for (var key in data){
			averaged[key] = [];
			currentMarker = 0;
			for (var i = 0, endi = markers.length; i < endi; i++){
				// markers are in seconds ,  but they are recorded at 10 hz
				// so we have to multiply the deltaTime * 10 to count the delta numbers of markers
				var endMarker = currentMarker + markers[i].deltaTime * 10;
				averaged[key][i] = meanAverage(data[key].slice(currentMarker, endMarker));
				currentMarker = endMarker;
			}
			if (markers.length === 0){
				averaged[key][0] = meanAverage(data[key]);
			}
		}

		// console.log("bottom averageAgainstMarkers", averaged);

		return averaged;
	},
	bellMap: function(values){
		return values.map(function mapToRange(val, min, max){
			return Math.pow(Math.pow(2*val - 1, 4) - Math.pow(2*val - 1, 2) + 1, 4);
		});
	}
});

module.exports = Model;