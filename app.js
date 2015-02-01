var rollbar = require("rollbar");
// rollbar.init("41d47860da4546f89ca78845565ee85c");

require('newrelic');

var express = require('express');
var app = express();
var timeout = require('connect-timeout');
var logger = require('morgan');
var bodyParser = require('body-parser');
var Memcached = require('memcached');

var routes = require('./routes/index');
var metadata = require("./routes/metadata.js");
var backgroundImage = require("./routes/backgroundImage.js");
var artistImage = require("./routes/artistImage.js");
var resizeImage = require("./routes/resizeImage.js");
var headerImage = require("./routes/headerImage.js");

var memcacheClient = null;
setupMemcache();


// view engine setup
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(timeout('15s'));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use("/metadata", metadata);
app.use("/images/background", backgroundImage);
app.use("/images/artist", artistImage);
app.use("/images/resize", resizeImage);
app.use("/images/header", headerImage);

function setupMemcache() {
  if (memcacheClient === null) {
    app.memcacheClient = new Memcached();
    app.memcacheClient.connect("127.0.0.1:11211", function() {});
  }
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.use(rollbar.errorHandler('41d47860da4546f89ca78845565ee85c'));


module.exports = app;