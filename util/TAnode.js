var FS = require('fs');
var PATH = require('path');

var taFilename = null;
var definitionsFilename = null;
var dump = process.argv[4];
var Ds = {};
var m;

for (var i = 2; i < process.argv.length; ++i) {
    if ((m = process.argv[i].match("^-D([a-zA-Z0-9_]+)")))
        Ds[m[1]] = true;
    else if ((m = process.argv[i].match("^--dump")))
        dump = process.argv[++i];
    else if (taFilename === null)
        taFilename = process.argv[i];
    else
        definitionsFilename = process.argv[i];
}

if (dump == "D") {
    console.log(JSON.stringify(Ds));
    return 0;
}

var taParser = require("./TAparser").parser;
var allEndpoints = [];
taParser.yy = {
    log: function (s) { console.log(">>" + s + "<<"); },
    allEndpoints: allEndpoints,
    concomitants: [],
    medHistory: [],
    covariates: [],
    name: null,
    type: null,
    file: taFilename
};
var taFile = FS.readFileSync(PATH.normalize(taFilename), "utf8");

/* Cheap reprocessor replacing
 *   gcc -E -x c -P -C $^ > $@
 * which inexplicably started emiting C comments. */
var lines = taFile.split(/\n/);
var ifdef = /#[ \t]*(ifdef)(?:\/\*(?:[^*]|\*[^\/])*\*\/|[ \t])*([A-Za-z_0-9]+)(?:\/\*(?:[^*]|\*[^\/])*\*\/|[ \t])*/;
var _else = /#[ \t]*(else)(?:\/\*(?:[^*]|\*[^\/])*\*\/|[ \t])*/;
var endif = /#[ \t]*(endif)(?:\/\*(?:[^*]|\*[^\/])*\*\/|[ \t])*/;
var ifstack = [true];
for (var lineNo = 0; lineNo < lines.length; ++lineNo) {
    var line = lines[lineNo];
    if (m = line.match(ifdef))
        ifstack.push(m[2] in Ds);
    else if (line.match(_else))
        ifstack[ifstack.length-1] = !ifstack[ifstack.length-1];
    else if (line.match(endif))
        ifstack.pop();
    else if (!ifstack[ifstack.length-1])
        lines[lineNo] = '';
}
if (ifstack.length > 1)
    console.warn("There were " + (ifstack.length - 1) + " unclosed ifdefs at the end of the TA file.");
taFile = lines.join("\n");

if (dump == "E") {
    console.log(taFile);
    return 0;
}
var ta = taParser.parse(taFile); // console.warn(ta);
if (dump == "ta") {
    console.log("= TA =\n" + JSON.stringify(ta));
    console.log("= CONCOMITANTS =\n" + JSON.stringify(taParser.yy.concomitants));
    console.log("= MEDHISTORY =\n"   + JSON.stringify(taParser.yy.medHistory));
    console.log("= COVARIATES =\n"   + JSON.stringify(taParser.yy.covariates));
    return 0;
}
var turtlify = require("./TAprocessor").toTurtle;
var defined = [];

// <included-code>
// source: http://www.bennadel.com/blog/1504-ask-ben-parsing-csv-strings-with-javascript-exec-regular-expression-command.htm
// (indented by emacs Javascript-mode prog-indent-sexp)
// 

// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray( strData, strDelimiter ){
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");
    
    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                
            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                
            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );
    
    
    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];
    
    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;
    
    
    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec( strData )){
        
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];
        
        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
                (strMatchedDelimiter != strDelimiter)
        ){
            
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );
            
        }
        
        
        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){
            
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
            );
            
        } else {
            
            // We found a non-quoted value.
            var strMatchedValue = arrMatches[ 3 ];
            
        }
        
        
        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }
    
    // Return the parsed data.
    return( arrData );
}
// </included-code>

// Translate array of arrays into definition map.
var makeDefinitions = function (data) {
    var headings = data.shift();
    var defns = {};
    for (var i=0; i<data.length; i++) {
        var vals = data[i];
        if (vals[0] === '')
            break;
        var ob = {line:i+1, file:definitionsFilename};
        for (h in headings)
            if (vals[h] != undefined && vals[h] != '')
                ob[headings[h]] = vals[h].replace(/\\n/g , "\n");
        defns[ob['Name']] = ob;
    }
    return defns;
}

var CSVparser = function (path, delim, func) {
    var defsFile = FS.readFileSync(path, "utf8");
    func(makeDefinitions(CSVToArray(defsFile, delim)));
};

var XSLSparser = function (path, func) {
    var parseXlsx = require('excel');
    parseXlsx(path, function(err, data) {
        if (err) throw err;
        func(makeDefinitions(data));
    });
};

var dumpDefns = function (defns) {
    console.log(JSON.stringify(defns));
}

var processParsedData = function (defns) {
    console.log(
        turtlify(
            ta, taParser.yy.file, taParser.yy.type, taParser.yy.imports, taParser.yy.covariates, taParser.yy.medHistory, taParser.yy.concomitants, allEndpoints, defined, defns,
            function () { console.warn.apply(null, arguments); },
            function (file, line, column) {
                var ret = file + ":" + line;
                if (column !== undefined)
                    ret += ":"+(column+1);
                ret += ": warning: ";
                return ret;
            })
    )
}

var Defns = PATH.normalize(definitionsFilename);
var Parse =
    Defns.indexOf(".xlsx", Defns.length - 5) !== -1 ? XSLSparser
    : Defns.indexOf(".tsv", Defns.length - 4) !== -1
      ? function (path, func) { return CSVparser(path, "\t", func) ; }
    : function (path, func) { return CSVparser(path, ",", func) ; };

Parse(Defns, dump == "defns" ? dumpDefns : processParsedData);

