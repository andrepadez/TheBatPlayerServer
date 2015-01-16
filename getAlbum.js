var moment = require("moment");
var request = require('request');
var utils = require("./utils/utils.js");
var Memcached = require('memcached');
global.memcacheClient = new Memcached();
var lastfm = require("./utils/lastfm.js");
var config = require("./config.js");
var S = require('string');

var NC = require('nodecogs');
var discogs = new NC({
  userAgent: 'TheBatPlayer ( http://thebatplayer.fm )',
  accessKey: "wVixYWymHCBOxPnvBDuk",
  accessSecret: "vOLvFLHEYXngOdMRFFkTenGlwQWIpdkm"
});


S.extendPrototype();

var hasRefetchedSanitizedTrack;

function fetchAlbumForArtistAndTrack(artist, track, mainCallback) {
  var albumObjectCacheKey = ("cache-artist-" + artist + "track-" + track).slugify();

  memcacheClient.get(albumObjectCacheKey, function(error, result) {

    if (!error && result !== undefined && config.enableCache) {
      mainCallback(null, result);
      return;
    } else {
      getAlbumsFromMusicbrainz(artist, track, function(albumObject) {
        mainCallback(error, albumObject);
        utils.cacheData(albumObjectCacheKey, albumObject, 0);
      });
    }

  });
}

function createAlbumObject(title, imageUrl, releaseDate, mbid) {
  var albumObject = {};
  albumObject.name = title;
  albumObject.image = imageUrl;
  albumObject.released = releaseDate;
  albumObject.mbid = mbid;

  return albumObject;
}

function createAlbumObjectFromResults(lastFmAlbumResultObject, mbAlbumResultObject) {
  var albumObject = null;

  if (lastFmAlbumResultObject) {
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




function getAlbumsFromMusicbrainz(artistName, trackName, callback) {
  console.log("*** getAlbumsFromMusicbrainz");

  var cacheKey = ("musicbrainzAlbum-track-" + trackName + "-" + artistName).slugify();
  memcacheClient.get(cacheKey, function(error, result) {
    if (!error && result !== undefined && config.enableCache) {
      callback(result);
    } else {
      var encodedArtist = encodeURIComponent(artistName.trim());
      var encodedTrack = encodeURIComponent(trackName.trim());

      var url = "http://musicbrainz.org/ws/2/recording/?query=%22" + encodedTrack + "%22+AND+artist:%22" + encodedArtist + "%22+AND+status:%22official%22&fmt=json&limit=1";

      // console.log(url);

      request(url, function(error, response, body) {

        if (!error && response.statusCode == 200) {
          var jsonObject = JSON.parse(body);
          utils.cacheData(cacheKey, jsonObject, 0);

          if (jsonObject.recordings.length > 0) {

            var albums = jsonObject.recordings[0].releases;
            albums = filterAlbums(albums, artistName);
            var album = albums.last();

            // Fetch the album art from LastFM
            lastfm.getAlbumDetails(artistName, album.title, function(error, lastFmResult) {
              if (lastFmResult) {
                var albumObject = createAlbumObjectFromResults(lastFmResult, album);
                utils.cacheData(cacheKey, albumObject, 0);
                callback(albumObject);
              } else {
                console.log("All failed.  Fallback to LastFM.");

                // Return whatever we get from Last.FM instead.
                lastfm.getAlbumDetails(artistName, album.title, function(error, albumResult) {
                  var albumObject = createAlbumObjectFromResults(albumResult, album);

                  console.log("Caching in fetchAlbumForArtistAndTrack");
                  callback(error, albumObject);
                });
              }
            });

          } else {
            // Try the search again with sanitized strings
            var updatedArtist = utils.sanitize(artistName);
            var updatedTrack = utils.sanitize(trackName);

            if (updatedArtist != artistName || updatedTrack != trackName) {
              console.log("Making new api call");
              hasRefetchedSanitizedTrack = true;
              fetchAlbumForArtistAndTrack(updatedArtist, updatedTrack, callback);
            } else {
              console.log("Giving up on MB and using Last.FM.");
              // Return whatever we get from Last.FM instead.
              lastfm.usingLastFM(artistName, trackName, function(error, albumResult) {
                var albumObject = createAlbumObjectFromResults(albumResult, null);
                callback(error, albumObject);
              });
            }
          }
          // callback(albumObject);
        }
      });
    }
  });
}

function getAlbumsFromDiscogs(artistName, trackName, callback) {
  //https://api.discogs.com/database/search?type=release&artist=noisuf-x&track=noise+bouncing&key=wVixYWymHCBOxPnvBDuk&secret=vOLvFLHEYXngOdMRFFkTenGlwQWIpdkm
  console.log("*** getAlbumsFromDiscogs");
  var cacheKey = ("discogsAlbum-track-" + trackName + "-" + artistName).slugify();
  memcacheClient.get(cacheKey, function(error, result) {
    if (!error && result !== undefined && config.enableCache) {
      callback(result);
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
    var aDate = Date(a.date);
    var bDate = Date(b.date);

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
    if (singleAlbum.status === "Official" && (singleAlbum["release-group"]["primary-type"] === "Album" || singleAlbum["release-group"]["primary-type"] === "Single")) {
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