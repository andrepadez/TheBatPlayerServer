var fs = require('fs');
var imagemagick = require('imagemagick-native');

fs.createReadStream('test.jpg').pipe(imagemagick.streams.convert({
  // options
})).pipe(fs.createWriteStream('test2.jpg'));