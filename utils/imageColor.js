var utils = require('./utils.js');
var fs = require('fs');
var md5 = require('MD5');
var log = utils.log;
var async = require("async");

var imagecolors = require('imagecolors');
var colormatch = require('colormatch');


function getColorForUrl(url, callback) {
  var path = utils.getCacheFilepathForUrl(url, "original");

  utils.download(url, path, function() {

    try {
      imagecolors.extract(path, 7, function(err, colors) {

        if (!err && colors.length > 0) {
          buildColorObjectFromColors(colors, callback);
        } else {
          callback(null);
        }
      });

    } catch (e) {
      log(e);
      callback(null);
    }


  });
}

function buildColorObjectFromColors(colors, callback) {
  var colorObject = {
    rgb: {
      red: null,
      green: null,
      blue: null
    },
    hex: null,
    int: null,
    xyz: null
  };

  getColorFromColorArray(colors, function(color) {
    var rgb = [color.rgb.r, color.rgb.g, color.rgb.b];

    colorObject.rgb.red = rgb[0];
    colorObject.rgb.green = rgb[1];
    colorObject.rgb.blue = rgb[2];
    colorObject.hex = color.hex;
    colorObject.int = 65536 * rgb[0] + 256 * rgb[1] + rgb[2];

    X = 1.076450 * rgb[0] - 0.237662 * rgb[1] + 0.161212 * rgb[2];
    Y = 0.410964 * rgb[0] + 0.554342 * rgb[1] + 0.034694 * rgb[2];
    Z = -0.010954 * rgb[0] - 0.013389 * rgb[1] + 1.024343 * rgb[2];

    colorObject.xyz = {
      x: X,
      y: Y,
      z: Z
    };

    callback(colorObject);
  });

}

function getColorFromColorArray(colors, mainCallback) {

  async.sortBy(colors, function(singleColor, callback) {
    var colorVal = (singleColor.score.vivid * singleColor.luminance) * singleColor.percent;
    callback(null, colorVal * -1);
  }, function(error, colors) {
    async.filter(colors, function(singleColor, callback) {

      if (singleColor.family === "dark") {
        return callback(false);
      }

      if (singleColor.family === "black") {
        return callback(false);
      }

      if (singleColor.family === "white") {
        return callback(false);
      }

      if (isBannedColor(singleColor)) {
        return callback(false);
      }

      return callback(true);

    }, function(updatedColors) {
      if (updatedColors.length === 0) {
        console.log("no colors detected.  Using fallback.");
      }
      var color = updatedColors[0] || colors[3];
      mainCallback(color);
    });

  });
}

function isBannedColor(color) {
  var bannedColor = {
    red: 239,
    green: 208,
    blue: 207
  };
  if (color.family === "orange") {
    var colorDistance = Math.sqrt((bannedColor.red - color.rgb.r) ^ 2 + (bannedColor.green - color.rgb.g) ^ 2 + (bannedColor.blue - color.rgb.b) ^ 2);
    var similarityPercentage = colorDistance / Math.sqrt((255) ^ 2 + (255) ^ 2 + (255) ^ 2);
    console.log("Similarity perentage: " + similarityPercentage);
    if (similarityPercentage > 0.7) {
      return true;
    }
  }
  return false;
}

if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}

module.exports.getColorForUrl = getColorForUrl;