var exec = require('child_process').exec;
var utils = require("../utils/utils.js");
var fs = require('fs');
var config = require("../config.js");

function createArtistImage(url, colorObject, callback) {

  var path = utils.getCacheFilepathForUrl(url, "artists");
  var cacheFile = utils.getCacheFilepathForUrl(url, "original");

  fs.exists(path, function(exists) {
    if (exists && config.enableImageCache) {
      callback(null, path);
      return;
    }

    utils.download(url, cacheFile, function() {
      var rgb = "'rgb\(" + colorObject.red + "," + colorObject.green + "," + colorObject.blue + "\)'";
      var command = "/bin/bash image/createArtistImage.sh " + cacheFile + " " + rgb + " " + path;
      console.log(command);

      var child = exec(command, null, function(err, stdout, stderr) {
        console.log("Complete");
        callback(err, path);
      });

    });
  });


}

module.exports.createArtistImage = createArtistImage;