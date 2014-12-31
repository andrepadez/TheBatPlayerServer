var express = require('express');
var router = express.Router();
var metadata = require("../getMetadata.js");

module.exports = (function() {
  var router = express.Router();

  router.get("/:streamurl", function(req, res) {
    req.app.disable('etag');

    var url = req.params.streamurl;
    metadata.fetchMetadataForUrl(url, req, function(result) {
      res.json(result);
    });
  });

  return router;
})();