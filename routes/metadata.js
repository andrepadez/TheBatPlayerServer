var express = require('express');
var metadata = require("../modules/getMetadata.js");
var config = require("../config.js");

module.exports = (function() {
  var router = express.Router();

  router.get("/:streamurl", function(req, res) {
    var url = req.params.streamurl;
    metadata.fetchMetadataForUrl(url, req, function(error, result) {
      if (error) {
        res.status(error.errorCode).json(error);
      } else {
        var cacheAge = config.cachetime;
        res.header('Cache-Control', 'public, max-age=' + cacheAge);
        res.header("Content-Type", "application/json; charset=utf-8");

        res.json(result);
      }
    });
  });

  return router;
})();