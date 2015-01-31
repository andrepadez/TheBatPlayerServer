var net = require('net');
var fs = require('fs');
var urlparse = require('url');

var StreamTitle = function() {};

StreamTitle.prototype.getTitle = function(url, parentCallback) {
  // url = url + "/;";
  url = urlparse.parse(url);
  var client = new net.Socket();

  var port;
  if (!url.port) {
    port = 80;
  } else {
    port = url.port;
  }
  console.log("Connecting to stream " + url.hostname + " Port " + port);

  client.connect(port, url.hostname, function() {
    // console.log("Connected to " + url.hostname);
    var str = "GET " + url.path + " HTTP/1.1\r\n\Icy-Metadata: 1\r\nUser-Agent: Winamp 2.8\r\nhost: " + url.hostname + "\r\n\r\n";
    // console.log(str);
    client.write(str);
  });

  var str = "";

  callback = function(response) {
    var title = null;

    str += response;

    var needle = "StreamTitle=";
    var position = str.indexOf(needle);

    if (position > -1) {
      client.destroy();
      var endPosition = str.toString().indexOf(";", position);
      var titleString = str.substring(position, endPosition);
      title = titleString.substring(13, titleString.length - 1);
      // console.log("From stream: " + title);
      parentCallback(title);

    }

  };

  client.on('data', callback);

};

module.exports = new StreamTitle();