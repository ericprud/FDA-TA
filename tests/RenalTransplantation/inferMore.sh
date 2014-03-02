

for RULE in \
 'INSERT { ?a rdfs:subPropertyOf ?c } WHERE { ?a rdfs:subPropertyOf ?b . ?b rdfs:subPropertyOf ?c }' \
 'INSERT { ?a ?p ?o } WHERE { ?a rdfs:subPropertyOf ?b . ?b ?p ?o }' \
 'INSERT { ?s ?p ?a } WHERE { ?a rdfs:subPropertyOf ?b . ?s ?p ?b }' \
 'INSERT { ?pi rdfs:range ?d } WHERE { ?pi owl:inverseOf ?p . ?p rdfs:domain ?d }' \
 'INSERT { ?pi rdfs:domain ?r } WHERE { ?pi owl:inverseOf ?p . ?p rdfs:range ?r }' \
 'INSERT { ?pi rdfs:range ?d } WHERE { ?p owl:inverseOf ?pi . ?p rdfs:domain ?d }' \
 'INSERT { ?pi rdfs:domain ?r } WHERE { ?p owl:inverseOf ?pi . ?p rdfs:range ?r }' \
; do sparql -i $1 -e "\
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
PREFIX owl: <http://www.w3.org/2002/07/owl#> \
$RULE"; done
