var utils = require("../utils/utils.js");
var imageColor = require("../utils/imageColor.js");
var fs = require('fs');
var start = new Date();

//var url = "http://userserve-ak.last.fm/serve/500/35850125/Kick+Bong+l_eb03469af44d49daa5dc2d1a4ca5.jpg"; //Dark
var url = "http://userserve-ak.last.fm/serve/500/80847757/Bruderschaft+5911681563_c082f9b14d_z.jpg"; //Too blue

var callback = function(colorObject) {
  var html = "<body bgcolor=" + colorObject.hex + "><img src=http://api.thebatplayer.fm/mp3info-dev/artistImage.php?url=" + url + "></body>"
  fs.writeFile("colorTest.html", html);
  var end = new Date() - start;
  console.info("Execution time: %dms", end);
};

imageColor.getColorForUrl(url, callback);