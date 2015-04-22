require("backbone");

var Model = Backbone.Model.extend({
	export: function(){
		var output = this.toJSON();
		delete output.values;
		if (output.partnerPort){
			output.partnerPort = output.partnerPort.get("id");
		}
		return output;
	}
});

module.exports = Model;