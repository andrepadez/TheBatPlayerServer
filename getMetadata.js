var streamtitle = require("./streamTitle.js");
var shoutcasttitle = require("./getTitleShoutcast.js");
var utils = require("./utils/utils.js");
var lastfm = require('./utils/lastfm.js');
var async = require("async");
var moment = require("moment");
var album = require("./getAlbum.js");
var md5 = require('MD5');

var S = require('string');
S.extendPrototype();

function fetchMetadataForUrl(url, req, mainCallback) {

  var track = null;
  var fetchMethodCacheTime = 21600;
  var streamCacheKey = ("cache-stream-" + url).slugify();

  var sourceStreamCacheKey = ("cache-source-stream-" + url).slugify();
  var metadataSource;
  var streamFetchMethodCacheKey = ("cache-stream-fetchmethod" + url).slugify();
  global.memcacheClient = req.app.memcacheClient;

  if (url.endsWith("/;")) {
    url = url + "/;";
  }

  global.memcacheClient.get(streamFetchMethodCacheKey, function(error, result) {
    metadataSource = result;
    // console.log("Cached metadata source: " + result);

    async.series([

        // Check for a cached version
        function(asyncCallback) {
          global.memcacheClient.get(streamCacheKey, function(error, result) {
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
          if (track === null && (metadataSource != "SHOUTCAST_V2" && metadataSource != "STREAM")) {
            shoutcasttitle.getV1Title(url, function(data) {
              if (data) {
                track = utils.createTrackFromTitle(data.title);
                track.station = data;
                if (!metadataSource) {
                  utils.cacheData(streamFetchMethodCacheKey, "SHOUTCAST_V1", fetchMethodCacheTime);
                }
              }
              asyncCallback();
            });
          } else {
            asyncCallback();
          }
        },

        // Get the title from Shoutcast v2 metadata
        function(asyncCallback) {
          if (track === null && (metadataSource != "SHOUTCAST_V1" && metadataSource != "STREAM")) {
            shoutcasttitle.getV2Title(url, function(data) {
              if (data) {
                track = utils.createTrackFromTitle(data.title);
                track.station = data;
                if (!metadataSource) {
                  utils.cacheData(streamFetchMethodCacheKey, "SHOUTCAST_V2", fetchMethodCacheTime);
                }

              }
              asyncCallback();
            });
          } else {
            asyncCallback();
          }

        },

        // Get the title from the station stream
        function(asyncCallback) {
          if (track === null && (metadataSource != "SHOUTCAST_V2" && "SHOUTCAST_V1")) {
            streamtitle.getTitle(url, function(title) {
              if (title) {
                track = utils.createTrackFromTitle(title);
                track.station = {};
                track.station.fetchsource = "STREAM";
                utils.cacheData(streamFetchMethodCacheKey, "STREAM", fetchMethodCacheTime);

              }
              asyncCallback();
            });
          } else {
            asyncCallback();
          }
        },

        function(asyncCallback) {
          if (track) {
            async.parallel([

                // Artist details
                function(callback) {
                  lastfm.getArtistDetails(utils.sanitize(track.artist), function(error, artistDetails) {
                    populateTrackObjectWithArtist(track, artistDetails);
                    utils.getColorForImage(track.image.url, function(color) {
                      if (color) {
                        track.image.color = color;
                        track.image.url = "http://api.thebatplayer.fm/mp3info/downloaded-images/" + md5(track.image.url);
                        createArtistImage(track.image.url);
                      }
                      callback();
                    });
                  });

                },

                // Track Details
                function(callback) {
                  if (track.song && track.artist) {
                    lastfm.getTrackDetails(utils.sanitize(track.artist), utils.sanitize(track.song), function(error, trackDetails) {
                      populateTrackObjectWithTrack(track, trackDetails);
                      callback();
                    });
                  } else {
                    callback();
                  }

                },

                // Album details
                function(callback) {
                  if (track.artist && track.song) {
                    album.fetchAlbumForArtistAndTrack(track.artist, track.song, function(error, albumDetails) {
                      populateTrackObjectWithAlbum(track, albumDetails);
                      callback();
                    });
                  } else {
                    track.album = null;
                    callback();
                  }
                }


              ],
              function(err) {
                asyncCallback();
              });
          } else {
            asyncCallback();

          }
        }
      ],
      function(err) {
        if (!track) {
          track = createEmptyTrack();
        }
        expires = Math.round(new Date().getTime() / 1000) + 5;
        track.expires = expires;

        mainCallback(track);
        utils.cacheData(streamCacheKey, track, 5);
        //cleanup();
      });
  });

}

function createArtistImage(originalUrl) {
  var url = "http://api.thebatplayer.fm/mp3info-dev/artistImage.php?url=" + encodeURIComponent(originalUrl);
  utils.download(url, "./tmp/" + md5(url), null);
}

function createEmptyTrack() {
  var track = {};
  return track;
}

function populateTrackObjectWithAlbum(track, albumData) {
  // try {
  if (albumData) {
    var album = {};
    album.image = albumData.image;
    album.name = albumData.name;
    album.released = albumData.released;

    track.album = album;
  } else {
    track.album = null;
  }
  // } catch (e) {
  //
  // } finally {
  //   track.album = null;
  // }
}

function populateTrackObjectWithArtist(track, apiData) {

  if (apiData) {
    try {
      var bioDate = moment(new Date(apiData.bio.published));
      var bioText = apiData.bio.summary.stripTags().trim().replace(/\n|\r/g, "");

      //track.artist = apiData.name.trim();
      track.image.url = apiData.image.last()["#text"];
      track.isOnTour = parseInt(apiData.ontour);
      track.bio.text = bioText;
      track.bio.published = bioDate.year();

      track.tags = apiData.tags.tag.map(function(tagObject) {
        return tagObject.name;
      });
      //
      track.metaDataFetched = true;
    } catch (e) {

    }
  }
}

function populateTrackObjectWithTrack(track, apiData) {

  if (apiData) {
    try {
      track.album.name = apiData.album.title;
      //track.artist = apiData.artist.name;
      track.album.image = apiData.album.image.last()["#text"];
      track.metaDataFetched = true;

      // var releaseDate = moment(new Date(apiData.album.releaseDate)).format();
      // track.album.releaseDate = releaseDate; //releaseDate.substr(0, releaseDate.length - 6);
    } catch (e) {

    } finally {
      //track.album = null;
    }

  }

}


if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}


module.exports.fetchMetadataForUrl = fetchMetadataForUrl;