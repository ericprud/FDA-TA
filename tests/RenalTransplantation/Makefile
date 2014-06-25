ONTOLOGIES= \
    ../../datatypes.ttl \
    ../../bridg-classes.ttl \
    ../../core.ttl \
    ../../systemic.ttl \
    ../../renal.ttl \
    ../../transplant.ttl \
    ../../RenalTransplantation.ttl \

DATA= \
    subject-amy.ttl \
    subject-bob.ttl \
    subject-sue.ttl \
    study1-ted-2May.ttl \
    study2-rick-2May.ttl \
    study2-bill-2May.ttl \

SOURCE= $(ONTOLOGIES) $(DATA)

PROTEGEFILE= built/protege.ttl
ONTCLOSURE= built/ontClosure.ttl
DATACLOSURE= built/dataClosure.ttl
REMOVEIMPORTS= -e 'PREFIX owl: <http://www.w3.org/2002/07/owl\#> DELETE { ?O owl:imports ?B . ?C a owl:Ontology } INSERT { <http://www.w3.org/2013/12/FDA-TA/RenalTransplantation> a owl:Ontology } WHERE { {?O owl:imports ?B} UNION {?C a owl:Ontology} }'

$(PROTEGEFILE): $(SOURCE) prefixes.ttl ../../ComplicatedUTI.ttl
	cp prefixes.ttl $(PROTEGEFILE)
	sparql $(addprefix -d ,$(SOURCE)) -d subjects.ttl -d ../../ComplicatedUTI.ttl $(REMOVEIMPORTS) -l turtle >> $(PROTEGEFILE)

$(ONTCLOSURE): $(ONTOLOGIES) prefixes.ttl infer.sh
	sparql $(addprefix -d ,$(ONTOLOGIES)) $(REMOVEIMPORTS) -l turtle > $(ONTCLOSURE)
	./infer.sh $(ONTCLOSURE)
	prefixify prefixes.ttl $(ONTCLOSURE)

$(DATACLOSURE): $(ONTCLOSURE) $(DATA) prefixes.ttl infer.sh
	cp prefixes.ttl $(DATACLOSURE)
	sparql -d $(ONTCLOSURE) $(addprefix -d ,$(DATA)) $(REMOVEIMPORTS) -l turtle >> $(DATACLOSURE)
	./inferData.sh $(DATACLOSURE)

test: $(DATACLOSURE) $(PROTEGEFILE) # test doesn't need $(PROTEGEFILE) but it's handy to do it all at once.
	sparql -d $(DATACLOSURE) scripOutcome.rq -8
	sparql -d $(DATACLOSURE) endpoints.rq -8

