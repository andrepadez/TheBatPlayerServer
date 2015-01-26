var moment = require("moment");
var request = require('request');
var utils = require("../utils/utils.js");
var Memcached = require('memcached');
var lastfm = require("../utils/lastfm.js");
var config = require("../config.js");
var S = require('string');

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

  memcacheClient.get(albumObjectCacheKey, function(error, result) {

    if (!error && result !== undefined && config.enableCache) {
      mainCallback(null, result);
    } else {
      getAlbumsFromMusicbrainz(artist, track, function(error, albumObject) {
        utils.cacheData(albumObjectCacheKey, albumObject, 0);
        mainCallback(error, albumObject);
      });
    }

  });
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

function getAlbumsFromMusicbrainz(artistName, trackName, callback) {
  console.log("*** getAlbumsFromMusicbrainz");

  var cacheKey = ("musicbrainzAlbum-track-" + trackName + "-" + artistName).slugify();
  memcacheClient.get(cacheKey, function(error, result) {
    if (!error && result !== undefined && config.enableCache) {
      callback(error, result);
      return;
    } else {
      var encodedArtist = encodeURIComponent(artistName.trim());
      var encodedTrack = encodeURIComponent(trackName.trim());

      var url = "http://musicbrainz.org/ws/2/recording/?query=%22" + encodedTrack + "%22+AND+artist:%22" + encodedArtist + "%22+AND+status:%22official%22&fmt=json&limit=1";
      // var url = "http://www.musicbrainz.org/ws/2/release/?query=%22" + encodedTrack + "22%20AND%20artist:%22" + encodedArtist + "%22&fmt=json&limit=1"
      console.log(url);

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
            albums = filterAlbums(albums, artistName);
            var album = albums.last();
            var albumObject = createAlbumObject(album.title, null, album.date, album.id);
            albumObject.source = "Musicbrainz";

            // Fetch the album art from LastFM
            albumFromLastFM(artistName, album.title, function(error, albumResult) {
              albumObject = createAlbumObjectFromResults(albumResult, album);

              // If album art is still empty use Discogs
              if (albumObject && albumObject.image === '') {
                getAlbumArtFromDiscogs(albumObject, function(error, updatedAlbumObject) {
                  albumObject = updatedAlbumObject;
                  albumObject.source = "Musicbrainz";
                  callback(error, albumObject);
                });
              } else {
                callback(error, albumObject);
              }

            });

          } else {
            // Try the search again with sanitized strings
            var willRetry = retrySanitized(artistName, trackName, callback);

            // Return whatever we get from Last.FM instead.
            if (!willRetry) {
              console.log("Giving up on MB and using Last.FM.");
              albumFromLastFM(artistName, trackName, function(error, albumResult) {
                var albumObject = createAlbumObjectFromResults(albumResult, null);
                if (albumObject) {
                  albumObject.source = "LastFM";
                }
                utils.cacheData(cacheKey, albumObject, 0);
                callback(error, albumObject);
              });
            }
          }
        } else {
          console.log("Error with Musicbrainz.  Falling back to Last.FM");
          albumFromLastFM(artistName, trackName, function(error, albumResult) {
            var albumObject = createAlbumObjectFromResults(albumResult, null);
            if (albumObject) {
              albumObject.source = "LastFM";
            }
            utils.cacheData(cacheKey, albumObject, 0);
            callback(error, albumObject);
          });
        }
      });
    }
  });
}

function createAlbumObjectFromResults(lastFmAlbumResultObject, mbAlbumResultObject) {
  var albumObject = null;

  if (lastFmAlbumResultObject && lastFmAlbumResultObject.name) {
    var albumTitle = lastFmAlbumResultObject.name;
    var image = lastFmAlbumResultObject.image.last()["#text"];
    var releaseDate;

    if (mbAlbumResultObject && mbAlbumResultObject.date) {
      releaseDate = moment(new Date(mbAlbumResultObject.date.trim())).year();
    } else if (lastFmAlbumResultObject.releasedate) {
      releaseDate = moment(new Date(lastFmAlbumResultObject.releasedate.trim())).year();
    }

    albumObject = createAlbumObject(albumTitle, image, releaseDate, lastFmAlbumResultObject.mbid);
  }

  return albumObject;
}


function albumFromLastFM(artistName, albumName, callback) {
  console.log("Using LastFM.");
  lastfm.getAlbumDetails(artistName, albumName, function(error, albumResult) {
    callback(error, albumResult);
  });

}

