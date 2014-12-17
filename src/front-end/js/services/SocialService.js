var E = require('Constants');

var SocialService = {

	getShortUrl: function(longUrl, callback){
		$.get(E.SITE_ROOT + '/short-url', {longUrl:longUrl}, callback);
	},

	// this should only be used for main site share
	shareFacebook: function (options) {
		// console.log('shareFacebook', options);
		options = _.extend({
			url: location.href,

		}, options);
		var site = encodeURIComponent(options.url);

		var shareURL = 'http://www.facebook.com/sharer.php?u=' + site ;
		openWindow(shareURL, 'Facebook');
	},

	shareFacebookDynamic: function (options) {
		var title = 'title=' + encodeURIComponent(options.title);
		var description = 'description=' + encodeURIComponent(options.description);
		var img = 'img=' + encodeURIComponent(options.img);
		var redirURL = 'redirectURL=' + encodeURIComponent(options.redirectURL);
		var params = [redirURL, title, description, img];

		// generic share url
		var shareUrl = E.SITE_ROOT + 'share?' + params.join('&');

		//    console.log(params);
		console.log(shareUrl);
		SocialService.shareFacebook({
			url: shareUrl
		});
	},

	shareTwitter: function (options) {
		// console.log('shareTwitter', options);
		options = _.extend({
			url: '',
			description: undefined,
		}, options);

		if( options.url.length + options.description.length > 140){
			console.warn("tweet characters >140: ", options.url.length + options.description.length);
		}

		var description = encodeURIComponent(options.description);
		var shareURL;
		if (options.url.length > 1){
			var site = encodeURIComponent(options.url);
			shareURL = 'http://twitter.com/share?text=' + description + '&url=' + site;
		}else{
			shareURL = 'http://twitter.com/share?text=' + description;
		}
		openWindow(shareURL, 'Twitter');
	},

	shareTumblr: function (options) {
		// console.log('shareTumblr', options);
		options = _.extend({
			img: "",
			url: window.location.href,
			title: undefined,
			desc: "",
		}, options);

		//var site = '&u=' + encodeURIComponent(options.url);
		//var title = options.title ? '&t=' + encodeURIComponent(options.title) : '';
		//var shareURL = 'http://tumblr.com/share?s=&v=3' + title + site;
		// var site =  encodeURIComponent(options.url);
		var site =  encodeURIComponent(options.url);
		var photo = encodeURIComponent(options.img);
		var title =  encodeURIComponent(options.title);
		var desc =  encodeURIComponent(options.desc);
		var shareURL_p = "//www.tumblr.com/share/photo?source=" + photo + "&caption=" + desc + "&click_thru=" + site;
		// var shareURL= 'http://www.tumblr.com/share/link?url=' + site + '&name=' + title + '&description='+ desc;
	   
		openWindow(shareURL_p, 'Tumblr');
	},

	sharePinterest: function (options) {
		console.log('sharePinterest', options);
		options = _.extend({
			url: window.location.href,
			description: undefined,
			media: undefined,
			isVideo: false
		}, options);

//            img = 'http://media.giphy.com/media/iP8hhgIczK56U/giphy.gif';
		var media = options.media ? '&media=' + encodeURIComponent(options.media) : '';
		var isVideo = options.isVideo ? '&isVideo=true' : '';
		var site = encodeURIComponent(options.url);
		var description = options.description ? '&description=' + encodeURIComponent(options.description) : '';
		var shareURL = 'http://pinterest.com/pin/create/button/?url=' + site + description + media + isVideo;
		openWindow(shareURL, 'Pinterest');
	},

};

function openWindow(url, title) {
	// console.log('openWindow', url, title);
	var width = 575,
		height = 425,
		opts =
			',width=' + width +
			',height=' + height;
	window.open(url, title, opts);
}

module.exports = SocialService;