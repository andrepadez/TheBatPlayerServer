var album = require("../getAlbum.js");

var artist = "Icon of Coil";
var track = "Situations Like These (single version)";

var start = new Date();

// album.getAlbumsFromDiscogs(artist, track, function(albumObject) {
//   console.log("-=Discogs=-");
//   console.log(albumObject);
//   var end = new Date() - start;
//   console.info("Discogs Execution time: %dms", end);
// });

album.getAlbumsFromMusicbrainz(artist, track, function(error, albumObject) {
  console.log("-=Musicbrainz=-");
  console.log(albumObject);
  var end = new Date() - start;
  console.info("MB Execution time: %dms", end);
});