var test = require("./getTitleShoutcast.js");
var net = require('net');
var urlparse = require('url');



var url = 'http://84.242.120.237:8000/stream/1/';

test.getV2Title(url, function(data) {
  console.log(data);
});