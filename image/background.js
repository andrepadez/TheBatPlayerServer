var exec = require('child_process').exec;
var utils = require("../utils/utils.js");
var fs = require('fs');
var config = require("../config.js");

function createBackground(url, colorObject, callback) {

  var path = utils.getCacheFilepathForUrl(url, "backgrounds");
  var cacheFile = utils.getCacheFilepathForUrl(url, "original");

  fs.exists(path, function(exists) {
    if (exists && config.enableImageCache) {
      callback(null, path);
      return;
    }

    utils.download(url, cacheFile, function() {
      var command = "convert " + cacheFile + " +dither -colorspace gray -threshold 50% -normalize -sigmoidal-contrast 60,20% -fill \"rgb(" + colorObject.red + "," + colorObject.green + "," + colorObject.blue + ")\" -colorize 30% -blur 5 " + path;
      //console.log(command);

      var child = exec(command, null, function(err, stdout, stderr) {
        console.log("Complete");
        callback(err, path);
      });

    });
  });


}

module.exports.createBackground = createBackground;