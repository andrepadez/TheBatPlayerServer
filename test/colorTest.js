var expect = require("chai").expect;

var utils = require("../utils/utils.js");
var imageColor = require("../utils/imageColor.js");
var backgroundImage = require("../image/background.js");
var fs = require('fs');
var md5 = require('MD5');


//var url = "http://userserve-ak.last.fm/serve/500/35850125/Kick+Bong+l_eb03469af44d49daa5dc2d1a4ca5.jpg"; //Dark
//var url = "http://userserve-ak.last.fm/serve/500/80847757/Bruderschaft+5911681563_c082f9b14d_z.jpg"; //Too blue
//var url = "http://userserve-ak.last.fm/serve/_/100954947/Spiral+System.jpg" //dark
//var url = "http://userserve-ak.last.fm/serve/500/197829/Lords+of+Acid+Violet.jpg"; // Dark purple
//var url = "http://userserve-ak.last.fm/serve/_/433759/Frozen+Plasma.jpg"; //Should return blue but returns pink
//var url = "http://userserve-ak.last.fm/serve/500/2535509/Nine+Inch+Nails+nin.jpg"; //Red but returns yellow
//var url = "http://userserve-ak.last.fm/serve/500/47816687/Miss+FD+missfdenterthevoidpressweb.jpg";
var url = "http://userserve-ak.last.fm/serve/_/69949826/Cesium137+1213ad5820.jpg"; // Blue but returns flesh color
//var url = "http://userserve-ak.last.fm/serve/_/117427/SD6.jpg"; // Output not colorful enough

describe("createBackground", function() {
  it("Should create a background image from url and color", function(done) {
    imageColor.getColorForUrl(url, function(colorObject) {
      var path = "./tmp/" + md5(url);
      backgroundImage.createBackground(url, colorObject.rgb, function(error, backgroundImagePath) {

        var html = "<body bgcolor=" + colorObject.hex + "><img src=" + url + "><br><img src=" + backgroundImagePath + "></body>";
        fs.writeFile("colorTest.html", html);
        done();
      });

    });

  });
});