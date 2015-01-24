var utils = require("../utils/utils.js");
var imageColor = require("../utils/imageColor.js");
var backgroundImage = require("../image/background.js");
var fs = require('fs');
var md5 = require('MD5');

var start = new Date();

//var url = "http://userserve-ak.last.fm/serve/500/35850125/Kick+Bong+l_eb03469af44d49daa5dc2d1a4ca5.jpg"; //Dark
//var url = "http://userserve-ak.last.fm/serve/500/80847757/Bruderschaft+5911681563_c082f9b14d_z.jpg"; //Too blue
//var url = "http://userserve-ak.last.fm/serve/_/100954947/Spiral+System.jpg" //dark
//var url = "http://userserve-ak.last.fm/serve/500/197829/Lords+of+Acid+Violet.jpg"; // Dark purple
var url = "http://userserve-ak.last.fm/serve/_/433759/Frozen+Plasma.jpg"; //Should return blue but returns pink
//var url = "http://userserve-ak.last.fm/serve/500/2535509/Nine+Inch+Nails+nin.jpg"; //Red but returns yellow

var callback = function(colorObject) {

  var path = "./tmp/" + md5(url);
  backgroundImage.createBackground(url, colorObject.rgb, function(backgroundImagePath) {
    var end = new Date() - start;
    console.info("Color Execution time: %dms", end);

    var html = "<body bgcolor=" + colorObject.hex + "><img src=" + url + "><br><img src=" + backgroundImagePath + "></body>";
    fs.writeFile("colorTest.html", html);

  });
};

imageColor.getColorForUrl(url, callback);