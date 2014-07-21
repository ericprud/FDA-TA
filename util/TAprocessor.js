
exports.toTurtle = function (ta, name, type, imports, endpoints, defined, termDefinitions, warn, errStr) {

    function system (str) {
        if (str == "NCI EVS")
            return {URI:"<http://example.org/@@NCI-EVS>", label:"NCI-EVS"};
        else if (str == "LOINC")
            return {URI:"<http://example.org/@@LOINC>", label:"LOINC"};
        else if (str.indexOf("FDA Guidance for Industry") == 0)
            return {URI:"<http://example.org/@@FDA-Guidance>", label:"FDA-Guidance" };
        else if (str == "FDA-TA")
            return {URI:"<http://example.org/@@FDA-TA>", label:"FDA-TA" };
        else if (str == "http://www.cdc.gov/hrqol/concept.htm")
            return {URI:"<http://example.org/@@CDC>", label:"CDC" };
        else if (str == "https://www.rheumatology.org/Practice/Clinical/Rcr/Disease_Assessment/")
            return {URI:"<http://example.org/@@ACR>", label:"ACR" };
        else
            return {URI:"<http://example.org/@@unknown>", label:"unknownSystem"};
    }

    var END = "Endpoint";
    var OUC = "OutcomeAssessment";
    var ASS = "Assessment";
    var OBS = "Observation";
    var termDefinitionsUsed = {};
    var auxilliaryTaxonomy = {
        entries: [],
        addEntry: function (id, sstm, code, parentCode) {
            this.entries.push({id:id, sstm:sstm, code:code, parentCode:parentCode});
        },
        toString: function () {
            var ret = '';
            for (var i = 0; i < this.entries.length; ++i) {
                var entry = this.entries[i];
                var subclass = '';
                ret += ":"+entry.id+" \n"
                    + "  rdfs:subClassOf :CDCoding ";
                if (entry.parentCode) {
                    ret += ",\n    [\n"
                        + "     owl:intersectionOf (\n"
                        + "       [ owl:onProperty dt:CDCoding.codeSystem ; owl:hasValue " + system(entry.sstm).URI + " ]\n"
                        + "       [ owl:onProperty dt:CDCoding.code       ; owl:hasValue \""+entry.parentCode+"\" ]\n"
                        + "       ) ] ";
                }
                ret += ";\n   owl:equivalentClass [\n"
                    + "     owl:intersectionOf (\n"
                    + "       [ owl:onProperty dt:CDCoding.codeSystem ; owl:hasValue "
                    + system(entry.parentCode ? "FDA-TA" : entry.sstm).URI
                    + " ]\n"
                    + "       [ owl:onProperty dt:CDCoding.code       ; owl:hasValue \""+entry.code+"\" ]\n"
                    + "       ) ] .\n";
            }
            return ret;
        }
    };

    function definition_toTurtle (def, parent) {
        ret = "";
        var range = null;
        var name = null;
        var defn = null;
        var sstm = null;
        var code = null;
        var xtnd = null;
        var parentCode = null;
        if ('ref' in def && def.ref) {
            // Concept Name             Concept Definition      Concept Definition Source Site  Concept Definition Source Code NCI EVS  URI for SW model        Atomized Concepts       Comment
            // Swollen joint count      # of joi...ion          NCI EVS                         C0451521                                =               
            var DEFN = "Concept Definition";
            var SSTM = "Concept Definition Source";
            var CODE = "Concept Code"
            var XTND = "URI for SW model";
            // warn("ref:", def.ref);
            termDefinitionsUsed[def.ref] = true;
            if (def.ref in termDefinitions) {
                name = '"' + def.ref + '"'; // default to Concept Name
                var termdef = termDefinitions[def.ref];
                def.file = termdef.file;
                def.line = termdef.line;
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
                warn(errStr(parent.file, parent.line, parent.column) + "can't find definiton for", def.ref);
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
        if ('range' in def && def.range)
            range = def.range;
        if ('name' in def && def.name)
            name = def.name;
        if ('defn' in def && def.defn)
            defn = def.defn;
        if ('code' in def && def.code) {
            xtnd = def.code[0] == '<';
            sstm = def.code[1]; sstm = sstm.substr(1, sstm.length-2);
            code = def.code[2]; code = code.substr(1, code.length-2);
        }

        if (range)
            ret += ",\n        [ owl:onProperty data:value ; owl:allValuesFrom [\n"
            + "            a rdfs:Datatype ;\n"
            + "            owl:onDatatype xsd:integer ;\n"
            + "            owl:withRestrictions ( "
            + (range[0] === undefined ? '' : "[ xsd:minInclusive " + range[0] + " ] ")
            + (range[1] === undefined ? '' : "[ xsd:maxInclusive " + range[1] + " ] ")
            + ")\n"
            +"        ] ] ";

        if (name)
            ret += ";\n    rdfs:label "+name+" ";
        if (defn)
            ret += ";\n    skos:definition "+defn+" ";
        if (xtnd) {
            if (!code)
                warn (errStr(def.file, def.line, 0) + "Expected to refine \"" + def.ref + "\" but no general code was specified.");
            else if (!sstm)
                warn (errStr(def.file, def.line) + "Expected to refine \"" + def.ref + "\" but no general code system was specified");
            else {
                // warn ("refining " + JSON.stringify(def));
                parentCode = code;
                code = "refined-" + code;
            }
        }
        if (code) {
            var id = system(sstm).label+"-"+code;
            ret += ";\n    rdfs:subClassOf [ owl:onProperty hl7:coding ; owl:hasValue :"+id+" ] ";
            auxilliaryTaxonomy.addEntry(id, sstm, code, parentCode);
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
            "# $Id: TAprocessor.js,v 1.6 2014-07-21 00:03:12 eric Exp $\n"+
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
            "@prefix hl7: <http://hl7.org/owl/metadata#> .\n"+
            imports.map(function (imp) {
                return "@prefix "+imp[0]+" <http://www.w3.org/2013/12/FDA-TA/" + imp[1].substr(1, imp[1].indexOf(".")-1) + "#> .\n";
            }).join("")+
            "\n"+
            "<http://www.w3.org/2013/12/FDA-TA/"+name+"> a owl:Ontology ;\n"+
            "    owl:imports <http://www.w3.org/2013/12/FDA-TA/core> "+
            imports.map(function (imp) {
                return ",\n                <http://www.w3.org/2013/12/FDA-TA/" + imp[1].substr(1, imp[1].indexOf(".")-1) + "> ";
            }).join("")+
            ".\n"+
            "\n:Assessment rdfs:subClassOf core:Assessment .\n"+
            ":CDCoding rdfs:subClassOf dt:CDCoding .\n";
        if (type == 'TA') {
            ret += allEndpoints.map(function (e) {
                    return endpoint_toTurtle(e, recursive, ta[e]);
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
        } else {
            for (e in ta) {
                if (!(e in defined)) {
                    if (ta[e]._ == 'ASSESSMENT')
                        ret += assessment_toTurtle(e, true, ta[e]);
                    else
                        ret += observation_toTurtle(e, true, ta[e]);
                }
            }
        }
        return ret;
    }

    function endpoint_toTurtle (e, recurse, parent) {
        var ret = '';
        if (e.lastIndexOf(END) != e.length-END.length)
            warn(errStr(parent.file, parent.line, parent.column) + e, "should end with", END);
        if (e in ta && !(e in defined)) {
            defined[e] = true;
            var endpoint = ta[e];
            ret += ":"+e+" \n"
                + "    rdfs:subClassOf \n"
                + "        core:EfficacyEndpoint ,\n"
                + "        [ owl:onProperty core:evaluates ; owl:someValuesFrom :"+endpoint.outcome+" ] "
            ret += definition_toTurtle(endpoint.definition, endpoint);
            ret += ".\n";
            if (recurse)
                ret += outcomeAssessment_toTurtle(endpoint.outcome, recurse, endpoint);
        }
        return ret;
    }

    function outcomeAssessment_toTurtle (e, recurse, parent) {
        var ret = '';
        if (e.lastIndexOf(OUC) != e.length-OUC.length)
            warn(errStr(parent.file, parent.line, parent.column) + e, "should end with", OUC);
        if (e in ta && !(e in defined)) {
            defined[e] = true;
            var outcomeAssessment = ta[e];
            var onAssessment = 'assessment' in outcomeAssessment ? true : false;
            var on = onAssessment ? outcomeAssessment.assessment : outcomeAssessment.observation;
            ret += ":"+e+" \n"
                + "    rdfs:subClassOf \n"
                + "        core:SingleOutcomeAssessment ,\n"
                + "        [ owl:onProperty core:beforeIntervention ; owl:someValuesFrom :"+on+" ] ,\n"
                + "        [ owl:onProperty core:afterIntervention ; owl:someValuesFrom :"+on+" ] ";
            ret += definition_toTurtle(outcomeAssessment.definition, outcomeAssessment);
            ret += ".\n";
            if (recurse)
                ret += (onAssessment
                        ? assessment_toTurtle(on, recurse, outcomeAssessment)
                        : observation_toTurtle(on, recurse, outcomeAssessment)) ;
        }
        return ret;
    }

    function assessment_toTurtle (e, recurse, parent) {
        var ret = '';
        if (e.lastIndexOf(ASS) != e.length-ASS.length)
            warn(errStr(parent.file, parent.line, parent.column) + e, "should end with", ASS);
        if (e in ta && !(e in defined)) {
            defined[e] = true;
            var assessment = ta[e];
            var basedOn = assessment.basedOn;
            ret += ":"+e+" \n"
                + "    rdfs:subClassOf \n"
                + "        :Assessment "
                + basedOn.map(function (e) {
                    return ",\n        [ owl:onProperty core:hasObservation ; owl:someValuesFrom :"+e[1]+" ] ";
                }).join("");
            ret += definition_toTurtle(assessment.definition, assessment);
            ret += ".\n";
            if (recurse)
                ret += basedOn.map(function (e) {
                    if (e[1] in ta) {
                        var definedAsAssessment = ta[e[1]]._ == 'ASSESSMENT';
                        if (e[0] && !definedAsAssessment)
                            warn(errStr(assessment.file, assessment.line, assessment.column) + e[1], "defined as observation but referenced as assessment");
                        else if (!e[0] && definedAsAssessment)
                            warn(errStr(assessment.file, assessment.line, assessment.column) + e[1], "defined as assessment but referenced as observation");
                        return definedAsAssessment
                            ? assessment_toTurtle(e[1], recurse, assessment)
                            : observation_toTurtle(e[1], recurse, assessment) ;
                    } else {
                        warn(errStr(assessment.file, assessment.line, assessment.column) + e[1], "referenced but not defined");
                        return '';
                    }
                }).join("");
        }
        return ret;
    }

    function observation_toTurtle (e, recurse, parent) {
        var ret = '';
        if (e.lastIndexOf(OBS) != e.length-OBS.length)
            warn(errStr(parent.file, parent.line, parent.column) + e, "should end with", OBS);
        if (e in ta && !(e in defined)) {
            defined[e] = true;
            var observation = ta[e];
            var type =
                observation._ == 'QUANT'
                ? 'QuantitativeMeasurement'
                : observation._ == 'DIAGPROC'
                ? 'DiagnosticProcedure'
                : 'SignsAndSymptoms' ;
            ret += ":"+e+" \n"
                + "    rdfs:subClassOf \n"
                + "        core:"+type+" ,\n"
                + "        [ owl:onProperty bridg:PerformedObservation.resultedPerformedObservationResult ; owl:someValuesFrom bridg:PerformedClinicalResult ] ,\n"
             // + "        [ owl:onProperty bridg:PerformedObservation.resultedPerformedObservationResult ; owl:cardinality 1 ] ,\n"
                + "        [ owl:onProperty bridg:PerformedActivity.instantiatedDefinedActivity ; owl:hasValue :Defined"+e+" ] "
                + definition_toTurtle(observation.definition, observation)
                + ".\n:Defined"+e+" rdfs:subClassOf bridg:DefinedObservation "
                // + definition_toTurtle(observation.definition, observation) -- duplicates term definitions @@factor
            ret += ".\n\n";
        }
        return ret;
    }

    ret = ta_toTurtle(true)+"\n\n"+auxilliaryTaxonomy.toString();

    for (declaration in ta)
        if (!(declaration in defined)) {
            var decl = ta[declaration];
            warn(errStr(decl.file, decl.line, decl.column) + "unreferenced declaration:", declaration);
        }
    if (true)
    for (termDefinition in termDefinitions)
        if (!(termDefinition in termDefinitionsUsed) && termDefinition.indexOf(' x ') == -1) {
            var def = termDefinitions[termDefinition];
            warn(errStr(def.file, def.line) + "Unused definition:", termDefinition);
        }
    return ret;
};

