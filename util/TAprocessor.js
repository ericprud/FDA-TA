
exports.toTurtle = function (ta, name, type, imports, covariates, medHistory, concomitants, endpoints, defined, termDefinitions, warn, errStr) {

    function system (str) {
        if (str == "NCI EVS")
            return {URI:"<http://example.org/@@NCI-EVS>", label:"NCI-EVS"};
        else if (str == "LOINC")
            return {URI:"<oid:2.16.840.1.113883.6.1>", label:"LOINC"};
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
                ret += ":"+entry.id+" a owl:Class ;\n"
                    + "  rdfs:subClassOf :CDCoding ";
                if (entry.parentCode) {
                    ret += ",\n    [ a owl:Class ;\n"
                        + "     owl:intersectionOf (\n"
                        + "       [ a owl:Restriction ; owl:onProperty dt:CDCoding.codeSystem ; owl:hasValue " + system(entry.sstm).URI + " ]\n"
                        + "       [ a owl:Restriction ; owl:onProperty dt:CDCoding.code       ; owl:hasValue \""+entry.parentCode+"\" ]\n"
                        + "       ) ] ";
                }
                ret += ";\n   owl:equivalentClass [ a owl:Class ;\n"
                    + "     owl:intersectionOf (\n"
                    + "       [ a owl:Restriction ; owl:onProperty dt:CDCoding.codeSystem ; owl:hasValue "
                    + system(entry.parentCode ? "FDA-TA" : entry.sstm).URI
                    + " ]\n"
                    + "       [ a owl:Restriction ; owl:onProperty dt:CDCoding.code       ; owl:hasValue \""+entry.code+"\" ]\n"
                    + "       ) ] .\n";
            }
            return ret;
        }
    };

    function definition_toTurtle (def, parent) {
        var ret = "";
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
	    // Name     | Definition | Definition Source | Code     | Code System | Code Extension | See Also | Comment
            // Anti-CCP | Anti-citr… | LOINC: 53027-9    | C1138934 | NCI EVS     | =              | http://… | search.loinc.org

            var DEFN = "Definition";
            var SSTM = "Code System";
            var CODE = "Code"
            var XTND = "Code Extension";
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
            ret += ",\n        [ a owl:Restriction ; owl:onProperty data:value ; owl:allValuesFrom [\n"
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
                warn (errStr(def.file, def.line) + "Expected to refine \"" + def.ref + "\" but no general code system was specified.");
            else {
                // warn ("refining " + JSON.stringify(def));
                parentCode = code;
                code = "refined-" + code;
            }
        }
        if (code || sstm) {
            if (!code)
                warn (errStr(def.file, def.line, 0) + "Code system supplied without code: \"" + def.ref + "\".");
            else if (!sstm)
                warn (errStr(def.file, def.line) + "Code supplied without code system: \"" + def.ref + "\".");
            else {
		var id = system(sstm).label+"-"+code;
		ret += ";\n    rdfs:subClassOf [ a owl:Restriction ; owl:onProperty hl7:coding ; owl:hasValue :"+id+" ] ";
		auxilliaryTaxonomy.addEntry(id, sstm, code, parentCode);
	    }
        }
        return ret;
    }
    function ta_toTurtle (recursive) {
        var allEndpoints = [];
        for (var i = 0; i < endpoints.length; ++i) {
            var endpoint = endpoints[i];
            allEndpoints.push(endpoint);
        }
	var ver = "$Id: TAprocessor.js,v 1.19 2014-09-15 20:34:39 eric Exp $";
	var cvsFile = "$RCSfile: TAprocessor.js,v $"; cvsFile = cvsFile.substr(10, cvsFile.length-10-4);
	var cvsRev = "$Revision: 1.19 $"; cvsRev = cvsRev.substr(11, cvsRev.length-11-2);
	var cvsDate = "$Date: 2014-09-15 20:34:39 $"; cvsDate = cvsDate.substr(7, cvsDate.length-7-2);
	var cvsAuthor = "$Author: eric $"; cvsAuthor = cvsAuthor.substr(9, cvsAuthor.length-9-2);
        var base = name.substr(0,name.lastIndexOf('.'));
        var ret = ""+
            "# " + name + " ontology"/*" generated " + Date()*/ + "\n"+
            "#   by "+cvsFile+" V"+cvsRev+" edited by "+cvsAuthor+" on "+cvsDate+"\n"+
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
            "@prefix : <http://www.w3.org/2013/12/FDA-TA/"+base+"#> .\n"+
            "@prefix core: <http://www.w3.org/2013/12/FDA-TA/core#> .\n"+
            "@prefix data: <http://www.w3.org/2013/12/FDA-TA/datatypes#> .\n"+
            "@prefix hl7: <http://hl7.org/owl/metadata#> .\n"+
            imports.map(function (imp) {
                return "@prefix "+imp[0]+" <http://www.w3.org/2013/12/FDA-TA/" + imp[1].substr(1, imp[1].indexOf(".")-1) + "#> .\n";
            }).join("")+
            "\n"+
            "<http://www.w3.org/2013/12/FDA-TA/"+base+"> a owl:Ontology ;\n"+
            "    owl:imports <http://www.w3.org/2013/12/FDA-TA/core> "+
            imports.map(function (imp) {
                return ",\n                <http://www.w3.org/2013/12/FDA-TA/" + imp[1].substr(1, imp[1].indexOf(".")-1) + "> ";
            }).join("")+
            ".\n"+
            "\n:Assessment a owl:Class ; rdfs:subClassOf core:Assessment .\n"+
            ":CDCoding a owl:Class ; rdfs:subClassOf dt:CDCoding .\n";
        if (type == 'TA') {
            ret += allEndpoints.map(function (e) {
                    return endpoint_toTurtle(e, recursive, ta[e]);
                }).join("")+
                // covariates, medHistory, concomitants
                covariates.map(function (c) {
                    var covariate = c[1];
                    if (covariate in ta) {
                        var definedAsAssessment = ta[covariate]._ == 'ASSESSMENT';
                        return definedAsAssessment
                            ? assessment_toTurtle(covariate, true, {file:ta[covariate].file, line:ta[covariate].line, column:ta[covariate].column}) // We didn't bother to record an object for the covariates.
                            : observation_toTurtle(covariate, true, {file:ta[covariate].file, line:ta[covariate].line, column:ta[covariate].column});
                    } else {
                        warn(errStr(covariates[i][2], covariates[i][3], covariates[i][4]), "covariate "+covariate+" referenced but not defined");
                    }
                }).join("")+
                medHistory.map(function (m) {
                    var medication = m[0];
                    if (medication in ta)
                        return medication_toTurtle(medication, true, {file:ta[medication].file, line:ta[medication].line, column:ta[medication].column})
                    else
                        warn(errStr(m[1], m[2], m[3]), medication + " referenced but not defined");
                }).join("")+
                concomitants.map(function (m) {
                    var medication = m[0];
                    if (medication in ta)
                        return medication_toTurtle(medication, true, {file:ta[medication].file, line:ta[medication].line, column:ta[medication].column})
                    else
                        warn(errStr(m[1], m[2], m[3]), medication + " referenced but not defined");
                }).join("")+
                ":Organizer a owl:Class . # organizer for the "+base+" Therapeutic Area .\n"+
                ":Subject a owl:Class ; rdfs:subClassOf :Organizer .\n"+
                ":Protocol a owl:Class ; rdfs:subClassOf :Organizer .\n"+
                ":AllEndpoints a owl:Class ;\n"+
                "    owl:equivalentClass [ a owl:Class ; owl:unionOf (\n"+
                allEndpoints.map(function (e) {
                    return "        :" + e + " \n";
                }).join("")+
                "    ) ] .\n"+
                "\n"+
                // covariates, med history, concomitant meds
                ":AllCovariates a owl:Class ;\n"+
                "    owl:equivalentClass [ a owl:Class ; owl:unionOf (\n"+
                covariates.map(function (e) {
                    return "        :" + e[1] + " \n";
                }).join("")+
                "    ) ] .\n"+
                "\n"+
                ":AllMedicalHistory a owl:Class ;\n"+
                "    owl:equivalentClass [ a owl:Class ; owl:unionOf (\n"+
                medHistory.map(function (e) {
                    return "        :" + e[0] + " \n";
                }).join("")+
                "    ) ] .\n"+
                "\n"+
                ":AllConcomitantMedications a owl:Class ;\n"+
                "    owl:equivalentClass [ a owl:Class ; owl:unionOf (\n"+
                concomitants.map(function (e) {
                    return "        :" + e[0] + " \n";
                }).join("")+
                "    ) ] .\n"+
                "\n"+
                // define the protocol template
                ":Protocol a owl:Class ;\n"+
                "    rdfs:subClassOf :Organizer, core:TAProtocol ,\n"+
                "        [ a owl:Restriction ; owl:onProperty :hasEfficacyEndpoint ; owl:someValuesFrom :AllEndpoints ] ,\n"+
                "        [ a owl:Restriction ; owl:onProperty :hasCovariate ; owl:someValuesFrom :AllCovariates ] ,\n"+
                "        [ a owl:Restriction ; owl:onProperty :hasMedicalHistory ; owl:someValuesFrom :AllMedicalHistory ] ,\n"+
                "        [ a owl:Restriction ; owl:onProperty :hasConcomitantMedication ; owl:someValuesFrom :AllConcomitantMedications ] .\n"+
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
            var rdfType = ta[e]._ == "EFFICACY" ? "core:EfficacyEndpoint" : "core:SafetyEndpoint";
            ret += ":"+e+" a owl:Class ;\n"
                + "    rdfs:subClassOf \n"
                + "        "+rdfType+" ,\n"
                + "        [ a owl:Restriction ; owl:onProperty core:evaluates ; owl:someValuesFrom :"+endpoint.outcome+" ] "
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
            ret += ":"+e+" a owl:Class ;\n"
                + "    rdfs:subClassOf \n"
                + "        core:SingleOutcomeAssessment ,\n"
                + "        [ a owl:Restriction ; owl:onProperty core:beforeIntervention ; owl:someValuesFrom :"+on[1]+" ] ,\n"
                + "        [ a owl:Restriction ; owl:onProperty core:afterIntervention ; owl:someValuesFrom :"+on[1]+" ] ";
            ret += definition_toTurtle(outcomeAssessment.definition, outcomeAssessment);
            ret += ".\n";
            if (recurse)
                    if (on[1] in ta) {
                        var definedAsAssessment = ta[on[1]]._ == 'ASSESSMENT';
                        if (on[0] && !definedAsAssessment)
                            warn(errStr(outcomeAssessment.file, outcomeAssessment.line, outcomeAssessment.column) + on[1], "defined as observation but referenced as assessment");
                        else if (!on[0] && definedAsAssessment)
                            warn(errStr(outcomeAssessment.file, outcomeAssessment.line, outcomeAssessment.column) + on[1], "defined as assessment but referenced as observation");
                        ret += definedAsAssessment
                            ? assessment_toTurtle(on[1], recurse, outcomeAssessment)
                            : observation_toTurtle(on[1], recurse, outcomeAssessment) ;
                    } else {
                        var found = false;
                        for (i in imports) {
                            if (imports[i][0] === on[1].substr(0, imports[i][0].length)) {
                                found = true;
                                ret += '# external reference to ' + imports[i][0] + "\n";
                                break;
                            }
                        }
                        if (!found)
                            warn(errStr(outcomeAssessment.file, outcomeAssessment.line, outcomeAssessment.column) + on[1], "referenced but not defined");
                    }
                // ret += (onAssessment
                //         ? assessment_toTurtle(on, recurse, outcomeAssessment)
                //         : observation_toTurtle(on, recurse, outcomeAssessment)) ;
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
            ret += ":"+e+" a owl:Class ;\n"
                + "    rdfs:subClassOf \n"
                + "        :Assessment "
                + basedOn.map(function (e) {
                    return ",\n        [ a owl:Restriction ; owl:onProperty core:hasObservation ; owl:someValuesFrom :"+e[1]+" ] ";
                }).join("");
            ret += definition_toTurtle(assessment.definition, assessment);
            ret += ".\n";
            if (recurse)
                ret += basedOn.map(function (on) {
                    if (on[1] in ta) {
                        var definedAsAssessment = ta[on[1]]._ == 'ASSESSMENT';
                        if (on[0] && !definedAsAssessment)
                            warn(errStr(assessment.file, assessment.line, assessment.column) + on[1], "defined as observation but referenced as assessment");
                        else if (!on[0] && definedAsAssessment)
                            warn(errStr(assessment.file, assessment.line, assessment.column) + on[1], "defined as assessment but referenced as observation");
                        return definedAsAssessment
                            ? assessment_toTurtle(on[1], recurse, assessment)
                            : observation_toTurtle(on[1], recurse, assessment) ;
                    } else {
                        var found = false;
                        for (i in imports) {
                            if (imports[i][0] === on[1].substr(0, imports[i][0].length)) {
                                found = true;
                                ret += '# external reference to ' + imports[i][0] + "\n";
                                break;
                            }
                        }
                        if (!found) {
                            warn(errStr(assessment.file, assessment.line, assessment.column) + on[1], "referenced but not defined");
                            return '';
                        }
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
            ret += ":"+e+" a owl:Class ;\n"
                + "    rdfs:subClassOf \n"
                + "        core:"+type+" ,\n"
                + "        [ a owl:Restriction ; owl:onProperty bridg:PerformedObservation.resultedPerformedObservationResult ; owl:someValuesFrom bridg:PerformedClinicalResult ] ,\n"
             // + "        [ a owl:Restriction ; owl:onProperty bridg:PerformedObservation.resultedPerformedObservationResult ; owl:cardinality 1 ] ,\n"
                + "        [ a owl:Restriction ; owl:onProperty bridg:PerformedActivity.instantiatedDefinedActivity ; owl:hasValue :Defined"+e+" ] "
                + definition_toTurtle(observation.definition, observation)
                + ".\n:Defined"+e+" a owl:Class ; rdfs:subClassOf bridg:DefinedObservation "
                // + definition_toTurtle(observation.definition, observation) -- duplicates term definitions @@factor
            ret += ".\n\n";
        }
        return ret;
    }

    function medication_toTurtle (e, recurse, parent) {
        var ret = '';
        // if (e.lastIndexOf(MED) != e.length-MED.length)
        //     warn(errStr(parent.file, parent.line, parent.column) + e, "should end with", OBS);
        if (e in ta && !(e in defined)) {
            defined[e] = true;
            var medication = ta[e];
            ret += ":"+e+" a owl:Class ;\n"
                + "    rdfs:subClassOf \n"
                + "        bridg:PerformedSubstanceAdministration "
                + definition_toTurtle(medication.definition, medication)
                + ".\n:Defined"+e+" a owl:Class ; rdfs:subClassOf bridg:DefinedMedication "
                // + definition_toTurtle(medication.definition, medication) -- duplicates term definitions @@factor
                + ".\n\n";
        }
        return ret;
    }

    ret = ta_toTurtle(true)+"\n\n"+auxilliaryTaxonomy.toString();

    imports.map(function (imp) { /* vulgar hack until terms have a toString or toURI method */
        var pat = new RegExp("ValuesFrom :"+imp[0], 'g');
        ret = ret.replace(pat, "ValuesFrom "+imp[0]);
    });    

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

