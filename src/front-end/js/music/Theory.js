	var _ = require("underscore");
	require("underscore.arrayAt");
	require("underscore.arrayObus");

	var theory = {
		scale: [
			"a",
			"ab",
			"b",
			"c",
			"cd",
			"d",
			"de",
			"e",
			"f",
			"fg",
			"g",
			"ga"
		],
		scales: {},
		chords: {},
		getRoot:getRoot
	};

	//render chords

	var modes = {
		"major": [0,2,4,5,7,9,11],
		"minor": [0,2,3,5,7,8,10]
	};

	function toNotes(indexMap, root){
		root = theory.scale.indexOf(root);
		return indexMap.map(function(scaleIndex){
			return _.at(theory.scale, root + scaleIndex);
		});
	}

	theory.scale.forEach(function(note){
		theory.scales[note]				= toNotes(modes.major, note);
		theory.scales[note + "m"]		= toNotes(modes.minor, note);
	});

	theory.parseKey = function(key){
		var root = getRoot(key);
		var mode = key.split(root)[1];
		return {
			root: root,
			mode: (mode) ? mode : ""
		};
	};

	function getRoot(key){
		switch (key.length){
			case 1:
				// natural major
				return key;
			case 2:
				if (key.charAt(1) === "m" || key.charAt(1) === "7"){
					// natural minor
					// major 7th
					return key.charAt(0);
				} 
				// accidental major
				return key;
			case 3:
				if (key.charAt(2) === "m"){
					// accidental minor
					return key.substr(0,2);
				} else if (key.charAt(2) === "7"){
					// minor 7th
					return key.charAt(0);
				} 
				// accidental major 7th
				return key.substr(0,2);
			case 4:
				// accidental minor 7th
				return key.substr(0,2);

		}
	}

	var scaleFilters = [
		[0],
		[0,2],
		[0,2,4],
		[0,2,3,4],
		[0,2,3,4,5],
		[0,1,2,3,4,5],
		[0,1,2,3,4,5,6],
		[0,1,2,3,4,5,6,7]
	];

	var startOctave = 1;

	theory.getScale = function(key, resolution, bias){
		key = key || "c";
		bias = bias || 0;
		return _.obus(
			 _.filter(theory.scales[key], function(noteName, index){
				if (scaleFilters[resolution].indexOf(index) > -1) return noteName;
				return false;
			}),
			bias
		);
	};

	theory.findMostFrequentNote = function(key){
		var chords = theory.getChordsFromKey(key);
		chords = chords.map(function(chordName){
			return theory.getNotesInChord(chordName);
		});
		var counts = {};
		chords.forEach(function(notes){
			console.log("notes", notes);
			notes.forEach(function(note){
				counts[note] = (counts[note]) ? counts[note] + 1 : 1;
			});
		});
		return counts;
	};

	function pad(num, minDigits){
		num = num.toString();
		while (num.length < minDigits){
			num = "0" + num;
		}
		return num;
	}
	
module.exports = theory;