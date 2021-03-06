var exec = require('child_process').exec;
var utils = require("../utils/utils.js");
var fs = require('fs');
var config = require("../config.js");
var log = utils.log;

function resizeImage(url, width, height, callback) {

  var path = utils.getCacheFilepathForUrl(url, "resize");
  var cacheFile = utils.getCacheFilepathForUrl(url, "original");

  fs.exists(path, function(exists) {
    if (exists && config.enableImageCache) {
      callback(null, path);
      return;
    }

    utils.download(url, cacheFile, function() {
      var size = width + "x" + height;
      var command = "convert " + cacheFile + " -resize " + width + "x!  -gravity Center -crop " + size + "+0+0 +repage -gravity SouthEast -append ./image/resources/smallbat.png -strip -quality 95 -composite " + path;

      var child = exec(command, null, function(err, stdout, stderr) {
        log(stderr);
        callback(err, path);
      });

    });
  });


}

module.exports.resizeImage = resizeImage;