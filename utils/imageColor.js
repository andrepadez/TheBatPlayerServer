var onecolor = require('onecolor');
var utils = require('./utils.js');
var fs = require('fs');
var md5 = require('MD5');

var ColorThief = require('color-thief');
var colorThief = new ColorThief();

function getColorForUrl(url, callback) {
  var path = "./tmp/" + md5(url);
  utils.download(url, path, function() {

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

    try {

      var image = fs.readFileSync(path);
      var rgb = colorThief.getColor(image, 1);

      colorObject.rgb.red = rgb[0];
      colorObject.rgb.green = rgb[1];
      colorObject.rgb.blue = rgb[2];

      var rgbstring = "rgb(" + colorObject.rgb.red + "," + colorObject.rgb.green + "," + colorObject.rgb.blue + ")";
      // var colorFormats = onecolor(rgbstring).black(0.5, true).saturation(1.0, true);
      var colorFormats = onecolor(rgbstring);

      colorObject.hex = colorFormats.hex();

      colorObject.hsv.hue = Math.round(colorFormats.hsl().hue() * 65280);
      colorObject.hsv.sat = Math.round(colorFormats.hsl().saturation() * 256);
      colorObject.hsv.val = Math.round(colorFormats.value() * 256);
      colorObject.int = 65536 * colorObject.rgb.red + 256 * colorObject.rgb.green + colorObject.rgb.blue;
    } catch (e) {
      console.log(e);
    }

    callback(colorObject);

  });
}
module.exports.getColorForUrl = getColorForUrl;