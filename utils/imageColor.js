var onecolor = require('onecolor');
var utils = require('./utils.js');
var fs = require('fs');
var md5 = require('MD5');

var ColorThief = require('color-thief');
var colorThief = new ColorThief();

function getColorForUrl(url, callback) {
  var path = "./tmp/" + md5(url);
  utils.download(url, path, function() {

    var image = fs.readFileSync(path);
    var rgb = colorThief.getColor(image);

    var colorObject = {
      rgb: {
        red: null,
        green: null,
        blue: null
      },
      hex: null,
      hsv: {
        hue: null,
        sat: null,
        val: null
      },
      int: null
    };

    colorObject.rgb.red = rgb[0];
    colorObject.rgb.green = rgb[1];
    colorObject.rgb.blue = rgb[2];

    var rgbstring = "rgb(" + colorObject.rgb.red + "," + colorObject.rgb.green + "," + colorObject.rgb.blue + ")";
    var colorFormats = onecolor(rgbstring);

    colorObject.hex = colorFormats.hex();

    colorObject.hsv.hue = colorFormats.hsl().hue();
    colorObject.hsv.sat = colorFormats.hsl().saturation();
    colorObject.hsv.val = colorFormats.hsl().lightness();
    colorObject.int = 65536 * colorObject.rgb.red + 256 * colorObject.rgb.green + colorObject.rgb.blue;

    callback(colorObject);

  });
}
module.exports.getColorForUrl = getColorForUrl;