var request = require('request');
var fs = require('fs');
var imageColor = require("./imageColor.js");
var md5 = require('MD5');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

function createTrackFromTitle(title) {
  titleArray = title.split(" - ");

  var track = {
    artist: titleArray[0],
    song: titleArray[1],
    track: title,
    album: {
      name: null,
      image: null,
      releaseDate: null
    },
    bio: {
      text: null,
      published: null
    },
    image: {
      url: null,
      color: {
        rgb: null,
        hex: null,
        hsv: null,
        int: null
      }
    },
    tags: null,
    isOnTour: false,
    metaDataFetched: false,
    expires: 0
  };

  return track;
}

function fixTrackTitle(trackString) {
  if (trackString.split(",").length > 1) {
    var titleArtist = trackString.split(",")[0];
    var titleSong = trackString.split(",")[1];

    // Fix the "The" issue
    if (titleSong.indexOf("The - ") !== -1) {
      titleSong = trackString.split(",")[1].split(" - ")[1];
      titleArtist = "The " + titleArtist;
    }

    return titleArtist + " - " + titleSong;
  } else {
    return trackString;
  }

}

// var download = function(uri, filename, callback) {
//   if (uri) {
//     console.log("Downloading " + uri);
//     request.head(uri, function(err, res, body) {
//       // console.log('content-type:', res.headers['content-type']);
//       // console.log('content-length:', res.headers['content-length']);
//
//       request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
//     });
//   }
// };

function download(url, filename, callback) {
  fs.exists(filename, function(exists) {
    if (!exists) {
      var wget = 'wget -O ' + filename + ' ' + url;

      var child = exec(wget, null, function(err, stdout, stderr) {
        if (err) throw err;
        else console.log(url + ' downloaded to ' + filename);
        callback();
      });
    } else {
      callback();
    }
  });
}

function sanitize(string) {
  if (string.indexOf("(") > -1) {
    string = string.substring(0, string.indexOf("("));
  }
  if (string.indexOf(" ft") > -1) {
    string = string.substring(0, string.indexOf(" ft"));
  }
  if (string.indexOf(" feat") > -1) {
    string = string.substring(0, string.indexOf(" feat"));
  }
  if (string.indexOf(" vs") > -1) {
    string = string.substring(0, string.indexOf(" vs"));
  }
  if (string.indexOf(" versus ") > -1) {
    string = string.substring(0, string.indexOf(" versus "));
  }

  return string;
}

function cacheData(key, value, lifetime) {
  console.log("Caching: " + key);
  if (key && value) {
    memcacheClient.set(key, value, lifetime, function(err) {
      if (err) {
        console.log(err);
      }
    });
  }
}

function getColorForImage(url, callback) {
  if (url) {
    var colorCacheKey = ("cache-color-" + md5(url)).slugify();

    global.memcacheClient.get(colorCacheKey, function(error, result) {
      if (!error && result !== undefined) {
        callback(result);
      } else {
        imageColor.getColorForUrl(url, function(color) {
          callback(color);
          cacheData(colorCacheKey, color, 0);
        });
      }
    });
  } else {
    callback(null);
  }
}
module.exports.getColorForImage = getColorForImage;
module.exports.createTrackFromTitle = createTrackFromTitle;
module.exports.download = download;
module.exports.sanitize = sanitize;
module.exports.cacheData = cacheData;
module.exports.fixTrackTitle = fixTrackTitle;