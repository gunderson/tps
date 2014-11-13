this.JST = {"partial": function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += 'function template(locals) {\nvar buf = [];\nvar jade_mixins = {};\nvar jade_interp;\n;var locals_for_with = (locals || {});(function (id) {\nbuf.push("<h2>It Worked - " + (jade.escape((jade_interp = id) == null ? \'\' : jade_interp)) + "</h2>");}.call(this,"id" in locals_for_with?locals_for_with.id:typeof id!=="undefined"?id:undefined));;return buf.join("");\n}';

}
return __p
}};