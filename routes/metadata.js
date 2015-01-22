var express = require('express');
var router = express.Router();
var metadata = require("../getMetadata.js");
var config = require("./config.js");

module.exports = (function() {
  var router = express.Router();

  router.get("/:streamurl", function(req, res) {
    var cacheAge = config.cachetime;

    if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + cacheAge);

    req.app.disable('etag');

    var url = req.params.streamurl;
    metadata.fetchMetadataForUrl(url, req, function(result) {
      res.json(result);
    });
  });

  return router;
})();