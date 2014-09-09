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

var CSVparser = function (path, delim, func) {
    var defsFile = FS.readFileSync(path, "utf8");
    var data = CSVToArray(defsFile, delim);
        // data is an array of arrays
        var headings = data.shift();
        var defns = {};
        for (var i=0; i<data.length; i++) {
            var vals = data[i];
            if (vals[0] === '')
                break;
            var ob = {line:i+1, file:process.argv[3]};
            for (h in headings)
                if (vals[h] != undefined && vals[h] != '')
                    ob[headings[h]] = vals[h].replace(/\\n/g , "\n");
            defns[ob['Concept Name']] = ob;
        }
        func(defns);
};

var XSLSparser = function (path, func) {
    var parseXlsx = require('excel');
    parseXlsx(path, function(err, data) {
        if (err) throw err;

        // data is an array of arrays
        var headings = data.shift();
        var defns = {};
        for (var i=0; i<data.length; i++) {
            var vals = data[i];
            if (vals[0] === '')
                break;
            var ob = {line:i+1, file:process.argv[3]};
            for (h in headings)
                if (vals[h] != undefined && vals[h] != '')
                    ob[headings[h]] = vals[h].replace(/\\n/g , "\n");
            defns[ob['Concept Name']] = ob;
        }
        func(defns);
    });
};

var processParsedData = function (defns) {
    console.log(turtlify(ta, taParser.yy.name, taParser.yy.type, taParser.yy.imports, allEndpoints, defined, defns,
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

var Defns = PATH.normalize(process.argv[3]);
var Parse =
    Defns.indexOf(".xslx", Defns.length - 5) !== -1 ? XSLSparser
    : Defns.indexOf(".tsv", Defns.length - 4) !== -1
      ? function (path, func) { return CSVparser(path, "\t", func) ; }
    : function (path, func) { return CSVparser(path, ",", func) ; };

Parse(Defns, processParsedData);