function retrySanitized(artistName, trackName, callback) {
  var cacheKey = ("musicbrainzAlbum-track-" + trackName + "-" + artistName).slugify();

  var updatedArtist = utils.sanitize(artistName);
  var updatedTrack = utils.sanitize(trackName);

  if (updatedArtist != artistName || updatedTrack != trackName) {
    fetchAlbumForArtistAndTrack(updatedArtist, updatedTrack, callback);
    return true;
  } else {
    return false;
  }

}

function getAlbumArtFromDiscogs(albumObject, callback) {
  console.log("Fetching album art from Discogs");

  if (albumObject.mbid !== '') {
    ca.release(albumObject.mbid, {}, function(err, response) {

      if (response && response.images.length > 0) {
        var imageObject = response.images[0];
        albumObject.image = imageObject.image;
      }
      callback(err, albumObject);
      console.log(albumObject);
    });

  } else {
    callback(null, albumObject);
    console.log(albumObject);
  }
}

function getAlbumsFromDiscogs(artistName, trackName, callback) {
  //https://api.discogs.com/database/search?type=release&artist=noisuf-x&track=noise+bouncing&key=wVixYWymHCBOxPnvBDuk&secret=vOLvFLHEYXngOdMRFFkTenGlwQWIpdkm
  console.log("*** getAlbumsFromDiscogs");
  var cacheKey = ("discogsAlbum-track-" + trackName + "-" + artistName).slugify();
  memcacheClient.get(cacheKey, function(error, result) {
    if (!error && result !== undefined && config.enableCache) {
      callback(null, result);
    } else {

      discogs.search({
        type: 'release',
        artist: artistName,
        track: trackName,
        format: "album",
        page: 0,
        per_page: 1
      }, function(err, response) {
        if (!err) {
          if (response.results.length > 0) {
            var singleAlbum = response.results[0];
            var albumObject = createAlbumObject(singleAlbum.title, singleAlbum.thumb, singleAlbum.year, null);
            utils.cacheData(cacheKey, albumObject, 0);
            callback(albumObject);
          } else {
            var updatedArtist = utils.sanitize(artistName);
            var updatedTrack = utils.sanitize(trackName);
            if (updatedArtist != artistName || updatedTrack != trackName) {
              getAlbumsFromDiscogs(updatedArtist, updatedTrack, callback);
              return;
            } else {
              callback(null);
            }
          }
        } else {
          console.log(err);
          callback(null);
        }
      });
    }
  });
}

// Utilities
function filterAlbums(albumsArray, artistName) {

  // If there's only one then don't go through the below work.
  if (albumsArray.length === 1) {
    return albumsArray;
  }



  albumsArray.sort(function(a, b) {

    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    var aDate = Date(parseInt(a.date));
    var bDate = Date(parseInt(b.date));

    // If there's no date then demote its sort order
    if (!a.date) {
      return -1;
    }


    // If it has other artist credits than demote it
    if (a.hasOwnProperty("artist-credit")) {
      for (var i = 0; i < a["artist-credit"].length; i++) {
        var singleArtistCredit = a["artist-credit"][i];
        if (singleArtistCredit.name !== artistName) {
          return -1;
        }
      }
    }

    // If it has a secondary album type then demote it
    try {
      if (a["release-group"]["secondary-types"]) {
        return -1;
      }
    } catch (e) {

    }



    return aDate - bDate;
  });

  var updatedAlbums = [];

  i = albumsArray.length;
  while (i--) {
    var singleAlbum = albumsArray[i];
    if (singleAlbum.status === "Official" && (singleAlbum["release-group"]["primary-type"] === "Album" || singleAlbum["release-group"]["primary-type"] === "Single" || singleAlbum["release-group"]["primary-type"] === "EP")) {
      updatedAlbums.push(singleAlbum);
    }
  }

  if (updatedAlbums.length === 0 && albumsArray.length > 0) {
    updatedAlbums = albumsArray;
  }

  return updatedAlbums;

}


if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}

module.exports.fetchAlbumForArtistAndTrack = fetchAlbumForArtistAndTrack;
module.exports.getAlbumsFromDiscogs = getAlbumsFromDiscogs;
module.exports.getAlbumsFromMusicbrainz = getAlbumsFromMusicbrainz;