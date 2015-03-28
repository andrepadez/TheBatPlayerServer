var express = require('express');
var metadata = require("../modules/getMetadata.js");
var config = require("../config.js");

module.exports = (function() {
  var router = express.Router();

  router.get("/:streamurl", function(req, res, next) {
    var url = req.params.streamurl;

    metadata.fetchMetadataForUrl(url, req, function(error, result) {

      if (error && !req.timedout) {
        return next(error);
      }

      // Since I'm not putting this through a CDN anymore don't set this.
      // var cacheAge = config.cachetime;
      // res.setHeader('Cache-Control', 'public, max-age=' + cacheAge);
      // res.setHeader("Content-Type", "application/json; charset=utf-8");

      return res.json(result);
    });
  });

  return router;
})();