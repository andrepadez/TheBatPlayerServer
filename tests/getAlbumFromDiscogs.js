var album = require("../getAlbum.js");

var start = new Date();

album.getAlbumsFromDiscogs("Beck", "Loser", function(albumObject) {
  console.log("-=Discogs=-");
  console.log(albumObject);
  var end = new Date() - start;
  console.info("Discogs Execution time: %dms", end);
});

album.getAlbumsFromMusicbrainz("Beck", "Loser", function(albumObject) {
  console.log("-=Musicbrainz=-");
  console.log(albumObject);
  var end = new Date() - start;
  console.info("MB Execution time: %dms", end);
});