var utils = require("../utils/utils.js");
var config = require("../config.js");
var log = utils.log;

var LastfmAPI = require('lastfmapi');
var lastfm = new LastfmAPI({
  api_key: "62be1c8445c92c28e5b36f548c069f69"
});

function albumUsingLastFM(artist, track, callback) {
  getTrackDetails(artist, track, function(error, trackObject) {
    if (!error && trackObject && trackObject.album) {
      getAlbumDetails(artist, trackObject.album.title, trackObject.album.title.mbid, function(error, albumResult) {
        callback(error, albumResult);
      });
    } else {
      callback(error, null);
    }

  });
}

function getAlbumArt(albumName, artistName, mbid, callback) {
  var cacheKey = ("cache-lastfmart-" + albumName + "-" + artistName).slugify();
  utils.getCacheData(cacheKey, function(error, result) {
    if (!error && result !== undefined) {
      callback(error, result);
    } else {
      lastfm.album.getInfo({
        album: albumName,
        artist: artistName,
        mbid: mbid,
        autocorrect: 1
      }, function(error, albumDetails) {
        if (!error) {
          var images = albumDetails.image;
          var image = images[images.length - 2];
          var url = image["#text"];
          callback(error, url);
        } else {
          callback(error, null);
        }
      });
    }
  });
}

function getAlbumDetails(artistName, albumName, mbid, callback) {
  var cacheKey = ("cache-album-" + albumName + "-" + artistName).slugify();

  utils.getCacheData(cacheKey, function(error, result) {
    if (!error && result !== undefined) {
      callback(error, result);
    } else {
      lastfm.album.getInfo({
        artist: artistName,
        album: albumName,
        mbid: mbid,
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
    if (!error && result !== undefined) {
      callback(error, result);
    } else {
      lastfm.track.getInfo({
        artist: artistName,
        track: trackName,
        autocorrect: 1
      }, function(err, trackDetails) {
        log("Fetched track from lastfm");
        utils.cacheData(cacheKey, trackDetails, 0);
        callback(null, trackDetails);
      });

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

module.exports.getAlbumArt = getAlbumArt;
module.exports.getArtistDetails = getArtistDetails;
module.exports.getTrackDetails = getTrackDetails;
module.exports.getAlbumDetails = getAlbumDetails;
module.exports.albumUsingLastFM = albumUsingLastFM;