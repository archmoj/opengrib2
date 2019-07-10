node_bin = $(shell pwd)/node_modules/.bin/
export PATH := $(node_bin):$(PATH)

rows-by-ext.json:
	wget "http://172.16.90.25:5984/dd-meteo-gc-ca/_design/index/_view/by-ext?inclusive_end=true&reduce=true&group_level=1" -O rows-by-ext.json

index.html: rows-by-ext.json
	browserify index.js | indexhtmlify > index.html

clean:
	rm rows-by-ext.json index.html

.PHONY: clean
