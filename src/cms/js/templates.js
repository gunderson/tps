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
}