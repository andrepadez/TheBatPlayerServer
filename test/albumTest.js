var expect = require("chai").expect;

var Memcached = require('memcached');
memcacheClient = new Memcached();
memcacheClient.connect("127.0.0.1:11211", function() {});

var album = require("../modules/getAlbum.js");

var artist = "Icon of Coil";
var track = "Situations Like These (single version)";


describe("getAlbumsFromDiscogs", function() {
  it("Should return an album from discogs", function(done) {

    album.getAlbumsFromDiscogs(artist, track, function(error, albumObject) {
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
  it("Should return an album from musicbrainz", function(done) {

    album.getAlbumsFromMusicbrainz(artist, track, function(error, albumObject) {
      expect(albumObject).to.not.be.empty();
      expect(albumObject).to.have.property('name');
      expect(albumObject).to.have.property('image');
      expect(albumObject).to.have.property('released');
      expect(albumObject).to.have.property('mbid');

      done();
    });

  });
});