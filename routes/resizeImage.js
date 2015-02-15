var image = require("../image/resize.js");
var express = require('express');
var fs = require('fs');

module.exports = (function() {
  var router = express.Router();

  router.get("/:imageurl/:width/:height", function(req, res) {
    req.app.set('etag', 'weak');

    var url = req.params.imageurl;
    var width = req.params.width;
    var height = req.params.height;

    image.resizeImage(url, width, height, function(error, path) {
      res.setHeader('Cache-Control', 'public, max-age=31557600'); // one year
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