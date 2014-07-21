
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

skeletal.ta: skeletal.tapp
	gcc -E -x c -P -C $^ > $@

skeletal.ttl: skeletal.ta skeletal-definitions.csv util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js skeletal.ta skeletal-definitions.csv > $@

t_skeletal: skeletal.ttl
	sparql -d skeletal.ttl -q


Osteoporosis.ta: Osteoporosis.tapp
	gcc -E -x c -P -C $^ > $@

Osteoporosis.ttl: Osteoporosis.ta Osteoporosis-definitions.csv util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js Osteoporosis.ta Osteoporosis-definitions.csv > $@

t_Osteoporosis: Osteoporosis.ttl
	sparql -d Osteoporosis.ttl -q

# import hierarchy
RheumatoidArthritis.ttl: cns.ttl
Osteoporosis.ttl: skeletal.ttl


# perform all tests
all: t_RheumatoidArthritis t_Osteoporosis

