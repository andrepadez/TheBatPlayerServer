var moment = require("moment");
var request = require('request');
var utils = require("../utils/utils.js");
var lastfm = require("./lastfm.js");
var config = require("../config.js");
var S = require('string');
var log = utils.log;
var async = require("async");
var _ = require('lodash');

var NC = require('nodecogs');
var discogs = new NC({
  userAgent: config.useragent,
  accessKey: "wVixYWymHCBOxPnvBDuk",
  accessSecret: "vOLvFLHEYXngOdMRFFkTenGlwQWIpdkm"
});

var CA = require('coverart');
var ca = new CA({
  userAgent: config.useragent
});

S.extendPrototype();

function fetchAlbumForArtistAndTrack(artist, track, mainCallback) {
  var albumObjectCacheKey = ("cache-artist-" + artist + "track-" + track).slugify();
  var album = null;

  async.series([

    // Try the cache
    function(callback) {
      utils.getCacheData(albumObjectCacheKey, function(error, albumResult) {

        if (!error && albumResult !== undefined && config.enableCache) {
          album = albumResult;
          return callback();
        }
        return callback();
      });

    },

    // Try Discogs
    function(callback) {
      if (!album) {
        getAlbumFromDiscogs(artist, track, function(error, albumObject) {
          if (!error & albumObject !== null) {
            albumObject.source = "Discogs";
            album = albumObject;
          }
          return callback();
        });
      } else {
        return callback();
      }
    },

    // Try Last.FM
    function(callback) {
      if (!album) {
        albumFromLastFM(artist, track, function(error, albumObject) {
          if (!error && albumObject) {
            albumObject.source = "LastFM";
            album = albumObject;
          }
          return callback();
        });
      } else {
        return callback();
      }
    },

    // Try musicbrainz
    function(callback) {
      if (!album) {
        getAlbumFromMusicbrainz(artist, track, function(error, albumObject) {
          if (!error && albumObject) {
            albumObject.source = "Musicbrainz";
            album = albumObject;
          }
          return callback();
        });
      } else {
        return callback();
      }
    },

    // Get Album art from Last.FM
    function(callback) {
      if (album && !album.image) {
        lastfm.getAlbumArt(album.name, artist, album.mbid, function(error, result) {
          if (!error && result) {
            album.image = result;
          }
          return callback();
        });

      } else {
        return callback();
      }
    },

    // Get album art from Discogs
    function(callback) {
      if (album && album.mbid && !album.image) {
        getAlbumArtFromDiscogsWithMBID(album.mbid, function(error, result) {
          if (!error && result) {
            album.image = result;
          }
          return callback();
        });
      } else {
        return callback();
      }
    }

  ], function(error) {
    if (!album || error) {
      var willRetry = retrySanitized(artistName, trackName, callback);
      if (!willRetry) {
        return mainCallback(error, album);
      }
    }

    utils.cacheData(albumObjectCacheKey, album, 0);
    return mainCallback(error, album);
  });
}

function retrySanitized(artistName, trackName, callback) {
  var updatedArtist = utils.sanitize(artistName);
  var updatedTrack = utils.sanitize(trackName);

  if (updatedArtist != artistName || updatedTrack != trackName) {
    console.log("No album. Attempting retry.");
    fetchAlbumForArtistAndTrack(updatedArtist, updatedTrack, callback);
    return true;
  } else {
    return false;
  }

}

function createAlbumObject(title, imageUrl, releaseDate, mbid) {
  if (title !== null) {
    var albumObject = {};
    albumObject.name = title;
    albumObject.image = imageUrl;
    albumObject.released = releaseDate;
    albumObject.mbid = mbid;

    return albumObject;
  } else {
    return null;
  }


}

