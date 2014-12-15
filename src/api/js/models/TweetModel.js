var Backbone = require("Backbone");
var _ = require("underscore");
var constants = require("../constants");

var TweetModel = Backbone.Model.extend({
	idAttribute: "_id",
	defaults: function(){
		return {
			// moderationStatus: constants.MODERATION_STATUS.UNMODERATED,
			moderationStatus: constants.MODERATION_STATUS.PUBLISHED,
			queueStatus: constants.QUEUE_STATUS.QUEUED,
			editedBy: ["api"], // users
			editAction: ["create"],
			editedAt: [Date.now()],
			soundcloud_url: null
		};
	}
});
module.exports = TweetModel;