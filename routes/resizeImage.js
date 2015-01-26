var image = require("../image/resize.js");
var express = require('express');
var fs = require('fs');

module.exports = (function() {
  var router = express.Router();

  router.get("/:imageurl/:width/:height", function(req, res) {
    var url = req.params.imageurl;

    image.createArtistImage(url, width, height, function(error, path) {
      fs.readFile(path, function(err, data) {
        res.writeHead(200, {
          'Content-Type': 'image/png'
        });
        res.end(data);
      });
    });

  });

  return router;
})();