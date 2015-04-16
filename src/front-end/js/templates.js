var jade = require('jade/runtime'); module.exports = {
"pattern-editor/output-notes": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (numMeasures, beatsPerMeasure, availableNotes, key) {
var measureId = 0
while ((++measureId <= numMeasures))
{
buf.push("<div class=\"measure\">");
var beatId = 0
while ((++beatId <= beatsPerMeasure))
{
buf.push("<div" + (jade.cls(['beat',"beat-" + (beatId) + ""], [null,true])) + ">");
var beatIndex = 0
while ((++beatIndex <= 4))
{
buf.push("<div" + (jade.attr("data-count", "" + ((beatId * beatIndex)) + "", true, false)) + (jade.attr("data-beat-index", "" + (beatIndex) + "", true, false)) + " class=\"sixteenth\"><div class=\"available-notes\">");
var revNotes = availableNotes.slice().reverse()
// iterate revNotes
;(function(){
  var $$obj = revNotes;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var noteName = $$obj[$index];

if ( (noteName.charAt(0) !== key.charAt(0)))
{
buf.push("<div" + (jade.cls(['note',"" + (noteName) + ""], [null,true])) + "></div>");
}
else
{
buf.push("<div" + (jade.cls(['note','root',"" + (noteName) + ""], [null,null,true])) + "></div>");
}
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var noteName = $$obj[$index];

if ( (noteName.charAt(0) !== key.charAt(0)))
{
buf.push("<div" + (jade.cls(['note',"" + (noteName) + ""], [null,true])) + "></div>");
}
else
{
buf.push("<div" + (jade.cls(['note','root',"" + (noteName) + ""], [null,null,true])) + "></div>");
}
    }

  }
}).call(this);

buf.push("</div></div>");
}
buf.push("</div>");
}
buf.push("</div>");
}}.call(this,"numMeasures" in locals_for_with?locals_for_with.numMeasures:typeof numMeasures!=="undefined"?numMeasures:undefined,"beatsPerMeasure" in locals_for_with?locals_for_with.beatsPerMeasure:typeof beatsPerMeasure!=="undefined"?beatsPerMeasure:undefined,"availableNotes" in locals_for_with?locals_for_with.availableNotes:typeof availableNotes!=="undefined"?availableNotes:undefined,"key" in locals_for_with?locals_for_with.key:typeof key!=="undefined"?key:undefined));;return buf.join("");
},
"sequencer/fader": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"fader\"></div>");;return buf.join("");
},
"sequencer/pattern-overview": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (sceneId, trackId) {
buf.push("<div class=\"pattern-overview\"><a" + (jade.attr("href", "#/pattern-editor/" + (sceneId) + "/" + (trackId) + "", true, false)) + " class=\"content\"><div class=\"pattern-graph\"></div><div class=\"threshold-line\"></div></a></div>");}.call(this,"sceneId" in locals_for_with?locals_for_with.sceneId:typeof sceneId!=="undefined"?sceneId:undefined,"trackId" in locals_for_with?locals_for_with.trackId:typeof trackId!=="undefined"?trackId:undefined));;return buf.join("");
},
"sequencer/scene": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (sceneId) {
buf.push("<div class=\"scene\"><div class=\"scene-id\">" + (jade.escape((jade_interp = sceneId + 1) == null ? '' : jade_interp)) + "</div><div class=\"patterns\"></div></div>");}.call(this,"sceneId" in locals_for_with?locals_for_with.sceneId:typeof sceneId!=="undefined"?sceneId:undefined));;return buf.join("");
},
"sequencer/track": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"track\"><div class=\"content\"></div></div>");;return buf.join("");
},
"sound-board/instrument": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (instrument) {
buf.push("<div" + (jade.cls(['instrument',"" + (instrument.name) + ""], [null,true])) + "><h1>" + (jade.escape((jade_interp = instrument.name) == null ? '' : jade_interp)) + "  " + (jade.escape((jade_interp = instrument.type) == null ? '' : jade_interp)) + "</h1><input type=\"range\" step=\"1\"" + (jade.attr("min", "" + (instrument.range.first) + "", true, false)) + (jade.attr("max", "" + (instrument.range.last) + "", true, false)) + " value=\"30\" class=\"noteValue\"/><div class=\"noteValueDisplay\">30</div><button class=\"trigger\">Trigger</button><button class=\"load\">Load</button></div>");}.call(this,"instrument" in locals_for_with?locals_for_with.instrument:typeof instrument!=="undefined"?instrument:undefined));;return buf.join("");
},
"pattern-editor/components/filter": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (lineInputId, levelInputId, outputId) {
buf.push("<div class=\"filter component\"><div class=\"remove-button\"></div><div class=\"title\">Filter</div><!-- PORTS--><div class=\"inputs\"><div" + (jade.attr("data-connection-id", "" + (lineInputId) + "", true, false)) + " class=\"line-input input\"><div class=\"port\"></div>Line</div><div" + (jade.attr("data-connection-id", "" + (levelInputId) + "", true, false)) + " class=\"level-input input\"><div class=\"port\"></div>Level</div></div><div class=\"outputs\"><div" + (jade.attr("data-connection-id", "" + (outputId) + "", true, false)) + " class=\"output\"><div class=\"port\"></div>Output</div></div><!-- Controls--><form class=\"component-controls filter-controls\"><div class=\"type\"><label><input type=\"radio\" name=\"filter-type\" value=\"passthrough\" selected=\"true\"/>Passthrough</label><label><input type=\"radio\" name=\"filter-type\" value=\"scale\"/>Scale</label><label><input type=\"radio\" name=\"filter-type\" value=\"add\"/>Add </label><label><input type=\"radio\" name=\"filter-type\" value=\"quant\"/>Quant</label></div><div class=\"scale-controls\">scale controls<label><input type=\"number\" name=\"static-value\" value=\"1\"/>Static Value</label></div><div class=\"static-controls\">Add Value Controls<label><input type=\"number\" name=\"static-value\" value=\"0\"/>Add Value</label></div><div class=\"quant-controls\">Quant controls<label><input type=\"number\" name=\"static-value\" value=\"1\"/>Quant to the nearest</label></div><div class=\"displays\"><div class=\"output-display\"><h3>Output Waveform</h3><svg class=\"waveform\"></svg></div></div></form></div>");}.call(this,"lineInputId" in locals_for_with?locals_for_with.lineInputId:typeof lineInputId!=="undefined"?lineInputId:undefined,"levelInputId" in locals_for_with?locals_for_with.levelInputId:typeof levelInputId!=="undefined"?levelInputId:undefined,"outputId" in locals_for_with?locals_for_with.outputId:typeof outputId!=="undefined"?outputId:undefined));;return buf.join("");
},
"pattern-editor/components/master": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (rhythmInputId, pitchInputId, scaleBias, scaleResolution, numOctaves, baseOctave) {
buf.push("<div id=\"master\" class=\"component\"><div class=\"title\">Master Inputs</div><!-- PORTS--><div id=\"sequencer-inputs\" class=\"inputs\"><div id=\"rhythm-input\"" + (jade.attr("data-connection-id", "" + (rhythmInputId) + "", true, false)) + " class=\"input\"><div class=\"port\"></div>Rhythm</div><div id=\"pitch-input\"" + (jade.attr("data-connection-id", "" + (pitchInputId) + "", true, false)) + " class=\"input\"><div class=\"port\"></div>Pitch</div></div><!-- CONTROLS--><form class=\"component-controls master-controls\"><div class=\"scale-bias\"><label><input type=\"number\" name=\"type\"" + (jade.attr("value", "" + (scaleBias) + "", true, false)) + " min=\"-6\" max=\"6\"/>Scale Bias</label></div><div class=\"scale-resolution\"><label><input type=\"number\" name=\"type\"" + (jade.attr("value", "" + (scaleResolution) + "", true, false)) + " min=\"1\" max=\"7\"/>Scale Resolution</label></div><div class=\"num-octaves\"><label><input type=\"number\" name=\"type\"" + (jade.attr("value", "" + (numOctaves) + "", true, false)) + " min=\"1\" max=\"9\"/>Number of Octaves</label></div><div class=\"base-octave\"><label><input type=\"number\" name=\"type\"" + (jade.attr("value", "" + (baseOctave) + "", true, false)) + " min=\"0\" max=\"9\"/>Base Octave</label></div><div class=\"displays\"></div></form></div>");}.call(this,"rhythmInputId" in locals_for_with?locals_for_with.rhythmInputId:typeof rhythmInputId!=="undefined"?rhythmInputId:undefined,"pitchInputId" in locals_for_with?locals_for_with.pitchInputId:typeof pitchInputId!=="undefined"?pitchInputId:undefined,"scaleBias" in locals_for_with?locals_for_with.scaleBias:typeof scaleBias!=="undefined"?scaleBias:undefined,"scaleResolution" in locals_for_with?locals_for_with.scaleResolution:typeof scaleResolution!=="undefined"?scaleResolution:undefined,"numOctaves" in locals_for_with?locals_for_with.numOctaves:typeof numOctaves!=="undefined"?numOctaves:undefined,"baseOctave" in locals_for_with?locals_for_with.baseOctave:typeof baseOctave!=="undefined"?baseOctave:undefined));;return buf.join("");
},
"pattern-editor/components/oscillator": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (addInputId, multiplyInputId, outputId, amplitude, frequency, offset) {
buf.push("<div class=\"oscillator component\"><div class=\"remove-button\"></div><div class=\"title\">Oscillator</div><!-- PORTS--><div class=\"inputs\"><div" + (jade.attr("data-connection-id", "" + (addInputId) + "", true, false)) + " class=\"add-input input\"><div class=\"port\"></div>Add</div><div" + (jade.attr("data-connection-id", "" + (multiplyInputId) + "", true, false)) + " class=\"multiply-input input\"><div class=\"port\"></div>Multiply</div></div><div class=\"outputs\"><div" + (jade.attr("data-connection-id", "" + (outputId) + "", true, false)) + " class=\"output\"><div class=\"port\"></div>Output</div></div><!-- CONTROLS--><form class=\"component-controls oscillator-controls\"><div class=\"amplitude-input\"><label><input type=\"number\" min=\"-1\" max=\"1\" step=\"0.01\"" + (jade.attr("value", "" + (amplitude) + "", true, false)) + "/>Amplitude</label></div><div class=\"frequency-input\"><label><input type=\"number\" min=\"-24\" max=\"24\" step=\"0.01\"" + (jade.attr("value", "" + (frequency) + "", true, false)) + "/>Frequency</label></div><div class=\"offset-input\"><label><input type=\"number\" min=\"-24\" max=\"24\" step=\"0.01\"" + (jade.attr("value", "" + (offset) + "", true, false)) + "/>Offset</label></div><div class=\"displays\"><div class=\"output-display\"><h3>Output Waveform</h3><svg class=\"waveform\"></svg></div><div class=\"oscillation-display\"><h3>Oscillator Waveform</h3><!--shows waveform for length of this pattern--><svg class=\"waveform\"></svg></div></div></form></div>");}.call(this,"addInputId" in locals_for_with?locals_for_with.addInputId:typeof addInputId!=="undefined"?addInputId:undefined,"multiplyInputId" in locals_for_with?locals_for_with.multiplyInputId:typeof multiplyInputId!=="undefined"?multiplyInputId:undefined,"outputId" in locals_for_with?locals_for_with.outputId:typeof outputId!=="undefined"?outputId:undefined,"amplitude" in locals_for_with?locals_for_with.amplitude:typeof amplitude!=="undefined"?amplitude:undefined,"frequency" in locals_for_with?locals_for_with.frequency:typeof frequency!=="undefined"?frequency:undefined,"offset" in locals_for_with?locals_for_with.offset:typeof offset!=="undefined"?offset:undefined));;return buf.join("");
},
"pattern-editor/components/splitter": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (inputId, outputAId, outputBId) {
buf.push("<div class=\"splitter component\"><div class=\"remove-button\"></div><div class=\"title\">Splitter</div><!-- PORTS--><div class=\"inputs\"><div" + (jade.attr("data-connection-id", "" + (inputId) + "", true, false)) + " class=\"line-input input\"><div class=\"port\"></div>Line</div></div><div class=\"outputs\"><div" + (jade.attr("data-connection-id", "" + (outputAId) + "", true, false)) + " class=\"output output-a\"><div class=\"port\"></div>Output A</div><div" + (jade.attr("data-connection-id", "" + (outputBId) + "", true, false)) + " class=\"output output-b\"><div class=\"port\"></div>Output B</div></div><!-- CONTROLS--><form class=\"component-controls splitter-controls\"><div class=\"displays\"><div class=\"output-display\"><h3>Output Waveform</h3><svg class=\"waveform\"></svg></div></div></form></div>");}.call(this,"inputId" in locals_for_with?locals_for_with.inputId:typeof inputId!=="undefined"?inputId:undefined,"outputAId" in locals_for_with?locals_for_with.outputAId:typeof outputAId!=="undefined"?outputAId:undefined,"outputBId" in locals_for_with?locals_for_with.outputBId:typeof outputBId!=="undefined"?outputBId:undefined));;return buf.join("");
},
"pattern-editor/components/user-pattern": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (thresholdInputId, outputId) {
buf.push("<div class=\"user-pattern component\"><div class=\"remove-button\"></div><div class=\"title\">User Pattern</div><!-- PORTS--><div class=\"inputs\"><div" + (jade.attr("data-connection-id", "" + (thresholdInputId) + "", true, false)) + " class=\"threshold-input input\"><div class=\"port\"></div>Threshold</div></div><div class=\"outputs\"><div" + (jade.attr("data-connection-id", "" + (outputId) + "", true, false)) + " class=\"output output-a\"><div class=\"port\"></div>Output A</div></div><!-- CONTROLS--><form class=\"component-controls user-pattern-controls\"><div class=\"displays\"><div class=\"output-display\"><h3>Output Waveform</h3><svg class=\"waveform\"></svg></div></div></form></div>");}.call(this,"thresholdInputId" in locals_for_with?locals_for_with.thresholdInputId:typeof thresholdInputId!=="undefined"?thresholdInputId:undefined,"outputId" in locals_for_with?locals_for_with.outputId:typeof outputId!=="undefined"?outputId:undefined));;return buf.join("");
},
}