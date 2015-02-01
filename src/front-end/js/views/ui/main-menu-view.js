require('backbone');
require("backbone.layoutmanager");

var MainMenu = Backbone.Layout.extend({

	events:{
		"click .handle": "onHandleClick",
		"click a.closer": "onMenuItemCloserClick"
	},
	el: "#main-menu",
	initialize: function(){
	},


	//input events
	onHandleClick: function(){
		$("html").toggleClass("menu-open");
		this.$(".handle .contents")
			.toggleClass("fa-close fa-bars");
	},
	onMenuItemCloserClick: function(){
		$("html").removeClass("menu-open");
		this.$(".handle .contents")
			.toggleClass("fa-close fa-bars");
	},


	template: null
});

module.exports = MainMenu;