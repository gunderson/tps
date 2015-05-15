var midi = null;  // global MIDIAccess object

function onMIDISuccess( midiAccess ) {
  console.log( "MIDI ready!" );
  midiAccess.onstatechange = onMIDIStateChange;
  exports.midi = midiAccess;  // store in the global (in real usage, would probably keep in an object instance)
  listInputsAndOutputs(midiAccess);
}

function onMIDIFailure(msg) {
  console.log( "Failed to get MIDI access - " + msg );
}

function onMIDIStateChange(){
  	console.log("onMIDIStateChange", arguments);
}

navigator.requestMIDIAccess().then( onMIDISuccess, onMIDIFailure );

//---------------------------------------------------------------------

function listInputsAndOutputs( midiAccess ) {
	var len = midiAccess.outputs.size;
	for (var i = 0; i < len; i++){
		exports.outputs.push(midiAccess.outputs.values().next().value);
	}
	console.log(exports.outputs);
}

var exports = {
	midi: null,
	inputs: [],
	outputs: []
};

module.exports = exports;