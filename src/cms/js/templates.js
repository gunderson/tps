var jade = require('jade/runtime'); module.exports = {
"queue/queue-item": function(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (constants, copy, encodeURIComponent, moderationStatus, order, soundcloud_url, user) {
buf.push("<tr class=\"queue-item\"><td class=\"order\">" + (jade.escape((jade_interp = order) == null ? '' : jade_interp)) + "</td><td class=\"status\"><select class=\"moderation-status\"><option" + (jade.attr("value", "" + (constants.MODERATION_STATUS.REJECTED) + "", true, false)) + (jade.attr("selected", moderationStatus == constants.MODERATION_STATUS.REJECTED, true, false)) + "> " + (jade.escape((jade_interp = copy.shared.MODERATION_STATUS.REJECTED) == null ? '' : jade_interp)) + "</option><option" + (jade.attr("value", "" + (constants.MODERATION_STATUS.UNMODERATED) + "", true, false)) + (jade.attr("selected", moderationStatus == constants.MODERATION_STATUS.UNMODERATED, true, false)) + ">" + (jade.escape((jade_interp = copy.shared.MODERATION_STATUS.UNMODERATED) == null ? '' : jade_interp)) + "</option><option" + (jade.attr("value", "" + (constants.MODERATION_STATUS.ELEVATED) + "", true, false)) + (jade.attr("selected", moderationStatus == constants.MODERATION_STATUS.ELEVATED, true, false)) + ">" + (jade.escape((jade_interp = copy.shared.MODERATION_STATUS.ELEVATED) == null ? '' : jade_interp)) + "</option><option" + (jade.attr("value", "" + (constants.MODERATION_STATUS.ACCEPTED) + "", true, false)) + (jade.attr("selected", moderationStatus == constants.MODERATION_STATUS.ACCEPTED, true, false)) + ">" + (jade.escape((jade_interp = copy.shared.MODERATION_STATUS.ACCEPTED) == null ? '' : jade_interp)) + "</option><option" + (jade.attr("value", "" + (constants.MODERATION_STATUS.PUBLISHED) + "", true, false)) + (jade.attr("selected", moderationStatus == constants.MODERATION_STATUS.PUBLISHED, true, false)) + ">" + (jade.escape((jade_interp = copy.shared.MODERATION_STATUS.PUBLISHED) == null ? '' : jade_interp)) + "</option></select></td><td class=\"user\"> <h2>" + (jade.escape((jade_interp = user.name) == null ? '' : jade_interp)) + "</h2><a" + (jade.attr("href", "http://twitter.com/" + (user.screen_name) + "", true, false)) + ">@" + (jade.escape((jade_interp = user.screen_name) == null ? '' : jade_interp)) + "</a></td><td class=\"song\"> <div class=\"embed\"><iframe width=\"100%\" height=\"100\" scrolling=\"no\" frameborder=\"no\"" + (jade.attr("src", "https://w.soundcloud.com/player/?url="+ encodeURIComponent(soundcloud_url) +"&amp;auto_play=false&amp;hide_related=false&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false&amp;visual=true", true, false)) + "></iframe></div></td></tr>");}.call(this,"constants" in locals_for_with?locals_for_with.constants:typeof constants!=="undefined"?constants:undefined,"copy" in locals_for_with?locals_for_with.copy:typeof copy!=="undefined"?copy:undefined,"encodeURIComponent" in locals_for_with?locals_for_with.encodeURIComponent:typeof encodeURIComponent!=="undefined"?encodeURIComponent:undefined,"moderationStatus" in locals_for_with?locals_for_with.moderationStatus:typeof moderationStatus!=="undefined"?moderationStatus:undefined,"order" in locals_for_with?locals_for_with.order:typeof order!=="undefined"?order:undefined,"soundcloud_url" in locals_for_with?locals_for_with.soundcloud_url:typeof soundcloud_url!=="undefined"?soundcloud_url:undefined,"user" in locals_for_with?locals_for_with.user:typeof user!=="undefined"?user:undefined));;return buf.join("");
},
}