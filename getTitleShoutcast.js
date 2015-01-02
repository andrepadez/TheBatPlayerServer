var request = require('request');
var urlparse = require('url');
var S = require('string');
S.extendPrototype();

function getV1Title(url, callback) {
  url = url + "/7.html";
  console.log("Fetching " + url);

  var options = {
    url: url,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
    }
  };
  request(options, function(error, response, body) {
    var csv = body.stripTags();
    var csvArray = csv.split(",");

    var title = "";
    if (csvArray.length > 7) {
      if (csvArray[7] === " The") {
        title = csvArray[5] + " " + csvArray[6];
      } else {
        title = csvArray[6];
      }
    } else {
      title = csvArray[6];
    }

    if (csvArray.length > 1) {
      var station = {};
      station.listeners = csvArray[0];
      station.bitrate = csvArray[5];
      station.title = title;
      station.fetchsource = "SHOUTCAST_V1";

      callback(station);
    } else {
      callback(null);
    }
  });
}

function getV2Title(url, callback) {
  var parseString = require('xml2js').parseString;

  url = urlparse.parse(url);

  var statsUrl = "http://" + url.hostname + ":" + url.port + "/stats?sid=1";
  console.log("Fetching " + statsUrl);

  var options = {
    url: statsUrl,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
    }
  };
  request(options, function(error, response, body) {
    if (body && response.statusCode === 200) {
      // Parse XML body
      try {
        parseString(body, function(err, result) {
          var station = {};
          station.listeners = result.CURRENTLISTENERS;
          station.bitrate = result.BITRATE;
          station.title = result.SONGTITLE;
          station.fetchsource = "SHOUTCAST_V2";
          callback(station);
        });
      } catch (e) {

      } finally {
        callback(null);
      }

    } else {
      callback(null);
    }
  });

}

module.exports.getV1Title = getV1Title;
module.exports.getV2Title = getV2Title;