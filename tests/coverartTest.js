var CA = require('coverart');
var ca = new CA({
  userAgent: 'my-awesome-app/0.0.1 ( http://my-awesome-app.com )'
});

ca.release('660c1995-c6a0-4c90-b158-2f2d9caff78f', {}, function(err, response) {
  console.log(response);
});