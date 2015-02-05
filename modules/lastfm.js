var utils = require("../utils/utils.js");
var config = require("../config.js");
var log = utils.log;

var LastfmAPI = require('lastfmapi');
var lastfm = new LastfmAPI({
  api_key: "62be1c8445c92c28e5b36f548c069f69"
});

function usingLastFM(artist, track, callback) {
  // console.log("*** usingLastFM");

  getTrackDetails(artist, track, function(error, trackObject) {
    if (!error && trackObject && trackObject.album) {
      var albumTitle = trackObject.album.title;
      getAlbumDetails(artist, albumTitle, function(error, albumResult) {
        callback(error, albumResult);
      });
    } else {
      callback(error, null);
    }

  });
}

function getAlbumDetails(artistName, albumName, callback) {
  // console.log("*** getAlbumDetails");

  var cacheKey = ("cache-album-" + albumName + "-" + artistName).slugify();

  utils.getCacheData(cacheKey, function(error, result) {
    if (!error && result !== undefined && config.enableCache) {
      // console.log("Fetched album from cache");
      callback(error, result);
    } else {
      lastfm.album.getInfo({
        artist: artistName,
        album: albumName,
        autocorrect: 1
      }, function(err, albumDetails) {
        log("Fetched album from lastfm");
        utils.cacheData(cacheKey, albumDetails, 0);
        callback(err, albumDetails);
      });
    }
  });
}

function getTrackDetails(artistName, trackName, callback) {
  var cacheKey = ("cache-track-" + trackName + "-" + artistName).slugify();

  utils.getCacheData(cacheKey, function(error, result) {
    if (!error && result !== undefined && config.enableCache) {
      callback(error, result);
    } else {
      var track;
      try {
        lastfm.track.getInfo({
          artist: artistName,
          track: trackName,
          autocorrect: 1
        }, function(err, trackDetails) {
          track = trackDetails;
          log("Fetched track from lastfm");
          utils.cacheData(cacheKey, trackDetails, 0);
        });
      } catch (e) {
        log("*** Exception in getTrackDetails:");
        log(e);
      }

      callback(null, track);
    }
  });
}

function getArtistDetails(artistName, callback) {
  var artistCacheKey = ("cache-artist-" + artistName).slugify();

  utils.getCacheData(artistCacheKey, function(error, result) {
    if (!error && result !== undefined && config.enableCache) {
      callback(error, result);
    } else {
      lastfm.artist.getInfo({
        artist: artistName,
        autocorrect: 1
      }, function(err, artistDetails) {
        utils.cacheData(artistCacheKey, artistDetails, 0);
        callback(err, artistDetails);
      });
    }
  });

}

module.exports.getArtistDetails = getArtistDetails;
module.exports.getTrackDetails = getTrackDetails;
module.exports.getAlbumDetails = getAlbumDetails;
module.exports.usingLastFM = usingLastFM;