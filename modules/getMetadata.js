var streamtitle = require("./streamTitle.js");
var shoutcasttitle = require("./getTitleShoutcast.js");
var utils = require("../utils/utils.js");
var log = utils.log;
var lastfm = require('./lastfm.js');
var async = require("async");
var moment = require("moment");
var album = require("./getAlbum.js");
var md5 = require('MD5');
var config = require("../config.js");

var S = require('string');
S.extendPrototype();

function fetchMetadataForUrl(url, req, mainCallback) {

  var track = null;
  var fetchMethodCacheTime = 21600;
  var streamCacheKey = ("cache-stream-" + url).slugify();

  var sourceStreamCacheKey = ("cache-source-stream-" + url).slugify();
  var metadataSource;
  var streamFetchMethodCacheKey = ("cache-stream-fetchmethod" + url).slugify();
  // global.memcacheClient = req.app.memcacheClient;

  if (url.endsWith("/;")) {
    url = url + "/;";
  }

  utils.getCacheData(streamFetchMethodCacheKey, function(error, result) {
    metadataSource = result;


    async.series([

        // Check for a cached version
        function(callback) {
          utils.getCacheData(streamCacheKey, function(error, result) {
            if (!error && result) {
              track = result;
              mainCallback(track);
              return;
              // cleanup();
            } else {
              callback();
            }
          });
        },

        // Get the title from Shoutcast v1 metadata
        function(callback) {
          if (track === null && (metadataSource != "SHOUTCAST_V2" && metadataSource != "STREAM")) {
            shoutcasttitle.getV1Title(url, function(data) {
              if (data) {
                track = utils.createTrackFromTitle(data.title);
                track.station = data;
                if (!metadataSource) {
                  utils.cacheData(streamFetchMethodCacheKey, "SHOUTCAST_V1", fetchMethodCacheTime);
                }
              }
              callback();
            });
          } else {
            callback();
          }
        },

        // Get the title from Shoutcast v2 metadata
        function(callback) {
          if (track === null && (metadataSource != "SHOUTCAST_V1" && metadataSource != "STREAM")) {
            shoutcasttitle.getV2Title(url, function(data) {
              if (data) {
                track = utils.createTrackFromTitle(data.title);
                track.station = data;
                if (!metadataSource) {
                  utils.cacheData(streamFetchMethodCacheKey, "SHOUTCAST_V2", fetchMethodCacheTime);
                }

              }
              callback();
            });
          } else {
            callback();
          }

        },

        // Get the title from the station stream
        function(callback) {
          if (track === null && (metadataSource != "SHOUTCAST_V2" && "SHOUTCAST_V1")) {
            streamtitle.getTitle(url, function(title) {
              if (title) {
                track = utils.createTrackFromTitle(title);
                track.station = {};
                track.station.fetchsource = "STREAM";
                utils.cacheData(streamFetchMethodCacheKey, "STREAM", fetchMethodCacheTime);
              }
              callback();
            });
          } else {
            callback();
          }
        },

        function(asyncCallback) {
          if (track) {

            async.parallel([
                function(callback) {
                  async.series([ //Begin Artist / Color series

                    // Get artist
                    function(callback) {
                      getArtistDetails(track, callback);
                    },

                    // Get color based on above artist image
                    function(callback) {
                      getColor(track, function() {
                        if (track.image.url) {
                          var file = encodeURIComponent(track.image.url);
                          track.image.backgroundurl = config.hostname + "/images/background/" + file + "/" + track.image.color.rgb.red + "/" + track.image.color.rgb.green + "/" + track.image.color.rgb.blue;
                          track.image.url = config.hostname + "/images/artist/" + file + "/" + track.image.color.rgb.red + "/" + track.image.color.rgb.green + "/" + track.image.color.rgb.blue;
                        }
                        callback();
                      });
                    }

                  ], function(err, results) {
                    callback();
                  }); // End Artist / Color series
                },

                // Get track Details
                function(callback) {
                  if (track.song && track.artist) {
                    getTrackDetails(track, callback);
                  } else {
                    callback();
                  }

                },

                // Get Album for track
                function(callback) {
                  if (track.artist && track.song) {
                    getAlbumDetails(track, function(albumObject) {
                      track.album = albumObject;
                      callback();
                    });
                  } else {
                    track.album = null;
                    callback();
                  }
                }


              ],
              function(err, results) {
                asyncCallback(); // Track and Album details complete
              });
          } else {
            asyncCallback(); // No track exists so track and album details could not take place

          }
        }
      ],
      function(err) {
        // If no track was able to be created return an empty object
        if (!track) {
          track = createEmptyTrack();
        }
        expires = Math.round(new Date().getTime() / 1000) + config.cachetime;
        track.expires = expires;
        utils.cacheData(streamCacheKey, track, config.cachetime);

        mainCallback(track);
      });
  });

}

function getArtistDetails(track, callback) {
  lastfm.getArtistDetails(utils.sanitize(track.artist), function(error, artistDetails) {
    populateTrackObjectWithArtist(track, artistDetails);
    callback();
  });
}

function getTrackDetails(track, callback) {
  lastfm.getTrackDetails(utils.sanitize(track.artist), utils.sanitize(track.song), function(error, trackDetails) {
    populateTrackObjectWithTrack(track, trackDetails);
    callback();
  });
}

function getAlbumDetails(track, callback) {
  album.fetchAlbumForArtistAndTrack(track.artist, track.song, function(error, albumDetails) {
    callback(albumDetails);
  });
}

function getColor(track, callback) {
  if (track.image.url) {
    utils.getColorForImage(track.image.url, function(color) {
      if (color) {
        track.image.color = color;
      }
      callback();
    });
  } else {
    callback();
  }

}

function createEmptyTrack() {
  var track = {};
  return track;
}

function populateTrackObjectWithArtist(track, apiData) {

  if (apiData) {
    try {
      var bioDate = moment(new Date(apiData.bio.published));
      var bioText = apiData.bio.summary.stripTags().trim().replace(/\n|\r/g, "");

      track.image.url = apiData.image.last()["#text"];
      track.isOnTour = parseInt(apiData.ontour);
      track.bio.text = bioText;
      track.bio.published = bioDate.year();
      track.tags = apiData.tags.tag.map(function(tagObject) {
        return tagObject.name;
      });
      track.metaDataFetched = true;
    } catch (e) {

    }
  }
}

function populateTrackObjectWithTrack(track, apiData) {

  if (apiData) {
    try {
      track.album.name = apiData.album.title;
      track.album.image = apiData.album.image.last()["#text"];
      track.metaDataFetched = true;
    } catch (e) {

    } finally {}

  }

}


if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}


module.exports.fetchMetadataForUrl = fetchMetadataForUrl;