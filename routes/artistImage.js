var image = require("../image/artist.js");
var express = require('express');
var fs = require('fs');

module.exports = (function() {
  var router = express.Router();

  router.get("/:imageurl/:red/:green/:blue", function(req, res) {
    var url = req.params.imageurl;
    var colorObject = {
      red: req.params.red,
      green: req.params.green,
      blue: req.params.blue
    };

    image.createArtistImage(url, colorObject, function(error, path) {
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