var expect = require("chai").expect;
var async = require("async");

var Memcached = require('memcached');
memcacheClient = new Memcached();
memcacheClient.connect("127.0.0.1:11211", function() {});

var album = require("../modules/getAlbum.js");

// var artist = "Icon of Coil";
// var track = "Situations Like These (single version)";

var tracks = [];
tracks.push({
  artist: "The Prodigy",
  track: "Breathe"
});


async.each(tracks, function(singleTrack, callback) {
  // album.fetchAlbumForArtistAndTrack(singleTrack.artist, singleTrack.track, function(error, albumObject) {
  //   console.log(albumObject);
  // });

  describe("getAlbumsFromDiscogs", function() {
    it("Should return an album from discogs for " + singleTrack.artist + " - " + singleTrack.track, function(done) {

      album.getAlbumFromDiscogs(singleTrack.artist, singleTrack.track, function(error, albumObject) {
        console.log(albumObject);
        expect(albumObject).to.not.be.empty();
        expect(albumObject).to.have.property('name');
        expect(albumObject).to.have.property('image');
        expect(albumObject).to.have.property('released');
        expect(albumObject).to.have.property('mbid');
        done();
      });

    });
  });

  describe("getAlbumsFromMusicbrainz", function() {
    it("Should return an album from musicbrainz for " + singleTrack.artist + " - " + singleTrack.track, function(done) {

      album.getAlbumFromMusicbrainz(singleTrack.artist, singleTrack.track, function(error, albumObject) {
        console.log(albumObject);

        expect(albumObject).to.not.be.empty();
        expect(albumObject).to.have.property('name');
        expect(albumObject).to.have.property('image');
        expect(albumObject).to.have.property('released');
        expect(albumObject).to.have.property('mbid');

        done();
        callback();
      });

    });
  });

  describe("albumFromLastFM", function() {
    it("Should return an album from LastFM for " + singleTrack.artist + " - " + singleTrack.track, function(done) {

      album.albumFromLastFM(singleTrack.artist, singleTrack.track, function(error, albumObject) {
        console.log(albumObject);

        expect(albumObject).to.not.be.empty();
        expect(albumObject).to.have.property('name');
        expect(albumObject).to.have.property('image');
        expect(albumObject).to.have.property('released');
        expect(albumObject).to.have.property('mbid');
        done();
      });
    });
  });
});