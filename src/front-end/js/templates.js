var jade = require('jade/runtime'); module.exports = {
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
buf.push("<div class=\"pattern-overview\"><a" + (jade.attr("href", "#/pattern-editor/" + (sceneId) + "/" + (trackId) + "", true, false)) + " class=\"content\"><canvas class=\"pattern-graph\"></canvas><div class=\"threshold-line\"></div></a></div>");}.call(this,"sceneId" in locals_for_with?locals_for_with.sceneId:typeof sceneId!=="undefined"?sceneId:undefined,"trackId" in locals_for_with?locals_for_with.trackId:typeof trackId!=="undefined"?trackId:undefined));;return buf.join("");
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

buf.push("<div class=\"filter component\"><div class=\"remove-button\"></div><div class=\"title\">Filter</div><div class=\"inputs\"><div class=\"line-input input\"><div class=\"port\"></div>Line</div><div class=\"level-input input\"><div class=\"port\"></div>Level</div></div><div class=\"output\"><div class=\"port\"></div>Output</div><div class=\"output-display\"><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div><div class=\"waveform-display\"><!--shows waveform for length of this pattern--><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div></div>");;return buf.join("");
},
"pattern-editor/components/master": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div id=\"master\" class=\"component\"><div class=\"title\">Master Inputs</div><div id=\"sequencer-inputs\"><div id=\"rhythm-input\" class=\"input\"><div class=\"port\"></div>Pattern</div><div id=\"pitch-input\" class=\"input\"><div class=\"port\"></div>Pitch</div></div></div>");;return buf.join("");
},
"pattern-editor/components/oscillator": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"oscillator component\"><div class=\"remove-button\"></div><div class=\"title\">Oscillator</div><div class=\"inputs\"><div class=\"add-input input\"><div class=\"port\"></div>Add</div><div class=\"multiply-input input\"><div class=\"port\"></div>Multiply</div></div><div class=\"output\"><div class=\"port\"></div>Output</div><div class=\"output-display\"><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div><div class=\"waveform-display\"><!--shows waveform for length of this pattern--><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div></div>");;return buf.join("");
},
"pattern-editor/components/splitter": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"splitter component\"><div class=\"remove-button\"></div><div class=\"title\">Splitter</div><div class=\"inputs\"><div class=\"line-input input\"><div class=\"port\"></div>Line</div></div><div class=\"outputs\"><div class=\"output output-a\"><div class=\"port\"></div>Output A</div><div class=\"output output-b\"><div class=\"port\"></div>Output B</div></div><div class=\"output-display\"><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div><div class=\"waveform-display\"><!--shows waveform for length of this pattern--><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div></div>");;return buf.join("");
},
"pattern-editor/components/user-pattern": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"user-pattern component\"><div class=\"remove-button\"></div><div class=\"title\">User Pattern</div><div class=\"inputs\"><div class=\"line-input input\"><div class=\"port\"></div>Line</div></div><div class=\"outputs\"><div class=\"output output-a\"><div class=\"port\"></div>Output A</div></div><div class=\"output-display\"><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div><div class=\"waveform-display\"><!--shows waveform for length of this pattern--><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div></div>");;return buf.join("");
},
}