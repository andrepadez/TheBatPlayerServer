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
	forever restartall

start:
	@NODE_ENV=production forever start bin/www

stop:
	 forever stopall

.PHONY: test test-w dev restart start stop
