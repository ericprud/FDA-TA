var FS = require('fs');
var PATH = require('path');

var taParser = require("./TAparser").parser;
var allEndpoints = [];
taParser.yy = {
    log: function (s) { console.log(">>" + s + "<<"); },
    allEndpoints: allEndpoints,
    name: null,
    type: null,
    file: process.argv[2]
};
var taFile = FS.readFileSync(PATH.normalize(process.argv[2]), "utf8");
var ta = taParser.parse(taFile); // console.warn(ta);
var turtlify = require("./TAprocessor").toTurtle;
var defined = [];

var spreadsheetParser = null;

if (true) {
    // CSV parser

    spreadsheetParser = {
        parse: function (func) {
            var defsFile = FS.readFileSync(PATH.normalize(process.argv[3]), "utf8");
            var lines = defsFile.split("\n");
            var headings = lines.shift().split('\t');
            var defns = {};
            for (var i=0; i<lines.length; i++) {
                if (lines[i].length == 0)
                    break;
                var vals = lines[i].split('\t');
                var ob = {line:i+1, file:process.argv[3]};
                // if (vals[0] == 'dressing & grooming x - dress')
                //     console.warn("HERE!");
                for (h in headings)
                    if (vals[h] != undefined && vals[h] != '')
                        ob[headings[h]] = vals[h].replace(/\\n/g , "\n");
                defns[ob['Concept Name']] = ob;
            }
            func(defns);
        }
    };
} else {
    // excel parser for e.g. 'RenalTransplantation-definitions.xslx'

    spreadsheetParser = {
        parse: function (func) {
            var parseXlsx = require('excel');
            parseXlsx(PATH.normalize(process.argv[3]), function(err, data) {
                if(err) throw err;
                // data is an array of arrays
                var defns = {};
                func(defns);
            });
        }
    };
}

spreadsheetParser.parse(function (defns) {
    console.log(turtlify(ta, taParser.yy.name, taParser.yy.type, taParser.yy.imports, allEndpoints, defined, defns,
                         function () { console.warn.apply(null, arguments); },
                         function (file, line, column) {
                             var ret = file + ":" + line;
                             if (column !== undefined)
                                 ret += ":"+(column+1);
                             ret += ": warning: ";
                             return ret;
                         }))});
