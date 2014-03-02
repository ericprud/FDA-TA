

for RULE in \
 'INSERT { ?x a ?c } WHERE { ?c owl:equivalentClass [ owl:onProperty ?p ; owl:hasValue ?v ] . ?x ?p ?v }' \
 'INSERT { ?I ?P ?V } WHERE { ?I a ?C . ?C rdfs:subClassOf [ owl:onProperty ?P ; owl:hasValue ?V ] }' \
 'INSERT { ?S ?P2 ?O} WHERE { ?S ?P1 ?O . ?P1 rdfs:subPropertyOf ?P2 }' \
 'INSERT { ?CHILD rdfs:subClassOf ?PARENT } WHERE { ?CHILD rdfs:subClassOf/rdfs:subClassOf+ ?PARENT }' \
 'INSERT { ?CHILD a ?CLASS } WHERE { ?CHILD rdf:type/rdfs:subClassOf ?CLASS }' \
 'INSERT { ?SUBJECT a ?CLASS } WHERE { ?SUBJECT ?p ?o . ?p rdfs:domain ?CLASS }' \
 'INSERT { ?OBJECT a ?CLASS } WHERE { ?s ?p ?OBJECT . ?p rdfs:range ?CLASS FILTER (!isLiteral(?OBJECT)) }' \
 'INSERT {?s a ?c} WHERE {       # BPAR really does require reasoning.
     ?c owl:equivalentClass [ owl:intersectionOf (
         [ owl:onProperty ?p1 ; owl:someValuesFrom [ owl:onProperty ?p2 ; owl:hasValue ?v2 ] ]
         [ owl:onProperty ?p3 ; owl:hasValue ?v3 ]
     ) ] .
     ?s ?p1 [ ?p2 ?v2 ] ; ?p3 ?v3 }' \
 'INSERT {?s ?p1 [ ?p2 ?v ]} WHERE {
     ?p owl:propertyChainAxiom ( ?p1 ?p2 ) .
     ?s ?p ?v }' \
 'INSERT {?o a ?c2} WHERE {
     ?c1 rdfs:subClassOf [ owl:onProperty ?p ; owl:allValuesFrom ?c2 ] .
     ?s a ?c1 ; ?p ?o }' \
; do sparql -i $1 -e "\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
PREFIX owl: <http://www.w3.org/2002/07/owl#> \
$RULE"; done
