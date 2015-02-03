var exec = require('child_process').exec;
var utils = require("../utils/utils.js");
var fs = require('fs');
var config = require("../config.js");
var log = utils.log;

function createBackground(url, colorObject, callback) {

  var failCounter = 0;

  var path = utils.getCacheFilepathForUrl(url, "backgrounds");
  var cacheFile = utils.getCacheFilepathForUrl(url, "original");

  fs.exists(path, function(exists) {
    if (exists && config.enableImageCache) {
      callback(null, path);
      return;
    }

    utils.download(url, cacheFile, function() {

      var rgb = "'rgb\(" + colorObject.red + "," + colorObject.green + "," + colorObject.blue + "\)'";
      var command = "convert " + cacheFile + " -colorspace gray -colorspace RGB -resize 480x270\^ -morphology Open Octagon -gravity center -crop 480x270+0+40 -median 5 -fill " + rgb + " -auto-level -auto-gamma -colorize 25% -brightness-contrast -30x27 -sigmoidal-contrast 6x20% -strip " + path;

      var childCallback = function(err, stdout, stderr) {
        if (!err && !stderr) {
          callback(null, path);
        } else {
          log("Error: " + stderr);
          failCounter++;

          // if (failCounter < 4) {
          //   exec(command, null, childCallback);
          // } else {
          callback(stderr, cacheFile);
        }

        // }
      };


      exec(command, null, childCallback);

    });
  });


}

module.exports.createBackground = createBackground;