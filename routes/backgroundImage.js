var image = require("../image/background.js");
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

    image.createBackground(url, colorObject, function(error, path) {
      fs.readFile(path, function(err, data) {
        if (path) {
          res.writeHead(200, {
            'Content-Type': 'image/jpeg'
          });
          res.end(data);
        } else if (error) {
          res.status(500);
          res.end(error);
        }

      });
    });

  });

  return router;
})();