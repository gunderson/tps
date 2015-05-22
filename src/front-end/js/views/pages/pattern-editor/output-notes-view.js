require("backbone");
require("backbone.layoutmanager");

var View = Backbone.Layout.extend({
	template: "pattern-editor/output-notes",
	// el: false,
	initialize: function(options){
	},
	afterRender: function(){
		//scale everthing!
		var scene = this.model.get("scene");
		var _this = this;
		
		var patternValues = this.model.getValues();
		var ticksPerBeat = scene.get("ticksPerBeat");

		var rhythmIn16ths = patternValues.rhythmIn16ths;

		// console.log("rhythmIn16ths",patternValues.rhythmIn16ths)

		this.$(".measure").css({
			width: (100/this.model.get("length")) + "%"
		});
		this.$(".beat").css({
			width: (100/scene.get("beatsPerMeasure")) + "%"
		});
		var $notes = this.$(".note").css({
			height: (100/this.model.get("availableNotes").length) + "%"
		});
		var $sixteenths = this.$(".sixteenth");
		_.each(rhythmIn16ths, function(position, i){
			var $sixteenth = $sixteenths.eq(position);
			$sixteenth.find("." + patternValues.pitches[i]).addClass("marked-for-play");
		});
	},
	setModel: function(model){
		if (model) this.stopListening(this.model);
		this.model = model;
		this.listenTo(model, "change",	this.render);
	},
	serialize: function(){
		return _.extend(
			this.model.toJSON(), 
			this.model.get("scene").toJSON());
	}
});

module.exports = View;