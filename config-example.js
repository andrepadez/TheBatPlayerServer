var config = {};

var env = process.env.NODE_ENV;
console.log("Environment: " + env);

config.enableCache = true;
config.enableImageCache = true;
config.version = "1.1.3";
config.useragent = 'TheBatServer ( http://thebatplayer.fm v' + config.version + ')';
config.cachetime = 5;
config.hostname = "http://batserver.thebatplayer.fm";

config.discogsAccesskey = "DISCOGS-KEY";
config.discogsSecret = "DISCOGS-SECRET"
config.lastfmKey = "LAST-FM-API-KEY";

// Override for tests
if (env === "test") {
  config.enableCache = false;
  config.enableImageCache = false;
}

module.exports = config;