var Memcached = require('memcached');
var metadata = require("../getMetadata.js");

var req = {};
req.app = {};
req.app.memcacheClient = new Memcached();
req.app.memcacheClient.connect("127.0.0.1:11211", function() {});

var url = "http://205.164.41.34:6699";
metadata.fetchMetadataForUrl(url, req, function(result) {
  console.log(result);
});