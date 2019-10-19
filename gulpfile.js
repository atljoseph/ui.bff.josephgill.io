var gulp = require('gulp'),
    connect = require('gulp-connect'),
    $ = require('gulp-load-plugins')(),
    KarmaServer = require('karma').Server,
    path = require('path'),
    ts_project = require('gulp-typescript').createProject('./server/tsconfig.json'),
    spawn = require('child_process').spawn;

var server_proc;

var minifyHtmlOptions = {
  empty: true,
  loose: true
};

/**
 * Assess environment based on the gulp command issued at the command line:
 * e.g., for development:
 *
 *   $ gulp serve --env=dev
 *            OR
 *   $ gulp serve --env dev
 *
 * Both of the above set environment as development for deployment.
 * If serving for localhost:
 *
 *   $ gulp serve --env dev --local
 *
 * expected values: ['dev', 'prod', 'uat', 'test']
 */

var arguments = require('yargs').argv,
    argsMap = {
      'dev': 'development',
      'prod': 'production',
      'uat': 'staging',
      'test': 'testing'
    },
    environment = argsMap[arguments.env || process.env.env];
var serveLocal = !!(arguments.local || process.env.local);

/**
 * Temporarily we can also pass in an endpoint as an argument,
 * so the config file can be built appropriately to point to the
 * correct API endpoints
 */
var endpoint = 'dev-grow';

if (typeof arguments.endpoint !== 'undefined') {
  endpoint = arguments.endpoint;
}

if (typeof process.env.endpoint !== 'undefined') {
  endpoint = process.env.endpoint;
}

var protractorOptions = {
  configFile: 'protractor.conf.js',
  args: ['--params.env', environment]
};

// gulp.task('widget-templates', ['install-widgets'], function(){
//   var opts = {
//     root: '{widgetsPath}',
//     module: 'app'
//   };
//   return gulp.src('app/widgets/*/src/*.html')
//              .pipe($.minifyHtml(minifyHtmlOptions))
//              .pipe($.angularTemplatecache('widgets.js', opts))
//              .pipe(gulp.dest('.tmp'));
// });

// gulp.task('app-templates', function(){
//   var opts = {
//     root: 'partials',
//     module: 'app'
//   };
//   return gulp.src('app/partials/*.html')
//              .pipe($.minifyHtml(minifyHtmlOptions))
//              .pipe($.angularTemplatecache('samples.js', opts))
//              .pipe(gulp.dest('.tmp'));
// });

// gulp.task('dashboard-templates', function(){
//   var opts = {
//     root: '../src/templates',
//     module: 'adf'
//   };
//   return gulp.src('src/templates/*.html')
//              .pipe($.minifyHtml(minifyHtmlOptions))
//              .pipe($.angularTemplatecache('adf.js', opts))
//              .pipe(gulp.dest('.tmp'));
// });

/** e2e **/

// The protractor task
var protractor = require('gulp-protractor').protractor;

// Start a standalone server
var webdriver_standalone = require('gulp-protractor').webdriver_standalone;

// Download and update the selenium driver
var webdriver_update = require('gulp-protractor').webdriver_update;

// Downloads the selenium webdriver
gulp.task('webdriver_update', webdriver_update);

// Start the standalone selenium server
// NOTE: This is not needed if you reference the
// seleniumServerJar in your protractor.conf.js
gulp.task('webdriver_standalone', webdriver_standalone);

// start webserver for e2e tests
gulp.task('e2e-server', gulp.series(function(){ //'install-widgets', 
  connect.server({
    port: 9003
  });
}));

// Setting up the test task
gulp.task('e2e', gulp.series('e2e-server', 'webdriver_update', function(cb) {
  gulp.src('e2e/*.spec.js')
      .pipe(protractor(protractorOptions))
      .on('error', function(e) {
        // stop webserver
        connect.serverClose();
        // print test results
        console.log(e);
      })
      .on('end', function(){
        // stop webserver
        connect.serverClose();
        cb();
      });
}));

/**
 * Server build scripts used for live reloading of BFF layer
 */

gulp.task('build-server', function(){
	return gulp.src('./server/**/*.ts')
	.pipe(ts_project()).js
	.pipe(gulp.dest('./dist/server/'));
});

gulp.task('start-server', gulp.series('build-server', function(){
    if (server_proc) {
        server_proc.kill();
        server_proc = undefined;
    }
    server_proc = spawn('node', ['dist/server/app.js', '--inspect=5858'], {
        cwd: __dirname,
        stdio: [0, 1, 2, 'ipc']
    });
}));

gulp.task('watch-server', gulp.series('start-server', function() {
  return gulp.watch(['./server/**/*.ts', '.env'], ['start-server']);
}));

gulp.task('watch-client', function () {
  spawn('node', ['--max_old_space_size=12288','../node_modules/.bin/ng', 'build', '--configuration=dev', '--watch'], {
    cwd: path.join(__dirname, './client'),
    stdio: [0, 1, 2, 'ipc']
  })
});

gulp.task('serve', gulp.parallel('start-server', 'watch-client'));


/** shorthand methods **/
// gulp.task('all', gulp.series('build', 'docs', 'app'));

// gulp.task('default', gulp.series('serve'));

gulp.task('unitTest', function(done) {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});
