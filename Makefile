
MOCHA_OPTS = --check-leaks --bail
REPORTER = dot

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-cov:
	@$(MAKE) test \
		REPORTER=html-cov \
		MOCHA_OPTS="--require blanket" > coverage.html

test-coveralls:
	@$(MAKE) test \
		REPORTER=mocha-lcov-reporter \
		MOCHA_OPTS="--require blanket --check-leaks --bail" \
		| ./node_modules/.bin/coveralls

clean:
	rm -f coverage.html

.PHONY: test clean
