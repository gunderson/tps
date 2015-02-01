require("backbone");
require("backbone.layoutmanager");
var AbstractPage = require("./Page-view");

//abstract page class
var Page = AbstractPage.extend({
    row: 0,
    col: 0,
    el: "#home",
    events: {
        "click button.trigger": "onClickTriggerButton",
        "click button.triggerAll": "onClickTriggerAllButton",
        "click button.getSongsFromTwitter": "onClickGetSongsFromTwitter"
    },
    onClickTriggerButton: function(e) {
        $.get("http://localhost:3030/pulse/trigger/" + $(e.target).data(
            "trigger"));
    },
    onClickTriggerAllButton: function(e) {
        $.get("http://localhost:3030/pulse/trigger/3");
        $.get("http://localhost:3030/pulse/trigger/4");
    },
    onClickGetSongsFromTwitter: function() {
        $.get("http://localhost:3030/songs/cycle");
    }
});

module.exports = Page;
