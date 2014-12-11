var _ = require("underscore");
require("backbone");
var TrackModel = require("../../models/sequencer/track");

var TrackCollection = Backbone.Collection.extend({
	model: TrackModel
});

module.exports = TrackCollection;