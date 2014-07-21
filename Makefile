
all: # default target

util/TAparser.js: util/TAparser.jison
	jison $^ -o $@


cns.ta: cns.tapp
	gcc -E -x c -P -C $^ > $@

cns.ttl: cns.ta cns-definitions.csv util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js cns.ta cns-definitions.csv > $@

t_cns: cns.ttl
	sparql -d cns.ttl -q


RheumatoidArthritis.ta: RheumatoidArthritis.tapp
	gcc -E -x c -P -C $^ > $@

RheumatoidArthritis.ttl: RheumatoidArthritis.ta RheumatoidArthritis-definitions.csv util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js RheumatoidArthritis.ta RheumatoidArthritis-definitions.csv > $@

t_RheumatoidArthritis: RheumatoidArthritis.ttl
	sparql -d RheumatoidArthritis.ttl -q

# import hierarchy
RheumatoidArthritis.tapp: cns.tapp


# perform all tests
all: t_cns t_RheumatoidArthritis

