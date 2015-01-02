var streamtitle = require("./streamTitle.js");
var shoutcasttitle = require("./getTitleShoutcast.js");
var utils = require("./utils/utils.js");
var lastfm = require('./utils/lastfm.js');
var async = require("async");
var moment = require("moment");
var album = require("./getAlbum.js");

var S = require('string');
S.extendPrototype();

function fetchMetadataForUrl(url, req, mainCallback) {

  var track = null;
  var streamCacheKey = ("cache-stream-" + url).slugify();
  var streamFetchMethodCacheKey = ("cache-stream-fetchmethod" + url).slugify();
  global.memcacheClient = req.app.memcacheClient;

  if (url.endsWith("/;")) {
    url = url + "/;";
  }

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
            function(callback) {
              lastfm.getArtistDetails(utils.sanitize(track.artist), function(error, artistDetails) {
                populateTrackObjectWithArtist(track, artistDetails);
                utils.getColorForImage(track.image.url, function(color) {
                  if (color) {
                    track.image.color = color;
                  }
                  callback();
                });
              });

            },

            // Track Details
            function(parallelAsyncCallback2) {
              if (track.song && track.artist) {
                lastfm.getTrackDetails(utils.sanitize(track.artist), utils.sanitize(track.song), function(error, trackDetails) {
                  populateTrackObjectWithTrack(track, trackDetails);
                  parallelAsyncCallback2();
                });
              } else {
                parallelAsyncCallback2();
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

      }
    ],
    function(err) {
      expires = Math.round(new Date().getTime() / 1000) + 5;
      track.expires = expires;

      mainCallback(track);
      utils.cacheData(streamCacheKey, track, 5);
      //cleanup();
    });

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

  try {
    var bioDate = moment(new Date(apiData.bio.published)).format();

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
      track.album.name = apiData.album.title;
      track.artist = apiData.artist.name;
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