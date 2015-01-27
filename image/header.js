var exec = require('child_process').exec;
var utils = require("../utils/utils.js");
var fs = require('fs');
var config = require("../config.js");

function createHeader(text, callback) {

  var path = utils.getCacheFilepathForUrl(text, "header");

  fs.exists(path, function(exists) {
    if (exists && config.enableImageCache) {
      callback(null, path);
      return;
    }

    var command = "convert ./image/resources/selection_bat_logo-HD.png -background Transparent -stroke \"#F4B6AF\" -fill \"#F4B6AF\" -font ./image/resources/Calibri.ttf -pointsize 25 -annotate +380+140 \"" + text + " \" " + path;
    console.log(command);

    var child = exec(command, null, function(err, stdout, stderr) {
      console.log("Complete");
      console.log(stderr);
      callback(err, path);
    });

  });


}

module.exports.createHeader = createHeader;