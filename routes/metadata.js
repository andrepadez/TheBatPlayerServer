var express = require('express');
var router = express.Router();
var metadata = require("../getMetadata.js");
var config = require("../config.js");

module.exports = (function() {
  var router = express.Router();

  router.get("/:streamurl", function(req, res) {
    // req.app.disable('etag');

    var cacheAge = config.cachetime;
    res.setHeader('Cache-Control', 'public, max-age=' + cacheAge);

    var url = req.params.streamurl;
    metadata.fetchMetadataForUrl(url, req, function(result) {
      res.json(result);
    });
  });

  return router;
})();