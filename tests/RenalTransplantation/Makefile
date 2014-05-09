SOURCE= \
    ../../datatypes.ttl \
    ../../bridg-classes.ttl \
    ../../core.ttl \
    ../../systemic.ttl \
    ../../renal.ttl \
    ../../transplant.ttl \
    ../../RenalTransplantation.ttl \
    subject-amy.ttl \
    subject-bob.ttl \
    subject-sue.ttl \
    study1-ted-2May.ttl \
    study2-rick-2May.ttl \
    study2-bill-2May.ttl \

ARGS= $(addprefix -d ,$(SOURCE))

PROTEGEFILE= built/protege.ttl
CLOSUREFILE= built/work.trig

$(PROTEGEFILE): $(SOURCE) prefixes.ttl ../../ComplicatedUTI.ttl
	cp prefixes.ttl $(PROTEGEFILE)
	sparql $(ARGS) -d subjects.ttl -d ../../ComplicatedUTI.ttl -e 'PREFIX owl: <http://www.w3.org/2002/07/owl#> DELETE { ?s owl:imports ?y } WHERE { ?s owl:imports ?y }' -l turtle >> $(PROTEGEFILE)

$(CLOSUREFILE): $(SOURCE) infer.sh
	sparql $(ARGS) > $(CLOSUREFILE)
	./infer.sh $(CLOSUREFILE)

test: $(CLOSUREFILE) $(PROTEGEFILE) # test doesn't need $(PROTEGEFILE) but it's handy to do it all at once.
	sparql -d $(CLOSUREFILE) scripOutcome.rq -8
	sparql -d $(CLOSUREFILE) endpoints.rq -8

