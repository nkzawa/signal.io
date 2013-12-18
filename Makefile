
MOCHA_OPTS = --check-leaks --bail
REPORTER = dot
ISTANBUL_OPTS =

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-cov:
	@NODE_ENV=test ./node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha $(ISTANBUL_OPTS) -- \
		--reporter $(REPORTER) \
		$(MOCHA_OPTS)

test-coveralls:
	@$(MAKE) test-cov ISTANBUL_OPTS="--report lcovonly" && \
		cat ./coverage/lcov.info | ./node_modules/.bin/coveralls --verbose

clean:
	rm -rf ./coverage

.PHONY: test clean