function getAlbumFromMusicbrainz(artistName, trackName, callback) {
  var encodedArtist = encodeURIComponent(artistName.trim());
  var encodedTrack = encodeURIComponent(trackName.trim());

  var url = "http://musicbrainz.org/ws/2/recording/?query=%22" + encodedTrack + "%22+AND+artist:%22" + encodedArtist + "%22+AND+status:%22official%22&fmt=json&limit=10";
  // var url = "http://www.musicbrainz.org/ws/2/release/?query=%22" + encodedTrack + "22%20AND%20artist:%22" + encodedArtist + "%22&fmt=json&limit=1"
  // console.log(url);

  var options = {
    url: url,
    headers: {
      'User-Agent': config.useragent
    }
  };

  request(options, function(error, response, body) {

    if (!error && response.statusCode == 200) {
      var jsonObject = JSON.parse(body);

      if (jsonObject.recordings.length > 0) {

        var albums = jsonObject.recordings[0].releases;
        var filteringObject = _.map(albums, function(result) {
          var newObject = {};
          newObject.name = result.title;
          newObject.status = result.status;
          newObject.date = result.date;
          newObject.type = [result['release-group']['primary-type'], result['release-group']['secondary-types']];
          newObject.artists = [artistName];
          newObject.mbid = result.id;
          return newObject;
        });

        var album = getAlbumFromAlbums(filteringObject);
        if (album) {
          var albumObject = createAlbumObject(album.name, null, album.date, album.mbid);
          albumObject.source = "Musicbrainz";
          callback(error, albumObject);
        } else {
          callback(null, null);
        }
      }
    }
  });
}

function albumFromLastFM(artistName, trackName, callback) {
  lastfm.albumUsingLastFM(artistName, trackName, function(error, albumResult) {
    if (!error && albumResult) {
      var releaseDate = moment(new Date(albumResult.releasedate.trim())).year();
      var albumObject = createAlbumObject(albumResult.name, albumResult.image.last()['#text'], releaseDate, albumResult.mbid);
      callback(error, albumObject);
    } else {
      callback(error, null);
    }
  });
}

function getAlbumArtFromDiscogsWithMBID(mbid, callback) {
  ca.release(mbid, {}, function(err, response) {
    if (!err) {
      if (response && response.images.length > 0) {
        var imageObject = response.images[0];
        callback(err, imageObject);
      } else {
        callback(err, null);
      }
    } else {
      callback(err, null);
    }
  });
}

function getAlbumFromDiscogs(artistName, trackName, callback) {

  discogs.search({
    type: 'release',
    artist: artistName,
    track: trackName,
    format: "album",
    page: 0,
    per_page: 10
  }, function(err, response) {
    if (!err) {
      if (response.results.length > 0) {

        // Create an object that can be used for filtering
        var filteringObject = _.map(response.results, function(result) {
          var newObject = {};
          newObject.name = utils.trackSplit(result.title, " - ", 1).last();
          newObject.date = result.year;
          newObject.type = [result.type];
          newObject.artists = [artistName];
          newObject.mbid = null;
          return newObject;
        });

        var album = getAlbumFromAlbums(filteringObject);
        var albumObject = createAlbumObject(album.name, null, album.date, null);
        albumObject.source = "Discogs";
        callback(err, albumObject);
      } else {
        callback(err, null);
      }
    } else {
      log(err);
      callback(err, null);
    }
  });
}

// Utilities


function getAlbumFromAlbums(albumsArray) {
  // If there's only one then don't go through the below work.
  if (albumsArray.length === 1) {
    return albumsArray[0];
  }

  albumsArray = albumsArray.sort(function(a, b) {

    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    var aDate = Date(parseInt(a.date));
    var bDate = Date(parseInt(b.date));

    // If there's no date then demote its sort order
    if (!a.date) {
      return -1;
    }


    // If it has other artist credits than demote it
    if (a.artists.length > b.artists.length) {
      return -1;
    }

    // If it has a secondary album type then demote it
    if (a.type.length > 1) {
      return -1;
    }

    // If it's a live album demote it
    if (_.includes(a.type, "Single")) {
      return -1;
    }

    return aDate - bDate;
  });

  var updatedAlbums = [];

  i = albumsArray.length;
  while (i--) {
    var singleAlbum = albumsArray[i];
    if (!(_.includes(singleAlbum.type, "Live") && (_.includes(singleAlbum.type, ("Official")) || _.includes(singleAlbum.type, ("Album")) || _.includes(singleAlbum.type, ("Single")) || _.includes(singleAlbum.type, ("EP"))))) {
      updatedAlbums.push(singleAlbum);
    }
  }

  if (updatedAlbums.length === 0 && albumsArray.length > 0) {
    updatedAlbums = albumsArray;
  }

  return updatedAlbums.last();

}


if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}

module.exports.albumFromLastFM = albumFromLastFM;
module.exports.fetchAlbumForArtistAndTrack = fetchAlbumForArtistAndTrack;
module.exports.getAlbumFromDiscogs = getAlbumFromDiscogs;
module.exports.getAlbumFromMusicbrainz = getAlbumFromMusicbrainz;