
build:
	@bin/build-template
	@bin/build

clean:
	rm -rf out

.PHONY: build clean
