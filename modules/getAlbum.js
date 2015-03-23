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
  accessKey: config.discogsAccesskey,
  accessSecret: config.discogsSecret
});

var CA = require('coverart');
var ca = new CA({
  userAgent: config.useragent
});

S.extendPrototype();

function fetchAlbumForArtistAndTrack(artist, track, mainCallback) {
  var albumObjectCacheKey = ("cache-artist-" + artist + "-track-" + track).slugify();
  var album = null;

  async.parallel([

    // Try the cache
    function(callback) {
      utils.getCacheData(albumObjectCacheKey, function(error, albumObject) {
        if (!error && albumObject !== undefined && config.enableCache) {
          album = albumObject;
          return callback(null, albumObject);
        } else {
          return callback(null, null);
        }
      });

    },

    // Try Discogs
    function(callback) {
      if (!album) {
        getAlbumFromDiscogs(artist, track, callback);
      } else {
        return callback(null, null);
      }
    },

    // Try musicbrainz
    function(callback) {
      if (!album) {
        getAlbumFromMusicbrainz(artist, track, callback);
      } else {
        return callback(null, null);
      }
    },

    // // Try Last.FM
    function(callback) {
      if (!album) {
        albumFromLastFM(artist, track, callback);
      } else {
        return callback(null, null);
      }
    }

  ], function(error, albums) {
    if (albums.length > 0) {
      async.filter(albums, function(singleAlbum, callback) {
        return callback((singleAlbum !== null && singleAlbum.image !== null) || (singleAlbum && singleAlbum.mbid !== null));
      }, function(results) {
        var album = results[0];

        if (!album) {
          return mainCallback(null, null);
        }
        album.artist = artist;

        if (!album.image) {
          getAlbumArtForAlbum(album, function(error, finalAlbum) {
            utils.cacheData(albumObjectCacheKey, finalAlbum, 0);
            return mainCallback(error, finalAlbum);
          });
        } else {
          utils.cacheData(albumObjectCacheKey, album, 0);
          return mainCallback(error, album);
        }

      });
    } else {
      utils.cacheData(albumObjectCacheKey, null, 0);
      return mainCallback(null, null);
    }

  });
}

function getAlbumArtForAlbum(album, mainCallback) {

  async.parallel([

    // Get Album art from Last.FM
    function(callback) {
      if (!album.image) {
        lastfm.getAlbumArt(album.name, album.artist, album.mbid, function(error, result) {
          if (!error && result) {
            album.image = result;
          }
          return callback(null, album);
        });

      } else {
        return callback(null, album);
      }
    },

    // Get album art from Discogs
    function(callback) {
      if (album.mbid !== null && !album.image) {

        getAlbumArtFromDiscogsWithMBID(album.mbid, function(error, result) {
          if (!error && result) {
            album.image = result;
          }
          return callback(null, album);
        });
      } else {
        return callback(null, null);
      }
    }

  ], function(error, albums) {
    async.filter(albums, function(singleAlbum, callback) {
      return callback(singleAlbum.image !== null);
    }, function(results) {
      var finalAlbum;
      if (results.length > 0) {
        finalAlbum = results[0];
      } else {
        finalAlbum = albums[0];
      }
      return mainCallback(error, finalAlbum);
    });
  });
}

function retrySanitized(artistName, trackName, callback) {
  var updatedArtist = utils.sanitize(artistName);
  var updatedTrack = utils.sanitize(trackName);

  if (updatedArtist != artistName || updatedTrack != trackName) {
    log("No album. Attempting retry.");
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
          if (result.date) {
            newObject.date = moment(new Date(result.date)).year();
          }

          newObject.type = [result['release-group']['primary-type'], result['release-group']['secondary-types']];
          newObject.artists = [artistName];
          newObject.mbid = result.id;
          return newObject;
        });

        getAlbumFromAlbums(filteringObject, function(album) {
          if (album) {
            var albumObject = createAlbumObject(album.name, null, album.date, album.mbid);
            albumObject.source = "Musicbrainz";
            return callback(error, albumObject);
          } else {
            return callback(null, null);
          }
        });
      } else {
        return callback(null, null);
      }
    }
  });
}

function albumFromLastFM(artistName, trackName, callback) {
  lastfm.albumUsingLastFM(artistName, trackName, function(error, albumResult) {
    if (!error && albumResult) {
      var releaseDate = null;
      if (albumResult.releasedate) {
        releaseDate = moment(new Date(albumResult.releasedate.trim())).year();
      }
      var albumObject = createAlbumObject(albumResult.name, albumResult.image.last()['#text'], releaseDate, albumResult.mbid);
      return callback(error, albumObject);
    } else {
      return callback(error, null);
    }
  });
}

function getAlbumArtFromDiscogsWithMBID(mbid, callback) {
  ca.release(mbid, {}, function(err, response) {
    if (!err) {
      if (response && response.images.length > 0) {
        var imageObject = response.images[0];
        var url = imageObject.thumbnails.small;
        return callback(err, url);
      } else {
        return callback(err, null);
      }
    } else {
      return callback(err, null);
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

        getAlbumFromAlbums(filteringObject, function(album) {
          var albumObject = createAlbumObject(album.name, null, album.date, null);
          albumObject.source = "Discogs";
          callback(err, albumObject);
        });
      } else {
        callback(err, null);
      }
    } else {
      callback(err, null);
    }
  });
}


function getAlbumFromAlbums(albumsArray, mainCallback) {
  // If there's only one then don't go through the below work.
  if (albumsArray.length === 1) {
    return mainCallback(albumsArray[0]);
  }

  albumsArray.sort(function(a, b) {

    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    if (a.date && b.date) {
      var aDate = Date(parseInt(a.date));
      var bDate = Date(parseInt(b.date));
      return aDate - bDate;
    }
  });

  albumsArray.sort(function(a, b) {

    // If it has other artist credits than demote it
    if (a.artists.length > b.artists.length) {
      return -1;
    } else if (a.artists.length < b.artists.length) {
      return 1;
    } else {
      return 0;
    }
  });

  albumsArray.sort(function(a, b) {
    // If it has a secondary album type then demote it
    if (a.type.length === 1 && b.type.length > 1) {
      return 1;
    } else if (a.type.length > 1 && b.type.length === 1) {
      return -1;
    } else {
      return 0;
    }
  });

  albumsArray.sort(function(a, b) {

    // If it's a Single demote it
    if (_.includes(a.type, "Single")) {
      return -1;
    }

    // If it's a EP demote it
    if (_.includes(a.type, "EP")) {
      return -1;
    }

    return 0;

  });

  async.filter(albumsArray, function(singleAlbum, callback) {
    if (!(_.includes(singleAlbum.type, "Live") && (_.includes(singleAlbum.type, ("Official")) || _.includes(singleAlbum.type, ("Album")) || _.includes(singleAlbum.type, ("Single")) || _.includes(singleAlbum.type, ("EP"))))) {
      return callback(true);
    } else {
      return callback(false);
    }
  }, function(updatedAlbums) {

    if (updatedAlbums.length > 0) {
      return mainCallback(updatedAlbums[0]);
    } else {
      return mainCallback(null);
    }
  });

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