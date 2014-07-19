var FS = require('fs');
var PATH = require('path');

var taParser = require("./TAparser").parser;
var allEndpoints = [];
taParser.yy = {
    log: function (s) { console.log(">>" + s + "<<"); },
    allEndpoints: allEndpoints,
    name: null
};
var taFile = FS.readFileSync(PATH.normalize(process.argv[2]), "utf8");
var ta = taParser.parse(taFile); // console.warn(ta);
var turtlify = require("./TAprocessor").toTurtle;
var defined = [];

var defns = {};

{
    var defsFile = FS.readFileSync(PATH.normalize(process.argv[3]), "utf8");
    var lines = defsFile.split("\n");
    var headings = lines.shift().split('\t');
    for (var i=0; i<lines.length; i++) {
        var vals = lines[i].split('\t');
        var ob = {};
        // if (vals[0] == 'dressing & grooming x - dress')
        //     console.warn("HERE!");
        for (h in headings)
            if (vals[h] != undefined && vals[h] != '')
                ob[headings[h]] = vals[h].replace(/\\n/g , "\n");
        defns[ob['Concept Name']] = ob;
    }
}

console.log(turtlify(ta, taParser.yy.name, allEndpoints, defined, defns,
                     function () { console.warn.apply(null, arguments); }));
