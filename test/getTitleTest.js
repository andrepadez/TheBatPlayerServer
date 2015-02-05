var getStreamTitle = require("../modules/streamTitle.js");
var expect = require("chai").expect;

var streams = ["http://prem1.di.fm:80/futuresynthpop?77dfa163f86db61477fe5d21", "http://205.164.41.34:6699/", "http://23.81.90.249:8010/", "http://uwstream1.somafm.com/", "http://ice31.securenetsystems.net/CAFECODY?type=.aac", "http://bbcmedia.ic.llnwd.net/stream/bbcmedia_intl_lc_radio3_p?s=1420319989&e=1420334389&h=fa33e7c8187e63d5dc7d389e2ab7850c"];
var i = Math.floor(Math.random() * streams.length);

var stream = streams[0];

describe("streamTitle", function() {

  it("Should return a title", function(done) {
    getStreamTitle.getTitle(stream, function(error, title) {
      expect(title).to.not.be.empty();
      expect(title).to.be.a('string');
      expect(title).to.contain(' - ');
      done();
    });

  });

});