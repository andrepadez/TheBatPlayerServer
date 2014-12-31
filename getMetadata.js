var streamtitle = require("./streamTitle.js");
var shoutcasttitle = require("./getTitleShoutcast.js");
var utils = require("./utils.js");
var LastfmAPI = require('lastfmapi');
var md5 = require('MD5');
var imageColor = require("./imageColor.js");
// var Memcached = require('memcached');
var async = require("async");
var moment = require("moment");

var S = require('string');

S.extendPrototype();

var lastfm = new LastfmAPI({
  api_key: "62be1c8445c92c28e5b36f548c069f69"
});

var memcacheClient = null;

function fetchMetadataForUrl(url, req, mainCallback) {

  var track = null;
  var streamCacheKey = ("cache-stream-" + url).slugify();
  var streamFetchMethodCacheKey = ("cache-stream-fetchmethod" + url).slugify();
  memcacheClient = req.app.memcacheClient;

  if (url.endsWith("/;")) {
    url = url + "/;";
  }

  async.series([

      // Initialize memcache
      // function(asyncCallback) {
      //   setupMemcache(asyncCallback);
      // },

      // Check for a cached version
      function(asyncCallback) {
        memcacheClient.get(streamCacheKey, function(error, result) {
          if (!error && result) {
            track = result;
            mainCallback(track);
            return;
            // cleanup();
          } else {
            asyncCallback();
          }
        });
      },

      // Get the title from Shoutcast v1 metadata
      function(asyncCallback) {
        if (track === null) {
          shoutcasttitle.getV1Title(url, function(data) {
            track = utils.createTrackFromTitle(data.title);
            track.station = data;
            asyncCallback();
          });
        } else {
          asyncCallback();
        }
      },

      // Get the title from Shoutcast v2 metadata
      function(asyncCallback) {
        if (track === null) {
          shoutcasttitle.getV2Title(url, function(data) {
            track = utils.createTrackFromTitle(data.title);
            track.station = data;
            asyncCallback();
          });
        } else {
          asyncCallback();
        }

      },

      // Get the title from the station stream
      function(asyncCallback) {
        if (track === null) {
          streamtitle.getTitle(url, function(title) {
            track = utils.createTrackFromTitle(title);
          });
        }
        asyncCallback();
      },

      function(asyncCallback) {
        async.parallel([

            // Artist details
            function(parallelAsyncCallback1) {
              getArtistDetails(sanitize(track.artist), function(error, artistDetails) {
                populateTrackObjectWithArtist(track, artistDetails);
                getColorForImage(track.image.url, function(color) {
                  if (color) {
                    track.image.color = color;
                  }
                  parallelAsyncCallback1();
                });
              });

            },

            // Track Details
            function(parallelAsyncCallback2) {
              getTrackDetails(sanitize(track.artist), sanitize(track.song), function(error, trackDetails) {
                populateTrackObjectWithTrack(track, trackDetails);
                parallelAsyncCallback2();
              });

            },


          ],
          function(err) {
            asyncCallback();
          });

      }
    ],
    function(err) {
      expires = Math.round(new Date().getTime() / 1000) + 5;
      track.expires = expires;

      mainCallback(track);
      cacheData(streamCacheKey, track, 5);
      //cleanup();
    });

}



function getArtistDetails(artistName, callback) {
  var artistCacheKey = ("cache-artist-" + artistName).slugify();

  memcacheClient.get(artistCacheKey, function(error, result) {
    if (!error && result !== undefined) {
      callback(error, result);
    } else {
      lastfm.artist.getInfo({
        artist: artistName,
        autocorrect: 1
      }, function(err, artistDetails) {
        cacheData(artistCacheKey, artistDetails, 0);
        callback(err, artistDetails);
      });
    }
  });

}

function getTrackDetails(artistName, trackName, callback) {
  var trackCacheKey = ("cache-song-" + artistName + "-" + trackName).slugify();

  memcacheClient.get(trackCacheKey, function(error, result) {
    if (!error && result !== undefined) {
      console.log("Fetched track from cache");
      callback(error, result);
    } else {
      lastfm.track.getInfo({
        artist: artistName,
        track: trackName,
        autocorrect: 1
      }, function(err, trackDetails) {
        console.log("Fetched track from api");
        cacheData(trackCacheKey, trackDetails, 0);
        callback(err, trackDetails);
      });
    }
  });
}


function getColorForImage(url, callback) {
  var colorCacheKey = ("cache-color-" + md5(url)).slugify();

  memcacheClient.get(colorCacheKey, function(error, result) {
    if (!error && result !== undefined) {
      callback(result);
    } else {
      imageColor.getColorForUrl(url, function(color) {
        callback(color);
        cacheData(colorCacheKey, color, 0);
      });
    }
  });

}


function populateTrackObjectWithArtist(track, apiData) {

  try {
    var bioDate = moment(apiData.bio.published).format();

    track.artist = apiData.name.trim();
    track.image.url = apiData.image.last()["#text"];
    track.isOnTour = apiData.ontour;
    track.bio.text = apiData.bio.summary.stripTags().trim();
    track.bio.published = bioDate.substr(0, bioDate.length - 6);

    track.tags = apiData.tags.tag.map(function(tagObject) {
      return tagObject.name;
    });

    track.metaDataFetched = true;
  } catch (e) {

  }

}

function populateTrackObjectWithTrack(track, apiData) {

  if (apiData !== null) {
    try {
      var releaseDate = moment(apiData.album.releaseDate);
      track.album.name = apiData.album.title;
      track.artist = apiData.artist.name;
      track.album.image = apiData.album.image.last()["#text"];
      track.album.releaseDate = releaseDate.substr(0, releaseDate.length - 6);
      track.metaDataFetched = true;
    } catch (e) {

    } finally {
      track.album = null;
    }

  }

}

function setupMemcache(callback) {
  if (memcacheClient === null) {
    memcacheClient = new Memcached();
    memcacheClient.connect("127.0.0.1:11211", callback);
  } else {
    callback();
  }
}

function cleanup() {
  // memcacheClient.end();
}

function cacheData(key, value, lifetime) {
  console.log("Caching: " + key + " : " + value);
  memcacheClient.set(key, value, lifetime, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}

function sanitize(string) {
  if (string.indexOf("(") > -1) {
    string = string.substring(0, string.indexOf("("));
  }
  if (string.indexOf(" ft") > -1) {
    string = string.substring(0, string.indexOf("ft"));
  }
  if (string.indexOf(" vs") > -1) {
    string = string.substring(0, string.indexOf("vs"));
  }

  return string;
}



module.exports.fetchMetadataForUrl = fetchMetadataForUrl;