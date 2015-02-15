REPORTER = dot

test:
	@NODE_ENV=test /usr/local/bin/mocha --timeout 5000 --reporter nyan

test-w:
	@NODE_ENV=test /usr/local/bin/mocha --timeout 5000 \
		--reporter $(REPORTER) \
		--ui tdd \
		--growl \
		--watch

dev:
	@NODE_ENV=development node bin/www

restart:
	@NODE_ENV=production pm2 restart all
	pm2 logs

start:
	@NODE_ENV=production pm2 start -i 4 bin/www
	pm2 logs

stop:
	pm2 stop all

log:
	pm2 logs

.PHONY: test test-w dev restart start stop
