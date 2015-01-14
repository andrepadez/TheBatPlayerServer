var Discogs = require('disconnect').Client;

var DISCOGS_CONSUMER_KEY = "wVixYWymHCBOxPnvBDuk";
var DISCOGS_CONSUMER_SECRET = "vOLvFLHEYXngOdMRFFkTenGlwQWIpdkm";

var DISCOGS_OAUTH_TOKEN = "rRUvLSmtfYpVYkiBffTKjjoqdzTrQIEGzfSgqwoH";
var DISCOGS_OAUTH_VERIFIER = "HWqcHDKfWY";

var DISCOGS_ACCESS_TOKEN = {
  version: '1.0',
  signatureMethod: 'HMAC-SHA1',
  status: 'request',
  consumerKey: 'wVixYWymHCBOxPnvBDuk',
  consumerSecret: 'vOLvFLHEYXngOdMRFFkTenGlwQWIpdkm',
  token: 'hsBmKheMmqRQzBRCIYMcRyfovPJTgtSAOnMYgLZV',
  tokenSecret: 'njFuRQVcYtVUBxJxNuoZzPaeeXYGZsuJmUaCtFvl',
  authorizeUrl: 'https://www.discogs.com/oauth/authorize?oauth_token=hsBmKheMmqRQzBRCIYMcRyfovPJTgtSAOnMYgLZV'
};

function getAuthToken() {
  var dis = new Discogs();
  dis.getRequestToken(
    DISCOGS_CONSUMER_KEY,
    DISCOGS_CONSUMER_SECRET,
    'http://your-script-url/callback',
    function(err, requestData) {
      console.log(requestData);
      // Persist "requestData" here so that the callback handler can
      // access it later after returning from the authorize url
      // authorize(requestData);
    }
  );
}

function authorize(requestData) {
  var dis = new Discogs(requestData);
  dis.getAccessToken(
    "UfGvXIFAtF", // Verification code sent back by Discogs
    function(err, accessData) {
      // Persist "accessData" here for following OAuth calls
      console.log('Received access token!');
      console.log(accessData);


    }
  );
}

// authorize();

var dis = new Discogs(DISCOGS_ACCESS_TOKEN);
dis.identity(function(error, data) {
  console.log(error);
});

//
// console.log(dis);