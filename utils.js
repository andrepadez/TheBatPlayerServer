var request = require('request');
var fs = require('fs');

function createTrackFromTitle(title) {
	titleArray = title.split(" - ");

	var track = {
		artist: titleArray[0],
		song: titleArray[1],
		track: title,
		album: {name: null, image: null, releaseDate: null},
		bio: {text: null, published: null},
		image: {url: null, color: { rgb: null, hex: null, hsv: null, int: null } },
		tags: null,
		isOnTour: false,
		metaDataFetched: false,
		expires: 0
	};

	return track;
}
var download = function(uri, filename, callback){
	console.log("Downloading " + uri);
  request.head(uri, function(err, res, body){
    //console.log('content-type:', res.headers['content-type']);
    //console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

module.exports.createTrackFromTitle = createTrackFromTitle;
module.exports.download = download;