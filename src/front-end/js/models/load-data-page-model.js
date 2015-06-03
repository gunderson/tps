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
	loadBrainData: function(file){

		var promise = $.Deferred();
		var reader = new FileReader();

		promise.done(function(){
			reader.onload = null;
			var data;
			// if the json data doesn't parse we don't want to kill the app
			try{
				data = JSON.parse(reader.result);
				$.when($.get("data/presets.json"), parseData(data))
					.then(function(presetObj, dataObj){
						var presets = presetObj[0];
						var data = dataObj[0];
						var markers = dataObj[1];
						return makeAsyncOp("averageAgainstMarkers")(data, markers);
					})
					.done(function(data){
						console.log("after averageAgainstMarkers", arguments);
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

function constructSong(data){
	


	var preset = data.preset1;



}


function makeAsyncOp(func){
	return function(){
		var args = _.map(arguments, function(a){
			return a;
		});
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
	// find markers in sets
	var findMarkerPromise = makeAsyncOp("findMarkers")(data.alpha);

	// process values
	var processDataPromise = makeAsyncOp("stripMarkers")(data)
		.then(makeAsyncOp("averageLists"))
		.then(makeAsyncOp("squeeze"))
		.then(makeAsyncOp("mapRanges"));

	return $.when(processDataPromise, findMarkerPromise);
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
		function sum(val, memo){
			return memo + val;
		}

		function meanAverage(values){
			var len = values.length;
			return values.reduce(sum, 0) / len;
		}

		for (var key in data){
			for (var i = 0, endi = markers.length - 1; i < endi; i++){
				data[key] = meanAverage(data[key].slice(markers[i], markers[i + 1]));
			}
			if (markers.length === 0){
				data[key] = meanAverage(data[key]);
			}
		}
		return data;
	},
	bellMap: function(values){
		return values.map(function mapToRange(val, min, max){
			return Math.pow(Math.pow(2*val - 1, 4) - Math.pow(2*val - 1, 2) + 1, 4);
		});
	}
});

module.exports = Model;