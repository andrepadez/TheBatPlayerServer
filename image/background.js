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
      var rgb = "'rgb\(" + colorObject.red + "," + colorObject.green + "," + colorObject.blue + "\)'";
      var command = "convert " + cacheFile + " -colorspace RGB \\( -clone 0 -fill " + rgb + " -colorize 80% -auto-level \\) \\( -clone 0 -colorspace gray \\) -compose blend -define compose:args=80x20 -composite -sigmoidal-contrast 3,50% +dither -colors 10 -normalize -modulate 150,150 -resize 480x270\^ -gravity center -crop 480x270+0+0 -sharpen 3x3 -blur 5,2 " + path;
      console.log(command);

      var child = exec(command, null, function(err, stdout, stderr) {
        console.log("Complete");
        callback(err, path);
      });

    });
  });


}

module.exports.createBackground = createBackground;