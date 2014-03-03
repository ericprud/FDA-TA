FDA Therapeutic Area Ontologies
===============================

Collaborative space for TA development.


File Structure
--------------

- ./TAongology - marked by initial capitol letter
- ./sharedModeules - marked by initial lower-case letter
- ./docs - documentation
- ./util - utility functions
- ./tests/TAongology/ - data to test endpoint queries and inferences
- ./tests/TAongology/Makefile - $(make test) and a few other goodies


Issues
------

Protégé v4.3 uses OWLAPI 3.4.2 which has a parser bug which [merges BNodes](https://mailman.stanford.edu/pipermail/protege-user/2014-February/000160.html "OWL API BNode merge bug") and consequentially produces unsound ontologies.
Workarounds:

- Use [Protégé 4.2](http://protege.cim3.net/download/old-releases/Protege%204.x/4.2/ "4.2")
- Use a [replacement OWLAPI](https://mailman.stanford.edu/pipermail/protege-user/2014-March/000169.html), ([instructions](https://mailman.stanford.edu/pipermail/protege-user/2014-March/000169.html))
- Concatonate the source files and strip out the owl:includes with e.g. [SPARQL Update](https://github.com/ericprud/FDA-TA/blob/master/tests/RenalTransplantation/Makefile#L19)