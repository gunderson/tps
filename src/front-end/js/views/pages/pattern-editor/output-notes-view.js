require("backbone");
require("backbone.layoutmanager");

var View = Backbone.Layout.extend({
	template: "pattern-editor/output-notes",
	// el: false,
	initialize: function(){
	},
	afterRender: function(){
		//scale everthing!
		var scene = this.model.get("scene");
		var _this = this;

		this.$(".measure").css({
			width: (100/this.model.get("numMeasures")) + "%"
		});
		this.$(".beat").css({
			width: (100/scene.get("beatsPerMeasure")) + "%"
		});
		this.$(".note").css({
			height: (100/this.model.get("availableNotes").length) + "%"
		});
	},
	serialize: function(){
		console.log(_.extend(
			this.model.toJSON(), 
			this.model.get("scene").toJSON()));
		return _.extend(
			this.model.toJSON(), 
			this.model.get("scene").toJSON());
	}
});

module.exports = View;