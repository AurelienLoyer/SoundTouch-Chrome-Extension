// dependencies
var gulp = require('gulp'),
git = require('gulp-git'),
bump = require('gulp-bump'),
filter = require('gulp-filter'),
tag_version = require('gulp-tag-version');

function inc(importance) {
  // get all the files to bump version in
  return gulp.src(['./package.json', './manifest.json'])
  // bump the version number in those files
  .pipe(bump({type: importance}))
  // save it back to filesystem
  .pipe(gulp.dest('./'))
  // commit the changed version number
  .pipe(git.commit('chore: bumps package version 🚀'))

  // read only one file to get the version number
  .pipe(filter('package.json'))
  // **tag it in the repository**
  .pipe(tag_version())
  //push tag
  .pipe(cb(function() {
    git.push('origin','master', {args: " --tags"}, function (err) {
      if (err) throw err;
    });
  }));
}

function cb(obj) {
  var stream = new require('stream').Transform({objectMode: true});
  stream._transform = function(file, unused, callback) {
    obj();
    callback(null, file);
  };
  return stream;
}

gulp.task('patch', function() { return inc('patch'); })
gulp.task('feature', function() { return inc('minor'); })
gulp.task('release', function() { return inc('major'); })
