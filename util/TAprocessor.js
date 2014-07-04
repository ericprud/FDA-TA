
exports.toTurtle = function (ta, name, endpoints, defined, termDefinitions, warn) {
    var END = "Endpoint";
    var OUC = "OutcomeAssessment";
    var ASS = "Assessment";
    var OBS = "Observation";
    var termDefinitionsUsed = {};
    var auxilliaryTaxonomy = "";

    function definition_toTurtle (def) {
	ret = "";
	var name = null;
	var defn = null;
	var sstm = null;
	var code = null;
	var xtnd = null;
	if ('ref' in def && def.ref) {
	    // Concept Name		Concept Definition	Concept Definition Source Site	Concept Definition Source Code NCI EVS	URI for SW model	Atomized Concepts	Comment
	    // Swollen joint count	# of joi...ion		NCI EVS				C0451521				=		
	    var DEFN = "Concept Definition";
	    var SSTM = "Concept Definition Source Site";
	    var CODE = "Concept Definition Source Code NCI EVS"
	    var XTND = "URI for SW model";
	    // warn("ref:", def.ref);
	    termDefinitionsUsed[def.ref] = true;
	    if (def.ref in termDefinitions) {
		name = '"' + def.ref + '"'; // default to Concept Name
		var termdef = termDefinitions[def.ref];
		if (DEFN in termdef)
		    if (termdef[DEFN].substr(0, 1) == '"') {
			termdef[DEFN] = termdef[DEFN].substr(1, termdef[DEFN].length-2);
			termdef[DEFN] = termdef[DEFN].replace(/""/g, '"');
		    }
		    defn = '"""'+termdef[DEFN]+'"""';
		if (SSTM in termdef)
		    sstm = termdef[SSTM];
		if (CODE in termdef)
		    code = termdef[CODE];
		if (XTND in termdef)
		    xtnd = termdef[XTND] == '<';
	    } else {
		warn("can't find definiton for", def.ref);
	    }
	}

	//  SwollenJointCountObservation: 
	//   { definition: 
	//      { name: '"strike name"',
	//        defn: '"""strike defn"""',
	//        ref: 'Swollen joint count',
	//        code: [Object] },
	//     _name: 'SwollenJointCountObservation',
	//     _: 'QUANT' },
	if ('name' in def && def.name)
	    name = def.name;
	if ('defn' in def && def.defn)
	    defn = def.defn;
	if ('code' in def && def.code) {
	    xtnd = def.code[0] == '<';
	    sstm = def.code[1]; sstm = sstm.substr(1, sstm.length-2);
	    code = def.code[2]; code = code.substr(1, code.length-2);
	}

	function systemURI (str) {
	    if (str == "NCI EVS")
		return "http://example.org/@@NCI-EVS"
	    else if (str == "FDA-TA")
		return "http://example.org/@@FDA-TA"
	    else
		return "http://example.org/@@unknown"
	}

	if (name)
	    ret += ";\n    rdfs:label "+name+" ";
	if (defn)
	    ret += ";\n    skos:definition "+defn+" ";
	if (xtnd) {
	    var newCode = "refined-" + code;
	    auxilliaryTaxonomy += "<http://example.org/@@FDA-TA#" + newCode + "> skos:narrowerThan <" + systemURI(sstm) + "#" + code + "> ." ;
	    sstm = "FDA-TA";
	    code = newCode;
	}
	if (code) {
	    ret += ";\n    rdfs:subClassOf [ owl:onProperty dt:CD.CodeSystem ; owl:hasValue <"+systemURI(sstm)+"> ] ";
	    ret += ",\n                    [ owl:onProperty dt:CD.Coding ; owl:hasValue \""+code+"\" ] ";
	}
	return ret;
    }
    function ta_toTurtle (recursive) {
	var allEndpoints = [];
	for (var i = 0; i < endpoints.length; ++i) {
	    var endpoint = endpoints[i];
	    allEndpoints.push(endpoint);
	}
	var ret = ""+
	    "# $Id: "+name+".ttl,v 1.12 2014-03-03 16:51:24 eric Exp $\n"+
	    "#\n"+
	    "# ericP at the keyboard\n"+
	    "\n"+
	    "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n"+
	    "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n"+
	    "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n"+
	    "@prefix skos: <http://www.w3.org/2004/02/skos/core#> .\n"+
	    "\n"+
	    "@prefix dt: <http://www.hl7.org/owl/iso-dt-2.0#> .\n"+
	    "@prefix bridg: <http://www.bridgmodel.org/owl#> .\n"+
	    "\n"+
	    "@prefix : <http://www.w3.org/2013/12/FDA-TA/"+name+"#> .\n"+
	    "@prefix core: <http://www.w3.org/2013/12/FDA-TA/core#> .\n"+
	    "@prefix data: <http://www.w3.org/2013/12/FDA-TA/datatypes#> .\n"+
	    "\n"+
	    "<http://www.w3.org/2013/12/FDA-TA/"+name+"> a owl:Ontology ;\n"+
	    "    owl:imports <http://www.w3.org/2013/12/FDA-TA/core> .\n"+
	    "\n"+
	    ":Assessment rdfs:subClassOf core:Assessment .\n"+
	    allEndpoints.map(function (e) {
		return endpoint_toTurtle(e, recursive);
	    }).join("")+
	    ":Organizer a owl:Class . # organizer for the "+name+" Therapeutic Area .\n"+
	    ":Subject rdfs:subClassOf :Organizer .\n"+
	    ":Protocol rdfs:subClassOf :Organizer .\n"+
	    ":AllEndpoints rdfs:subClassOf :Organizer ;\n"+
	    "    owl:equivalentClass [ owl:unionOf (\n"+
	    allEndpoints.map(function (e) {
		return "        :" + e + " \n";
	    }).join("")+
	    "    ) ] .\n"+
	    "\n"+
	    ":Protocol \n"+
	    "    rdfs:subClassOf :Organizer, core:TAProtocol ,\n"+
	    "        [ owl:onProperty :hasEndpoint ; owl:someValuesFrom :AllEndpoints ] .\n"+
	    "";
	return ret;
    }

    function endpoint_toTurtle (e, recurse) {
	var ret = '';
	if (e.lastIndexOf(END) != e.length-END.length)
	    warn(e, "should end with", END);
	if (e in ta && !(e in defined)) {
	    defined[e] = true;
	    var endpoint = ta[e];
	    ret += ":"+e+" a core:EfficacyEndpoint ";
	    ret += definition_toTurtle(endpoint.definition);
	    ret += ";\n    core:evaluates :"+endpoint.outcome+" ";
	    ret += ".\n";
	    if (recurse)
		ret += outcomeAssessment_toTurtle(endpoint.outcome, recurse);
	}
	return ret;
    }

    function outcomeAssessment_toTurtle (e, recurse) {
	var ret = '';
	if (e.lastIndexOf(OUC) != e.length-OUC.length)
	    warn(e, "should end with", OUC);
	if (e in ta && !(e in defined)) {
	    defined[e] = true;
	    var outcomeAssessment = ta[e];
	    var onAssessment = 'assessment' in outcomeAssessment ? true : false;
	    var on = onAssessment ? outcomeAssessment.assessment : outcomeAssessment.observation;
	    ret += ":"+e
		+ "    rdfs:subClassOf \n"
		+ "        core:SingleOutcomeAssessment ,\n"
		+ "        [ owl:onProperty core:beforeIntervention ; owl:someValuesFrom :"+on+" ] ,\n"
		+ "        [ owl:onProperty core:afterIntervention ; owl:someValuesFrom :"+on+" ] ";
	    ret += definition_toTurtle(outcomeAssessment.definition);
	    ret += ".\n";
	    if (recurse)
		ret += (onAssessment
			? assessment_toTurtle(on, recurse)
			: observation_toTurtle(on, recurse)) ;
	}
	return ret;
    }

    function assessment_toTurtle (e, recurse) {
	var ret = '';
	if (e.lastIndexOf(ASS) != e.length-ASS.length)
	    warn(e, "should end with", ASS);
	if (e in ta && !(e in defined)) {
	    defined[e] = true;
	    var assessment = ta[e];
	    var basedOn = assessment.basedOn;
	    ret += ":"+e+" \n"
		+ "    rdfs:subClassOf \n"
		+ "        core:Assessment ";
		+ basedOn.map(function (e) {
		    return ",\n        [ owl:onProperty core:hasObservation ; owl:someValuesFrom :"+e+" ] ";
		}).join("");
	    ret += definition_toTurtle(assessment.definition);
	    ret += ".\n";
	    if (recurse)
		ret += basedOn.map(function (e) {
		    return e in ta && ta[e]._ == 'ASSESSMENT'
			? assessment_toTurtle(e, recurse)
			: observation_toTurtle(e, recurse) ;
		}).join("");
	}
	return ret;
    }

    function observation_toTurtle (e, recurse) {
	var ret = '';
	if (e.lastIndexOf(OBS) != e.length-OBS.length)
	    warn(e, "should end with", OBS);
	if (e in ta && !(e in defined)) {
	    defined[e] = true;
	    var observation = ta[e];
	    var type =
		observation._ == 'QUANT'
		? 'QuantitativeMeasurement'
		: observation._ == 'SSX'
		? 'SignsAndSymptoms'
		: 'DiagnosticProcedure' ;
	    ret += ":"+e+" \n"
		+ "    rdfs:subClassOf \n"
		+ "        core:"+type+" ,\n"
		+ "        [ owl:onProperty bridg:PerformedObservation.resultedPerformedObservationResult ; owl:someValuesFrom bridg:PerformedClinicalResult ] ,\n"
	     // + "        [ owl:onProperty bridg:PerformedObservation.resultedPerformedObservationResult ; owl:cardinality 1 ] ,\n"
		+ "        [ owl:onProperty bridg:PerformedActivity.instantiatedDefinedActivity ; owl:hasValue :DefinedCReactiveProteinObservation ] "
		+ definition_toTurtle(observation.definition)
	    ret += ".\n\n";
	}
	return ret;
    }

    ret = ta_toTurtle(true)+"\n\n"+auxilliaryTaxonomy;

    for (decl in ta)
	if (!(decl in defined))
	    warn("unreferenced declaration:", decl);
    if (true)
    for (termDefinition in termDefinitions)
	if (!(termDefinition in termDefinitionsUsed))
	    warn("unused definition:", termDefinition);
    return ret;
};

