REPORTER = dot

test:
	@NODE_ENV=test /usr/local/bin/mocha --timeout 5000

test-w:
	@NODE_ENV=test /usr/local/bin/mocha --timeout 5000 \
		--reporter $(REPORTER) \
		--ui tdd \
		--growl \
		--watch

.PHONY: test test-w
