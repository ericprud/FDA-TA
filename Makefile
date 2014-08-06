#

# ~/IHMC_CmapTools/CmapTools &
# ~/Protege_5.0_beta/run.sh &
# ~/Downloads/tbc/run.sh &
# for f in _allTAs.ttl bridg-classes.ttl core.ttl datatypes.ttl drugs.ttl cns.ttl renal.ttl skeletal.ttl systemic.ttl transplant.ttl ComplicatedUTI.ttl Osteoporosis.ttl RenalTransplantation.ttl RheumatoidArthritis.ttl; do ln -s ~/checkouts/FDA-TA-merge/$f; done
# LD_LIBRARY_PATH=../libboost-1.55.install/lib PATH=../SWObjects/bin:$PATH make -k

all: # default target

util/TAparser.js: util/TAparser.jison
	jison $^ -o $@


cns.ta: cns.tapp
	gcc -E -x c -P -C $^ > $@

cns.ttl: cns.ta cns-definitions.csv util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js cns.ta cns-definitions.csv > $@

# debug by running:
#   node-inspector&
#   NODE_PATH=util node --debug-brk util/TAnode.js cns.ta cns-definitions.csv
#   chrome to http://127.0.0.1:8080/debug?port=5858

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

