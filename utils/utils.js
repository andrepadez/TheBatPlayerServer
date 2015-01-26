var request = require('request');
var fs = require('fs');
var imageColor = require("./imageColor.js");
var md5 = require('MD5');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var config = require("../config.js");
var path = require('path');

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
  fs.exists(filename, function(exists) {
    if (!exists) {
      var wget = 'wget -O ' + filename + ' ' + url;

      var child = exec(wget, null, function(err, stdout, stderr) {
        if (err) throw err;
        else console.log(url + ' downloaded to ' + filename);
        if (callback) {
          callback();
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
    console.log("Caching: " + key);
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
module.exports.getColorForImage = getColorForImage;
module.exports.createTrackFromTitle = createTrackFromTitle;
module.exports.download = download;
module.exports.sanitize = sanitize;
module.exports.cacheData = cacheData;
module.exports.fixTrackTitle = fixTrackTitle;
module.exports.getCacheFilepathForUrl = getCacheFilepathForUrl;