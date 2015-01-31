var Memcached = require('memcached');
var metadata = require("../modules/getMetadata.js");

var req = {};
req.app = {};
req.app.memcacheClient = new Memcached();
req.app.memcacheClient.connect("127.0.0.1:11211", function() {});

var url = "http://prem1.di.fm:80/futuresynthpop?77dfa163f86db61477fe5d21";
metadata.fetchMetadataForUrl(url, req, function(result) {
  console.log(result);
});