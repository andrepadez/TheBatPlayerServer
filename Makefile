REPORTER = dot

test:
	@NODE_ENV=test /usr/local/bin/mocha

test-w:
	@NODE_ENV=test /usr/local/bin/mocha \
		--reporter $(REPORTER) \
		--ui tdd \
		--growl \
		--watch

.PHONY: test test-w
