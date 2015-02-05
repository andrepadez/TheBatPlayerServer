var request = require('request');
var fs = require('fs');
var imageColor = require("./imageColor.js");
var md5 = require('MD5');
var child_process = require('child_process');
var config = require("../config.js");
var path = require('path');
var rollbar = require('rollbar');

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

function download(url, filename, callback) {
  log(url + ' downloading to ' + filename);

  fs.exists(filename, function(exists) {
    if (!exists) {

      var tmpname = filename + "-tmp";
      var wget = "wget -O " + tmpname + " " + url;

      var child = child_process.exec(wget, null, function(err, stdout, stderr) {
        if (err) {
          throw err;
        } else {
          // Rename the file to the real filename
          child_process.exec("mv " + tmpname + " " + filename, null, function(err, stdout, stderr) {
            if (callback) {
              callback();
            }

          });
        }
      });
    } else {
      if (callback) {
        callback();
      }
    }
  });
}

function sanitize(string) {
  var checkString = string.toLowerCase();

  if (checkString.indexOf("(") > -1) {
    string = string.substring(0, checkString.indexOf("("));
  }
  if (checkString.indexOf(" ft") > -1) {
    string = string.substring(0, checkString.indexOf(" ft"));
  }
  if (checkString.indexOf(" feat") > -1) {
    string = string.substring(0, checkString.indexOf(" feat"));
  }
  if (checkString.indexOf(" vs") > -1) {
    string = string.substring(0, checkString.indexOf(" vs"));
  }
  if (checkString.indexOf(" versus ") > -1) {
    string = string.substring(0, checkString.indexOf(" versus "));
  }
  if (checkString.indexOf(" [") > -1) {
    string = string.substring(0, checkString.indexOf(" ["));
  }

  return string;
}

function cacheData(key, value, lifetime) {
  if (config.enableCache && key && value) {
    log("Caching: " + key);
    global.memcacheClient.set(key, value, lifetime, function(err) {
      if (err) {
        log(err);
      }
    });
  }
}

function getCacheData(key, callback) {
  if (!config.enableCache || !key) {
    global.memcacheClient.get(key, function(err, value) {
      if (err) {
        log(err);
      } else {
        callback(value);
      }
    });
  } else {
    callback(null, undefined);
  }
}

function getColorForImage(url, callback) {
  if (url) {
    var colorCacheKey = ("cache-color-" + md5(url)).slugify();

    getCacheData(colorCacheKey, function(error, result) {
      if (!error && result !== undefined) {
        callback(result);
      } else {
        imageColor.getColorForUrl(url, function(color) {
          cacheData(colorCacheKey, color, 0);
          callback(color);
        });
      }
    });
  } else {
    callback(null);
  }
}

function getCacheFilepathForUrl(url, type) {
  var filename = md5(url);
  var path = __dirname + "/../cache/" + type + "/" + filename;

  return path;
}

function log(text) {
  var env = process.env.NODE_ENV;
  rollbar.init('41d47860da4546f89ca78845565ee85c');

  if (env === "development") {
    console.log(text);
  }

  if (env === "production") {
    rollbar.reportMessage(text);
  }
}

module.exports.getCacheData = getCacheData;
module.exports.log = log;
module.exports.getColorForImage = getColorForImage;
module.exports.createTrackFromTitle = createTrackFromTitle;
module.exports.download = download;
module.exports.sanitize = sanitize;
module.exports.cacheData = cacheData;
module.exports.fixTrackTitle = fixTrackTitle;
module.exports.getCacheFilepathForUrl = getCacheFilepathForUrl;