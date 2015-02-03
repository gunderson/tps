var jade = require('jade/runtime'); module.exports = {
"sequencer/fader": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"fader\"></div>");;return buf.join("");
},
"sequencer/filter": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"filter\"><div class=\"remove-button\"></div><div class=\"inputs\"><div class=\"input port add\"></div><div class=\"input port multiply\"></div><div class=\"input port transform\"></div></div><div class=\"output port\"></div><div class=\"output-display\"><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div><div class=\"waveform-display\"><!--shows waveform for length of this pattern--><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div></div>");;return buf.join("");
},
"sequencer/oscillator": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div class=\"oscillator\"><div class=\"remove-button\"></div><div class=\"inputs\"><div class=\"input port add\"></div><div class=\"input port multiply\"></div><div class=\"input port transform\"></div></div><div class=\"output port\"></div><div class=\"output-display\"><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div><div class=\"waveform-display\"><!--shows waveform for length of this pattern--><svg class=\"waveform\"></svg><div class=\"measure-bars\"></div></div></div>");;return buf.join("");
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
}