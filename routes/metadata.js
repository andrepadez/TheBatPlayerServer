var express = require('express');
var metadata = require("../modules/getMetadata.js");
var config = require("../config.js");

module.exports = (function() {
  var router = express.Router();

  router.get("/:streamurl", function(req, res) {
    // req.app.disable('etag');

    var cacheAge = config.cachetime;
    res.setHeader('Cache-Control', 'public, max-age=' + cacheAge);
    res.header("Content-Type", "application/json; charset=utf-8");

    var url = req.params.streamurl;
    metadata.fetchMetadataForUrl(url, req, function(result) {
      res.json(result);
    });
  });

  return router;
})();