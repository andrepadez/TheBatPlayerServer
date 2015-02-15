var expect = require("chai").expect;
var async = require("async");
var album = require("../modules/getAlbum.js");

var tracks = [];
tracks.push({
  artist: "The Prodigy",
  track: "Breathe",
  album: "The Fat of the land"
});
tracks.push({
  artist: "Aesthetic Perfection",
  track: "The Dark Half",
  album: "'Til Death"
});
tracks.push({
  artist: "Nine Inch Nails",
  track: "Down In It",
  album: "Pretty Hate Machine"
});
tracks.push({
  artist: "Cher",
  track: "Believe",
  album: "Believe"
});

async.each(tracks, function(singleTrack, callback) {

  describe("getAlbumsFromDiscogs", function() {
    it("Should return an album from discogs for " + singleTrack.artist + " - " + singleTrack.track, function(done) {

      album.getAlbumFromDiscogs(singleTrack.artist, singleTrack.track, function(error, albumObject) {
        console.log(albumObject);
        check(done, function() {
          expect(albumObject).to.exist;
          expect(albumObject).to.have.property('name');
          expect(albumObject).to.have.property('image');
          expect(albumObject).to.have.property('released');
          expect(albumObject).to.have.property('mbid');
          expect(albumObject.name.toLowerCase()).to.equal(singleTrack.album.toLowerCase());
        });
      });

    });
  });

  describe("getAlbumsFromMusicbrainz", function() {
    it("Should return an album from musicbrainz for " + singleTrack.artist + " - " + singleTrack.track, function(done) {

      album.getAlbumFromMusicbrainz(singleTrack.artist, singleTrack.track, function(error, albumObject) {
        console.log(albumObject);
        check(done, function() {
          expect(albumObject).to.exist;
          expect(albumObject).to.have.property('name');
          expect(albumObject).to.have.property('image');
          expect(albumObject).to.have.property('released');
          expect(albumObject).to.have.property('mbid');
          expect(albumObject.name.toLowerCase()).to.equal(singleTrack.album.toLowerCase());
        });
      });

    });
  });

  describe("albumFromLastFM", function() {
    it("Should return an album from LastFM for " + singleTrack.artist + " - " + singleTrack.track, function(done) {

      album.albumFromLastFM(singleTrack.artist, singleTrack.track, function(error, albumObject) {
        console.log(albumObject);
        check(done, function() {
          expect(albumObject).to.exist;
          expect(albumObject).to.have.property('name');
          expect(albumObject).to.have.property('image');
          expect(albumObject).to.have.property('released');
          expect(albumObject).to.have.property('mbid');
          expect(albumObject.name.toLowerCase()).to.equal(singleTrack.album.toLowerCase());
        });
      });
    });
  });
});


function check(done, f) {
  try {
    f();
    done();
  } catch (e) {
    done(e);
  }
}