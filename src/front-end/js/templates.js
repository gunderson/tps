var jade = require('jade/runtime'); module.exports = {
"another": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;

buf.push("<div id=\"another\"><div id=\"hello\"></div></div>");;return buf.join("");
},
"partial": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (id) {
buf.push("<h2>It Worked - " + (jade.escape((jade_interp = id) == null ? '' : jade_interp)) + "</h2>");}.call(this,"id" in locals_for_with?locals_for_with.id:typeof id!=="undefined"?id:undefined));;return buf.join("");
},
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
"sound-board/sample-set": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (instrument) {
buf.push("<div class=\"sample-set\"><h1>" + (jade.escape((jade_interp = instrument.name) == null ? '' : jade_interp)) + "</h1><input type=\"range\" step=\"1\"" + (jade.attr("min", "" + (instrument.range.first) + "", true, false)) + (jade.attr("max", "" + (instrument.range.last) + "", true, false)) + "/><button>Trigger</button><button>Load</button></div>");}.call(this,"instrument" in locals_for_with?locals_for_with.instrument:typeof instrument!=="undefined"?instrument:undefined));;return buf.join("");
},
}