var gm = require('gm');
var start = new Date();
var exec = require('child_process').exec;
var utils = require("../utils/utils.js");
var fs = require('fs');

function createBackground(url, colorObject, callback) {

    var path = utils.getCacheFilepathForUrl(url, "backgrounds");
    var cacheFile = utils.getCacheFilepathForUrl(url, "original");

    fs.exists(path, function(exists) {
      // if (exists) {
      //   callback(null, path);
      //   return;
      // }

      utils.download(url, cacheFile, function() {
        var command = "convert " + cacheFile + " +dither -colorspace gray -threshold 50% -normalize -sigmoidal-contrast 60,20% -fill \"rgb(" + colorObject.red + "," + colorObject.green + "," + colorObject.blue + ")\" -colorize 30% -blur 5 " + path;
        //console.log(command);

        var child = exec(command, null, function(err, stdout, stderr) {
          console.log("Complete");
          callback(err, path);
        });

      });
    });


  }
  // function createBackground(imagePath, colorObject, callback) {
  //   var image = gm(imagePath);
  //
  //   // image.identify(function(err, value) {
  //   //   //console.log(value);
  //   // });
  //
  //   image.size(function(err, sizeObject) {
  //     var outputWidth = 640;
  //     var blurAmount = 0;
  //
  //     var color = "rgb(" + colorObject.red + "," + colorObject.green + "," + colorObject.blue + ")";
  //     if (sizeObject.width < outputWidth) {
  //       var difference = outputWidth - sizeObject.width;
  //       blurAmount = blurAmount + (difference / 15);
  //     }
  //
  //     var targetBrightness = 30;
  //     var brightness = (0.299 * colorObject.red + 0.587 * colorObject.green + 0.114 * colorObject.blue);
  //     var updateBrightness = Math.round(Math.max(1, (targetBrightness - brightness)));
  //     console.log("Brightness offset: " + updateBrightness + ". Blur amount: " + blurAmount);
  //
  //     image
  //       .noProfile()
  //       .colorspace("gray")
  //       .level(15, updateBrightness)
  //       // .resize(outputWidth, ">")
  //       .fill(color)
  //       // .gamma(updateBrightness)
  //       // //.edge(20)
  //       // .contrast(+5)
  //       // .whiteThreshold(110)
  //       .colorize(30)
  //       // .blackThreshold(20)
  //       //.blur(blurAmount, 5)
  //       .write("./test.jpg", function(err) {
  //
  //         if (!err) {
  //           var end = new Date() - start;
  //           console.info("Image Filter Execution time: %dms", end);
  //           callback();
  //         } else {
  //           console.log(err);
  //         }
  //       });
  //   });
  // }
module.exports.createBackground = createBackground;