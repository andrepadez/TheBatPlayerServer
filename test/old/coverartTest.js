var CA = require('coverart');
var ca = new CA({
  userAgent: 'my-awesome-app/0.0.1 ( http://my-awesome-app.com )'
});

ca.release('4b2b28e5-438b-43af-aa85-fe1ca16b3bab', {}, function(err, response) {
  console.log(response);
  if (err) {
    process.exit(1);
  }
});