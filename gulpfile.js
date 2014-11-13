/*************************************************

  This gulpfile processes 3 sections of a website:
  The Front-end is client facing
  The CMS CRUDs data in the database
  The API is a RESTful API that facilitates CRUD from both the front-end and CMS

 *************************************************/

var fs = require('fs');
var path = require('path');
var _ = require("underscore");
var gulp = require('gulp');
var sass = require('gulp-sass');
var jade = require('gulp-jade');
var rename = require('gulp-rename');
var watch = require('gulp-watch');
var livereload = require('gulp-livereload');
var chmod = require('gulp-chmod');
var jst = require('gulp-jst-concat');
var gutil = require('gulp-util');
var debug = require('gulp-debug');
var joinData = require('gulp-join-data');
var express = require('express');

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

/*************************************************
 SETTINGS
 *************************************************/

var settings = {
	"dynamic-renders": [
		"front-end", "cms", "api"
	],
	"static-renders": [
		"front-end", "cms"
	],
	"api": {
		src: "./src/api",
		templates: "./src/api/jade",
		styles: "./src/api/sass",
		data: "./src/api/data/data.json",
		assets: "./src/api/assets",
		dist: "./dist/api",
		port: 3030
	},
	"cms": {
		src: "./src/cms",
		templates: "./src/cms/jade",
		styles: "./src/cms/sass",
		data: "./src/cms/data",
		assets: "./src/cms/assets",
		dist: "./dist/cms",
		port: 3001
	},
	"front-end": {
		src: "./src/front-end",
		templates: "./src/front-end/jade",
		styles: "./src/front-end/sass",
		data: "./src/front-end/data",
		assets: "./src/front-end/assets",
		dist: "./dist/front-end",
		port: 3000
	},
	livereloadport: 35729
}

/*************************************************
 PROCESS STYLES
 *************************************************/

gulp.task('styles',
	[
		'styles-cms',
		'styles-front-end'
	],
	function(cb){
		cb();
	}
);

function processStyles(role){
	var src = settings[role].styles + '/*.sass';
	var dest = settings[role].dist;

	gutil.log(src)
	gutil.log(dest)

	return gulp.src(src)
		.pipe(sass({sourceComments: 'normal'}))
		.pipe(gulp.dest(dest));
}

// Define tasks
settings["static-renders"].forEach(function(role){
	gulp.task('styles-' + role, function () {
		gutil.log("Running Task:", role +':styles')
		return processStyles(role);
	});
})

/*************************************************
 PROCESS TEMPLATES
 *************************************************/

gulp.task('templates',
	[
		'templates-static',
		'templates-dynamic'
	],
	function(cb){
		cb();
	}
)

gulp.task('templates-static',
	[
		'templates-cms',
		'templates-front-end'
	],
	function(cb){
		cb();
	}
)

gulp.task('templates-dynamic',
	[
		'templates-dynamic-cms',
		'templates-dynamic-front-end',
		'templates-dynamic-api'
	],
	function(cb){
		cb();
	}
)

function processStaticTemplates(role){
	var DATA = JSON.parse(fs.readFileSync(settings[role].data + "/data.json", "utf-8"));

	var src = settings[role].templates + '/static/*.jade';
	var dest = settings[role].dist;
	gulp.src(src)
		.pipe(jade({
			locals: DATA
		}))
        .pipe(chmod(755))
		.pipe(gulp.dest(dest))
}

function processDynamicTemplates(role){
	var src = settings[role].templates + '/dynamic/*.jade';
	var dest = settings[role].dist;
	gulp.src(src)
		.pipe(jade({
			client: true
		}))
		.pipe(jst('templates.js', {
	      renameKeys: ['^.*dynamic/(.*).js$', '$1']
	    }))
		.pipe(gulp.dest(settings[role].src + "/js"))
}

// Define tasks

settings["static-renders"].forEach(function(role){
	gulp.task("templates-" + role, function (cb) {
		processStaticTemplates(role);
		cb();
	});
});

// Define tasks

settings["dynamic-renders"].forEach(function(role){
	gulp.task('templates-dynamic-' + role, function (cb) {
		processDynamicTemplates(role);
		cb();
	});
});


/*************************************************
 PROCESS JS FILES W/ BROWSERFY
 *************************************************/

gulp.task('scripts',
	[
		'scripts-cms',
		'scripts-front-end',
		'copy-api'
	],
	function(cb){
		cb();
	}
);

// Define tasks

settings["dynamic-renders"].forEach(function(role){
	gulp.task('scripts-' + role, function () {
		return processBrowserify(role);
	});
})

