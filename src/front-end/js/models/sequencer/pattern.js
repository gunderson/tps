require("backbone");
var _						= require("underscore");
var FilterModel				= require("./components/filter-model");
var MasterModel				= require("./components/master-model");
var OscillatorModel			= require("./components/oscillator-model");
var UserPatternModel		= require("./components/user-pattern-model");
var SplitterModel			= require("./components/splitter-model");
var ConnectionsCollection	= require("../../collections/sequencer/connections-collection");
var ComponentsCollection	= require("../../collections/sequencer/components-collection");
var Snap					= require("snapsvg");
var Theory					= require("../../music/Theory");

var PatternModel = Backbone.Model.extend({
	defaults: function(){
		var connectionsCollection = new ConnectionsCollection();
		var settings = {
			url						: "",
			scene					: null,
			track					: null,
			measureLength			: 1,
			components				: new ComponentsCollection([
				new MasterModel({
					connectionsCollection	:connectionsCollection,
					pattern					: this
				})
			]),
			connections				: connectionsCollection,
			numMeasures				: 4,
			sixteenths				:[],
			availableNotes			: null,
			scaleBias				: 0, //offsets the first note available
			scaleResolution			: 5, // number of notes per octave available to this pattern
			numOctaves				: 3, // how many octaves are available
			baseOctave				: 2 //index of the first octave
		};
		settings.tickWidth = (Math.PI * 2) / settings.ticksPerBeat;
		return settings;
	},
	initialize: function(){
		this.master = this.get("components").at(0).setupCollection();
		this.listenTo(this.get("components"), "remove", this.destroyConnections);
		this.listenTo(this.get("components"), "connection-request", this.onConnectionRequest);
		this.listenTo(this.get("components"), "change:values remove connection-response", this.getValues);
		this.on("change:scene", this.onChangeScene, this);
		this.on("change:baseOctave change:scaleBias change:numOctaves change:scaleResolution change:numMeasures", this.getValues, this);
		// this.on("change:numMeasures");
		this.getValues();
	},
	export: function(){

	},
	import: function(){

	},
	getValues: function(){
		this.master.getValues();
		var rhythm = this.getRhythm();
		var pitches = this.getPitches(rhythm);
		return pitches;
	},
	// override fetch() since this doesn't need to get page info from server
	fetch: function(){
		// create a promise to send back since calling fetch() expects a promise to be returned
		var promise = $.Deferred();
		// resolve the promise after the current stack clears
		this.getNotes();
		_.defer(function(){
			promise.resolve();
		});
		return promise;
	},
	onChangeScene: function(){
		this.onChangePatternLength();
	},
	onChangePatternLength: function(){
		var sixteenths = [];
		var scene = this.get("scene");
		var targetLength = 4 * scene.get("beatsPerMeasure") * this.get("measuresPerPhrase");
		//recalculate notes
		while(sixteenths.length < targetLength){
			sixteenths.push(-1);
		}
		var notePositions = this.getPitches(this.getRhythm());

	},
	onDeleteTrack: function(){
		//delete all components
	},
	onConnectionRequest: function(connectionRequest){
		this.destroyPort(connectionRequest.port);
	},
	getMeasureLinePath: function(){
		if (this.measureLinePath){
			return this.measureLinePath;
		}
		var numLines = this.get("scene").get("beatsPerMeasure") * this.get("measuresPerPhrase");
		var commands = [];
		var x;
		for (var i = 0; i < numLines-1; i++){
			x = (i * 100 / numLines) + "%";
			commands.push("M", x, 0, "L", x, "100%");
		}
		this.measureLinePath = commands.join(" ");
		return this.measureLinePath;
	},
	getNotes: function(){
		var scene			= this.get("scene");
		var baseOctave		= this.get("baseOctave");
		var numOctaves		= this.get("numOctaves");
		var scaleBias		= this.get("scaleBias");
		var scaleResolution	= this.get("scaleResolution");
		var scaleNotes 		= Theory.getScale(scene.key, scaleResolution, scaleBias);
		var availableNotes 	= [];
		//stat at -1 so availableNotes[0] gets the correct octave
		var currentOctave 	= baseOctave;

		for (var i = 0, endi = scaleNotes.length * numOctaves; i<endi; i++){
			if ((i + scaleBias) % scaleResolution === 0 && i !== 0){
				currentOctave++;
			}
			availableNotes.push(_.at(scaleNotes, i + scaleBias) + currentOctave);
		}

		this.set("availableNotes", availableNotes);
		return availableNotes;
	},
	getRhythm: function(){
		console.log("=======  pattern.getRhythm");
		var values			= this.master.getValues().rhythm;
		var peaks			= _.map(values, checkPeak);
		var peakIndicies	= [];

		_.each(peaks, function(isPeak, i){
			if (isPeak){
				peakIndicies.push(i);
			}
		});

		return peakIndicies;
	},
	getPitches: function(peakIndicies){
		var scene			= this.get("scene");
		// var availableNotes	= this.get("availableNotes") || this.getNotes();
		var availableNotes	= this.getNotes();
		var values			= this.master.getValues().pitch;

		console.log("=======  pattern.getPitches", availableNotes);


		var pitchesPositions = _.map(peakIndicies, function(index){
			return Math.round(values[index] * availableNotes.length);
		});
		var key		= scene.get("key");
		var pitches	= _.map(pitchesPositions, function(pitchPosition){
			return _.at(availableNotes, pitchPosition);
		});
		return pitches;
	},
	renderRhythm: function(){

	},
	destroyConnections: function( component ){
		var destroyPort = this.destroyPort.bind(this);
		component.get( "ports" ).each(function( port ){
			destroyPort( port );
		});
	},
	destroyPort: function( port ){
		var connection = this
			.get("connections")
			.findByPort( port );
		if ( connection ) this.destroyConnection( connection );
	},
	destroyConnection: function( connection ){
		console.log("collection data", arguments);
		connection.get("path").remove();
		connection.get( "input" ).parent.destroyConnection(connection.get( "input" ));
		connection.get( "output" ).parent.destroyConnection(connection.get( "output" ));
		this.get( "connections" ).remove( connection );
	},
	addFilter: function(){
		var model = this.get("components").add(new FilterModel({
				pattern: this,
				connectionsCollection: this.get("connections")
			})
		);
		model.setupCollection();
		return model;
	},
	addOscillator: function(){
		var model = this.get("components").add(new OscillatorModel({
				pattern: this,
				connectionsCollection: this.get("connections")
			})
		);
		model.setupCollection();
		return model;
	},
	addUserPattern: function(){
		var model = this.get("components").add(new UserPatternModel({
				pattern: this,
				connectionsCollection: this.get("connections")
			})
		);
		model.setupCollection();
		return model;
	},
	addSplitter: function(){
		var model = this.get("components").add(new SplitterModel({
				pattern: this,
				connectionsCollection: this.get("connections")
			})
		);
		model.setupCollection();
		return model;
	}
});

function identityMeasure(beatsPerMeasure){

}

function checkPeak(val, index, values){
	if (index < 0 || index >= values.length -1) return false;
	return val > values[index - 1] && val > values[index + 1];
}


module.exports = PatternModel;
