var utils = require('./utils.js');
var fs = require('fs');
var md5 = require('MD5');
var C = require('c0lor');
var FlatColors = require("flatcolors");

var ColorThief = require('color-thief');
var colorThief = new ColorThief();
var imagecolors = require('imagecolors');

var ColorSpace = C.space.rgb['CIE-RGB'];

function getColorForUrl(url, callback) {
  var path = "./tmp/" + md5(url);
  utils.download(url, path, function() {

    try {

      // var image = fs.readFileSync(path);

      // var originalrgb = colorThief.getColor(image, 1);
      imagecolors.extract(path, 10, function(err, colors) {
        if (!err) {
          var colorObject = buildColorObjectFromColors(colors);
          callback(colorObject);
        } else {
          callback(null);
        }
      });

    } catch (e) {
      console.log(e);
    }


  });
}

function buildColorObjectFromColors(colors) {
  var color = getColorFromColorArray(colors);

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

  var rgb = FlatColors(color.rgb.r, color.rgb.g, color.rgb.b);
  var originalRgb = [color.rgb.r, color.rgb.g, color.rgb.b];

  colorObject.rgb.red = originalRgb[0];
  colorObject.rgb.green = originalRgb[1];
  colorObject.rgb.blue = originalRgb[2];
  colorObject.hex = color.hex;
  colorObject.int = 65536 * originalRgb[0] + 256 * originalRgb[1] + originalRgb[2];

  // Doesn't work
  //var colorFormats = C.RGB(rgb[0], rgb[1], rgb[2]);
  //colorObject.xyz = ColorSpace.XYZ(colorFormats);
  //

  X = 1.076450 * rgb[0] - 0.237662 * rgb[1] + 0.161212 * rgb[2];
  Y = 0.410964 * rgb[0] + 0.554342 * rgb[1] + 0.034694 * rgb[2];
  Z = -0.010954 * rgb[0] - 0.013389 * rgb[1] + 1.024343 * rgb[2];

  colorObject.xyz = {
    x: X,
    y: Y,
    z: Z
  };

  return colorObject;

}

function getColorFromColorArray(colors) {
  colors.sort(function(a, b) {
    if (a.family == "dark") {
      return -1;
    }

    if (a.luminance < b.luminance) {
      return 1;
    } else if (a.luminance == b.luminance) {
      return 0;
    } else {
      return -1;
    }
  });

  var color = colors[Math.floor(Math.random() * colors.length)];

  return colors[3];
}

if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}

module.exports.getColorForUrl = getColorForUrl;