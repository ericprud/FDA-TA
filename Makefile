#

# ~/IHMC_CmapTools/CmapTools &
# ~/Protege_5.0_beta/run.sh &
# ~/Downloads/tbc/run.sh &
# for f in _allTAs.ttl bridg-classes.ttl core.ttl datatypes.ttl drugs.ttl qualityOfLife.ttl renal.ttl skeletal.ttl systemic.ttl transplant.ttl ComplicatedUTI.ttl Osteoporosis.ttl RenalTransplantation.ttl RheumatoidArthritis.ttl; do ln -s ~/checkouts/FDA-TA-merge/$f; done
# LD_LIBRARY_PATH=../libboost-1.55.install/lib PATH=../SWObjects/bin:$PATH make -k

all: # default target

util/TAparser.js: util/TAparser.jison
	jison $^ -o $@


qualityOfLife.ta: qualityOfLife.tapp
	gcc -E -x c -P -C $^ > $@

qualityOfLife.ttl: qualityOfLife.ta qualityOfLife-definitions.xslx util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js qualityOfLife.ta qualityOfLife-definitions.xslx > $@

# debug by running:
#   node-inspector&
#   NODE_PATH=util node --debug-brk util/TAnode.js qualityOfLife.ta qualityOfLife-definitions.xlsx
#   chrome to http://127.0.0.1:8080/debug?port=5858

t_qualityOfLife: qualityOfLife.ttl
	sparql -d qualityOfLife.ttl -q


RheumatoidArthritis.ta: RheumatoidArthritis.tapp
	gcc -E -x c -P -C $^ > $@

RheumatoidArthritis.ttl: RheumatoidArthritis.ta RheumatoidArthritis-definitions.xslx util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js RheumatoidArthritis.ta RheumatoidArthritis-definitions.xslx > $@

t_RheumatoidArthritis: RheumatoidArthritis.ttl
	sparql -d RheumatoidArthritis.ttl -q

skeletal.ta: skeletal.tapp
	gcc -E -x c -P -C $^ > $@

skeletal.ttl: skeletal.ta skeletal-definitions.xlsx util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js skeletal.ta skeletal-definitions.xlsx > $@

t_skeletal: skeletal.ttl
	sparql -d skeletal.ttl -q


Osteoporosis.ta: Osteoporosis.tapp
	gcc -E -x c -P -C $^ > $@

Osteoporosis.ttl: Osteoporosis.ta Osteoporosis-definitions.xlsx util/TAnode.js util/TAparser.js util/TAprocessor.js
	NODE_PATH=util node util/TAnode.js Osteoporosis.ta Osteoporosis-definitions.xlsx > $@

t_Osteoporosis: Osteoporosis.ttl
	sparql -d Osteoporosis.ttl -q

# import hierarchy
RheumatoidArthritis.ttl: qualityOfLife.ttl
Osteoporosis.ttl: skeletal.ttl


# perform all tests
all: t_RheumatoidArthritis t_Osteoporosis

