var jade = require('jade/runtime'); module.exports = {
"sequencer/pattern-detail": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

;return buf.join("");
},
"sequencer/pattern-overview": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

;return buf.join("");
},
"sequencer/scene-manager": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

;return buf.join("");
},
"sequencer/track-manager": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

;return buf.join("");
},
"sound-board/instrument": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (instrument) {
buf.push("<div" + (jade.cls(['instrument',"" + (instrument.name) + ""], [null,true])) + "><h1>" + (jade.escape((jade_interp = instrument.name) == null ? '' : jade_interp)) + "  " + (jade.escape((jade_interp = instrument.type) == null ? '' : jade_interp)) + "</h1><input type=\"range\" step=\"1\"" + (jade.attr("min", "" + (instrument.range.first) + "", true, false)) + (jade.attr("max", "" + (instrument.range.last) + "", true, false)) + " value=\"30\" class=\"noteValue\"/><button class=\"trigger\">Trigger</button><button class=\"load\">Load</button></div>");}.call(this,"instrument" in locals_for_with?locals_for_with.instrument:typeof instrument!=="undefined"?instrument:undefined));;return buf.join("");
},
}