var getBundleName = function () {
  var version = require('./package.json').version;
  var name = require('./package.json').name;
  return version + '.' + name + '.' + 'min';
};

function processBrowserify(role){
	var src = settings[role].src + '/js/index.js';
	var dest = settings[role].dist;

	var bundler = browserify({
		entries: [src],
		debug: true
	});

	var bundle = function() {
		return bundler
			.bundle()
			.pipe(source('index.js'))
			.pipe(buffer())
			.pipe(sourcemaps.init({loadMaps: true}))
			// Add transformation tasks to the pipeline here.
			// .pipe(uglify())
			.pipe(sourcemaps.write('/'))
			.pipe(gulp.dest(dest));
	};

	return bundle();
	

}

gulp.task("copy-api", function(){
	var src = settings["api"].assets;
	var dest = settings["api"].dist;
	gulp.src(src + "/**/*.*")
		.pipe(gulp.dest(dest));
});

/*************************************************
 PROCESS DATA
 *************************************************/

gulp.task("process-data",
	[
		"process-data-api",
		"process-data-cms",
		"process-data-front-end"
	],
	function(cb) {
		cb();
	}
);

function processData(role) {
	var src = [settings[role].data + '/*.json', '!**/data.json'];
	var dest = settings[role].data;
	gulp.src(src)
        // .pipe(debug({verbose: true}))
		.pipe(joinData("data.json"))
		.pipe(gulp.dest(settings[role].data));
}


settings["dynamic-renders"].forEach(function(role){
	gulp.task("process-data-" + role, function (cb) {
		processData(role);
		cb();
	});
});

/*************************************************
 SYNCRONIZE ASSETS
 *************************************************/

gulp.task("copy-assets",
	[
		"copy-assets-cms",
		"copy-assets-front-end"
	],
	function(cb) {
		cb();
	}
);

function copyassets(set) {
	var src = settings[set].assets;
	var dest = settings[set].dist;
	gulp.src(src + "/assets/**/*.*")
		.pipe(gulp.dest(dest + "/assets"));
}


settings["static-renders"].forEach(function(role){
	gulp.task('copy-assets-' + role, function (cb) {
		copyassets(role);
		cb();
	});
});

/*************************************************
 WATCH BUILD
 *************************************************/

var lrserver;

gulp.task('watch',
	[
		'styles',
		'templates',
		'scripts',
		'servers'
	],
	function () {
		lrserver = livereload();
		livereload.listen(settings.livereloadport);

		settings["static-renders"].forEach(function(role){

			watch([
					settings[role].styles + '/**/*.sass'
				], 
				function (files, cb) {
					gulp.start("styles-" + role, cb);
				}
			);

			watch([
					settings[role].src + '/js/**/*.js'
				], 
				function (files, cb) {
					gulp.start("scripts-" + role, cb);
				}
			);

			watch([
					settings[role].src + '/**/*.jade', 
					settings[role].data + "/**/*.json"
				], 
				function (files, cb) {
					gulp.start("templates-" + role, cb);
				}
			);

			gulp.watch(settings[role].dist + '/*.html', notifyLiveReload);
			gulp.watch(settings[role].dist + '/*.css', notifyLiveReload);
		});

		watch(settings['api'].src + "/**/*", function(files, cb){
			gulp.start("copy-api", cb);
			apiServer.close();
			startApiServer();

		})

	}
);

function notifyLiveReload(event) {
	var fileName = path.relative(__dirname, event.path);
	lrserver.changed(fileName);
}


/*************************************************
 START SERVERS
 *************************************************/

gulp.task('servers', function(cb) {
	settings["static-renders"].forEach(function(role, i){
		startStaticServer(role, i);
	});
	startApiServer();
	cb();
});

function startStaticServer(role, index){
    var server = express();
    var options = {
		dotfiles: 'ignore',
		// etag: false,
		// extensions: ['htm', 'html'],
		// index: true,
		// maxAge: '1d',
		// redirect: false,
		setHeaders: function (res, path, stat) {
			res.set('x-timestamp', Date.now())
		}
	};
	
	server.use(require('connect-livereload')());

	var p = path.resolve(settings[role].dist);
	gutil.log("serving from: ", p)

	server
		.use("/", express.static(p, options))
		.listen(settings[role].port, "0.0.0.0");
}
var apiServer;
function startApiServer(){
	apiServer = express();
	var role = "api";
	
	require( settings[role].dist + "/index")(apiServer);
	apiServer.listen(settings[role].port, "0.0.0.0");
}



gulp.task('default', function() {
  // place code for your default task here
});