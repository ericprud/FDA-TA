
all: # default target

RheumatoidArthritis.ta: RheumatoidArthritis.tapp
	gcc -E -x c -P -C $^ > $@

util/TAparser.js: util/TAparser.jison
	jison $^ -o $@

RheumatoidArthritis.ttl: RheumatoidArthritis.ta RheumatoidArthritis-definitions.csv util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js RheumatoidArthritis.ta RheumatoidArthritis-definitions.csv > $@

test: RheumatoidArthritis.ttl
	sparql -d RheumatoidArthritis.ttl -q

all: test

