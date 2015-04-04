The Bat Server
==================

A NodeJS server-side application for providing metadata from a streaming internet radio source.  Currently used for [The Bat Player](https://github.com/gabek/TheBatPlayerRoku) Roku internet radio client.

###**Goals**
1. Centralize the logic required for taking an audio stream and determining the current song.
 * Shoutcast v1 csv metadata.
 * Shoutcast v2 xml metadata.
 * In-stream icy metadata.
2. Taking a known artist name and track name and determine:
 * The most reasonable album that it came from by aggregating Discogs, Musicbrainz, and Last.FM results and making a logical guess.
 * An image representative of the artist.
 * An image representative of the album.
 * A bio for the artist.
 * Misc tags and/or genres that are useful.
3. Create the dynamic images required for The Bat Player client:
 * A resized image for station selection.
 * An image for the artist during a song.
 * An image for the background during a song.
 * A header image with custom text.
4. Pull color information from the artist image for the client to use in customizing each song.
5. Caching this data centrally so multiple people listening to the same station won't create additional load and so it's quickly available later.

###**Challanges**
1. There are many different internet radio streaming services out there.  Usually the option of connecting to the actual stream and waiting for some metadata to arrive as a last ditch effort works, but for some services meatadata will just never be available.
2. Finding the *correct* album for a artist/track combo is far more difficult than it sounds.  The more popular a song, the more versions of the song is available under the same name.  Live, remixes, karaoke, radio edit, extended version, compilations etc.  The correct answer is usually "The oldest release that's not a Live, Single, EP or compilation release."  But some albums don't have available release dates, either.
3. Different metadata sources have different qualities and quantities of information.  The current approach is to query them all and then try and make some sense out of the results.

###**Running**
1. Copy Config-example.js to Config.js and add your respective keys.
2. _npm install_
3. _make test_ to verify everything is working.
4. Either install and run memcached or turn *enableCache* off in your Config.js.
5. _make dev_ to run.
6. Make a request such as http://localhost:3000/metadata/http%3A%2F%2F205.164.41.34%3A6699

###**Tests**
1. There are a handful of integration tests written.
  * Metadata fetching
  * Artist, background and header image generation.
  * Color detection
  * Current song fetching utilizing the different methods.

###**Want to help?**
1. File a GitHub issue.
2. Create a pull request for a feature or bug fix.
3. Teach me something about Node development I don't know.  This is my first Node app.
4. Write a client on top of this service and let me know how it's working for you.
5. Check out [The Bat Player](https://github.com/gabek/TheBatPlayerRoku).

[![Video](http://i.imgur.com/YdxZM5d.gifv)](https://vimeo.com/112659447)
