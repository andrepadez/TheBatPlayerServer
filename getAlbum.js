var moment = require("moment");
var request = require('request');
var utils = require("./utils/utils.js");
var Memcached = require('memcached');
global.memcacheClient = new Memcached();
var lastfm = require("./utils/lastfm.js");
var S = require('string');
S.extendPrototype();

var hasRefetchedSanitizedTrack;

function fetchAlbumForArtistAndTrack(artist, track, mainCallback) {
  var albumObjectCacheKey = ("cache-artist-" + artist + "track-" + track).slugify();

  memcacheClient.get(albumObjectCacheKey, function(error, result) {
    if (!error && result !== undefined) {
      mainCallback(null, result);
      return;
    } else {

      getAlbumsFromMusicbrainz(artist, track, function(jsonObject) {

        if (jsonObject.recordings.length > 0) {

          var albums = jsonObject.recordings[0].releases;
          albums = filterAlbums(albums);
          var album = albums.last();

          // Fetch the album art from LastFM
          lastfm.getAlbumDetails(artist, album.title, function(error, lastFmResult) {

            if (lastFmResult) {
              var albumObject = createAlbumObjectFromResults(lastFmResult, album);
              utils.cacheData(albumObjectCacheKey, albumObject, 0);
              mainCallback(error, albumObject);
            } else {
              console.log("All failed.  Fallback to LastFM.");

              // Return whatever we get from Last.FM instead.
              lastfm.getAlbumDetails(artist, album.title, function(error, albumResult) {
                var albumObject = createAlbumObjectFromResults(albumResult, album);

                console.log("Caching in fetchAlbumForArtistAndTrack");
                utils.cacheData(albumObjectCacheKey, albumObject, 0);
                mainCallback(error, albumObject);
              });
            }
          });

        } else {
          // Try the search again with sanitized strings
          var updatedArtist = utils.sanitize(artist);
          var updatedTrack = utils.sanitize(track);

          if (updatedArtist != artist || updatedTrack != track) {
            console.log("Making new api call");
            hasRefetchedSanitizedTrack = true;
            fetchAlbumForArtistAndTrack(updatedArtist, updatedTrack, mainCallback);
          } else {
            console.log("Using Last.FM");
            // Return whatever we get from Last.FM instead.
            lastfm.usingLastFM(artist, track, function(error, albumResult) {
              var albumObject = createAlbumObjectFromResults(albumResult, null);
              utils.cacheData(albumObjectCacheKey, albumObject, 0);
              mainCallback(error, albumObject);
            });
          }
        }
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

    var cacheKey = ("musicbrainz-track-" + trackName + "-" + artistName).slugify();
    memcacheClient.get(cacheKey, function(error, result) {
      if (!error && result !== undefined) {
        callback(result);
      } else {
        var encodedArtist = encodeURIComponent(artistName);
        var encodedTrack = encodeURIComponent(trackName);

        var url = "http://musicbrainz.org/ws/2/recording/?query=%22" + encodedTrack + "%22+AND+artist:%22" + encodedArtist + "%22+AND+status:%22official%22+AND+type:album&fmt=json&limit=1";
        console.log(url);

        request(url, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            var jsonObject = JSON.parse(body);
            callback(jsonObject);
            utils.cacheData(cacheKey, jsonObject, 0);
          }
        });
      }
    });



  }
  // Utilities

function filterAlbums(albumsArray) {

  albumsArray.sort(function(a, b) {

    // Turn your strings into dates, and then subtract them
    // to get a value that is either negative, positive, or zero.
    var aDate = Date(a.date);
    var bDate = Date(b.date);

    if (bDate === null) {
      console.log("No date for " + a.title);
      return -1;
    }

    return aDate - bDate;
  });

  var updatedAlbums = [];

  i = albumsArray.length;
  while (i--) {
    var singleAlbum = albumsArray[i];

    if (singleAlbum.status == "Official" && singleAlbum["release-group"]["primary-type"] == "Album") {
      updatedAlbums.push(singleAlbum);
    }
  }

  return updatedAlbums;

}


if (!Array.prototype.last) {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
}

module.exports.fetchAlbumForArtistAndTrack = fetchAlbumForArtistAndTrack;