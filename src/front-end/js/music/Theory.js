	var _ = require("underscore");
	require("underscore.arrayAt");

	var theory = {
		audioPath: "sound/piano/",
		octaveRange: 4,
		numNotes: 64,
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
		chords: {
			"a": ["a","cd","e"],
			"b": ["b","de","fg"],
			"c": ["c","e","g"],
			"d": ["d","fg","a"],
			"e": ["e","ga","b"],
			"f": ["f","a","c"],
			"g": ["g","b","d"],

			"ab": ["ab","d","e"],
			"cd": ["cd","f","a"],
			"de": ["de","g","ab"],
			"fg": ["fg","ab","cd"],
			"ga": ["ga","c","de"],

			"am": ["a","c","e"],
			"bm": ["b","d","fg"],
			"cm": ["c","de","g"],
			"dm": ["d","f","a"],
			"em": ["g","e","b"],
			"fm": ["f","ga","c"],
			"gm": ["g","ab","d"],

			"abm": ["ab","cd","f"],
			"cdm": ["cd","e","ga"],
			"dem": ["de","fg","ab"],
			"fgm": ["fg","a","cd"],
			"gam": ["ga","b","de"],

			"a7": ["a","cd","e","ga"],
			"b7": ["b","de","fg","ab"],
			"c7": ["c","e","g","b"],
			"d7": ["d","fg","a","cd"],
			"e7": ["g","ef","b","a"],
			"f7": ["f","a","c","e"],
			"g7": ["g","b","d","fg"],
		}
	};

	//render chords

	theory.scale.forEach(function(note){
		theory.chords[note]				= major(note);
		theory.chords[note + "7"]		= seventh(note);
		theory.chords[note + 'm']		= minor(note);
		theory.chords[note + 'maj7']	= maj7th(note);
		theory.chords[note + 'm7']		= minor7th(note);
		theory.chords[note + 'aug']		= aug(note);
		theory.chords[note + 'aug7']	= aug7th(note);
	});

	function major(key){
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		return [
			s[rootIndex],
			s[(rootIndex + 4) % s.length],
			s[(rootIndex + 7) % s.length]
		];
	}

	function minor(key){
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		return [
			s[rootIndex],
			s[(rootIndex + 3) % s.length],
			s[(rootIndex + 7) % s.length]
		];
	}

	function seventh(key){
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		var chord = major(key);
		chord.push(s[(rootIndex + 10) % s.length]);
		return chord;
	}

	function maj7th(key){
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		var chord = major(key);
		chord.push(s[(rootIndex + 11) % s.length]);
		return chord;
	}

	function minor7th(key){
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		var chord = minor(key);
		chord.push(s[(rootIndex + 10) % s.length]);
		return chord;
	}

	function aug(key){
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		return [
			s[rootIndex],
			s[(rootIndex + 4) % s.length],
			s[(rootIndex + 8) % s.length]
		];
	}

	function aug7th(key){
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		var chord = aug(key);
		chord.push(s[(rootIndex + 11) % s.length]);
		return chord;
	}

	var startOctave = 1;

	theory.getNotesInChord = function(chordName){
		var notesInChord = [];
		var chord = theory.chords[chordName];
		if (!chord) console.error("Chord Not Found: " + chordName, theory.chords);
		return chord;
	};

	theory.getScaleFromKey = function(key){
		key = key || "f";
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		var minor = key.slice -1 === "m";
		if (!minor){
			return [
				key,
				_.at(s, rootIndex + 2),
				_.at(s, rootIndex + 4),
				// _.at(s, rootIndex + 5),
				_.at(s, rootIndex + 7),
				_.at(s, rootIndex + 9),
				// _.at(s, rootIndex + 11),
			]
		} else {
			return [
				key,
				_.at(s, rootIndex + 2),
				_.at(s, rootIndex + 3),
				_.at(s, rootIndex + 5),
				_.at(s, rootIndex + 7),
				_.at(s, rootIndex + 8),
				_.at(s, rootIndex + 10),
			]
		}
	}


	theory.getChordsFromKey = function(key, minor){
		key = key || "f";
		var s = theory.scale;
		var rootIndex = s.indexOf(key);
		if (!minor){
			return [
				key,
				_.at(s, rootIndex + 2) + "m",
				_.at(s, rootIndex + 4) + "m",
				_.at(s, rootIndex + 5),
				_.at(s, rootIndex + 7),
				_.at(s, rootIndex + 9) + "m"
			];
		} else {
			return [
				key,
				_.at(s, rootIndex + 2) + "m",
				_.at(s, rootIndex + 4) + "m",
				_.at(s, rootIndex + 5),
				_.at(s, rootIndex + 7),
				_.at(s, rootIndex + 9) + "m"
			];
		}
	}

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
	}

	theory.getNextChordFromMap = function(key, currentChord){

	}

	function pad(num, minDigits){
		num = num.toString();
		while (num.length < minDigits){
			num = "0" + num;
		}
		return num;
	}
modules.exports = theory;