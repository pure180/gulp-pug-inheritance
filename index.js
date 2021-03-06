'use strict';

var es = require('event-stream');
var _ = require("lodash");
var vfs = require('vinyl-fs');
var through2 = require('through2');
var gutil = require('gulp-util');
var PugInheritance = require('pug-inheritance');
var PLUGIN_NAME = 'gulp-pug-inheritance';


function gulpPugInheritance(options) {
  options = options || {};

  var stream;
  var errors = {};
  var files = [];

  function writeStream(currentFile) {
    if (currentFile && currentFile.contents.length) {
      files.push(currentFile);
    }
  }

  function endStream() {
    if (files.length) {
      var pugInheritanceFiles = [];
      var filesPaths = [];

      options = _.defaults(options, {'basedir': process.cwd()});

      _.forEach(files, function(file) {
        try {
          var pugInheritance = new PugInheritance(file.path, options.basedir, options);

        } catch (e) {
          // prevent multiple errors on the same file
          var alreadyShown;
          if (errors[e.message]) {
            alreadyShown = true;
          }

          clearTimeout(errors[e.message]);
          errors[e.message] = setTimeout(function () {
            delete errors[e.message];
          }, 500); //debounce

          if (alreadyShown) {
            return;
          }

          var err = new gutil.PluginError(PLUGIN_NAME, e);
          stream.emit("error", err);
          return;
        }

        var fullpaths = _.map(pugInheritance.files, function (file) {
          return options.basedir + "/" +  file;
        });

        filesPaths = _.union(filesPaths, fullpaths);
      });

      if(filesPaths.length) {
        vfs.src(filesPaths, {'base': options.basedir})
          .pipe(es.through(
            function (f) {
              stream.emit('data', f);
            },
            function () {
              stream.emit('end');
            }
        ));
      } else {
        stream.emit('end');
      }
    } else {
      stream.emit('end');
    }
  }

  stream = es.through(writeStream, endStream);

  return stream;
};

module.exports = gulpPugInheritance;
