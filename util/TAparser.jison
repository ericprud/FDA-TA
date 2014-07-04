/*
  FDA Therapeutic Area DSL
  http://www.w3.org/2005/01/yacker/uploads/FDA_TA/bnf?lang=perl

  todo: fix prefixed names to work with NAME
*/

/* lexical grammar */
%lex

NAME_FIRST		[A-Za-z_]
NAME_REST		[A-Za-z_0-9-]
NAME			{NAME_FIRST}{NAME_REST}*

IRIREF			'<' ([^\u0000-\u0020<>\"{}|^`\\] | {UCHAR})* '>' /* #x00=NULL #01-#x1F=control codes #x20=space */
PNAME_NS                {PN_PREFIX}? ':'
PNAME_LN                {PNAME_NS} {PN_LOCAL}
BLANK_NODE_LABEL        '_:' ({PN_CHARS_U} | [0-9]) (({PN_CHARS} | '.')* {PN_CHARS})?
LANGTAG                 '@' [a-zA-Z]+ ('-' [a-zA-Z0-9]+)*
INTEGER                 [+-]? [0-9]+
DECIMAL                 [+-]? [0-9]* '.' [0-9]+
DOUBLE                  [+-]? ([0-9]+ '.' [0-9]* {EXPONENT} | '.'? [0-9]+ {EXPONENT})
EXPONENT                [eE] [+-]? [0-9]+
STRING_LITERAL1         "'" ([^\u0027\u005c\u000a\u000d] | {ECHAR} | {UCHAR})* "'" /* #x27=' #x5C=\ #xA=new line #xD=carriage return */
STRING_LITERAL2         '"' ([^\u0022\u005c\u000a\u000d] | {ECHAR} | {UCHAR})* '"' /* #x22=" #x5C=\ #xA=new line #xD=carriage return */
STRING_LITERAL_LONG1    "'''" (("'" | "''")? ([^\'\\] | {ECHAR} | {UCHAR}))* "'''"
STRING_LITERAL_LONG2    '"""' (('"' | '""')? ([^\"\\] | {ECHAR} | {UCHAR}))* '"""'
UCHAR                   '\\u' {HEX} {HEX} {HEX} {HEX} | '\\U' {HEX} {HEX} {HEX} {HEX} {HEX} {HEX} {HEX} {HEX}
ECHAR                   '\\' [tbnrf\\\"\']
WS                      \u0020 | \u0009 | \u000d | \u000a /* #x20=space #x9=character tabulation #xD=carriage return #xA=new line */
ANON                    '[' {WS}* ']'
PN_CHARS_BASE           [A-Z] | [a-z] | [\u00c0-\u00d6] | [\u00d8-\u00f6] | [\u00f8-\u02ff] | [\u0370-\u037d] | [\u037f-\u1fff] | [\u200c-\u200d] | [\u2070-\u218f] | [\u2c00-\u2fef] | [\u3001-\ud7ff] | [\uf900-\ufdcf] | [\ufdf0-\ufffd] | [\U00010000-\U000effff]
PN_CHARS_U              {PN_CHARS_BASE} | '_'
PN_CHARS                {PN_CHARS_U} | '-' | [0-9] | [\u00b7] | [\u0300-\u036f] | [\u203f-\u2040]
PN_PREFIX               {PN_CHARS_BASE} (({PN_CHARS} | '.')* {PN_CHARS})?
PN_LOCAL                ({PN_CHARS_U} | ':' | [0-9] | {PLX}) (({PN_CHARS} | '.' | ':' | {PLX})* ({PN_CHARS} | ':' | {PLX}))?
PLX                     {PERCENT} | {PN_LOCAL_ESC}
PERCENT                 '%' {HEX} {HEX}
HEX                     [0-9] | [A-F] | [a-f]
PN_LOCAL_ESC            '\\' ('_' | '~' | '.' | '-' | '!' | '$' | '&' | "'" | '(' | ')' | '*' | '+' | ',' | ';' | '=' | '/' | '?' | '#' | '@' | '%')
COMMENT			'//' [^\u000a\u000d]*

%%

\s+|{COMMENT} /**/
[Tt][Aa]':'					return 'TA'
[Ee][Nn][Dd][Pp][Oo][Ii][Nn][Tt]':'		return 'ENDPOINT'
[Oo][Uu][Tt][Cc][Oo][Mm][Ee]':'			return 'OUTCOME'
[Aa][Ss][Ss][Ee][Ss][Ss][Mm][Ee][Nn][Tt]':'	return 'ASSESSMENT'
[Qq][Uu][Aa][Nn][Tt]':'				return 'OBSERVATION'
[Ss][Ss][Xx]':'					return 'OBSERVATION'
[Dd][Ii][Aa][Gg][Pp][Rr][Oo][Cc]':'		return 'OBSERVATION'
{IRIREF}					return 'IRIREF'
{PNAME_NS}					return 'PNAME_NS'
{PNAME_LN}					return 'PNAME_LN'
{NAME}						return 'NAME'
{STRING_LITERAL_LONG2}				return 'STRING_LITERAL_LONG2'
{STRING_LITERAL2}				return 'STRING_LITERAL2'
":"						return ':'
"="						return '='
"@"						return '@'
"["						return '['
"]"						return ']'
"("						return '('
")"						return ')'
"{"						return '{'
"}"						return '}'
"<"						return '<'
">"						return '>'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%start TAdecl

%% /* language grammar */

TAdecl		: PREP TA Name DeclStar EOF		{
		    if ('name' in yy)
			yy.name = $3;
		    return yy.decls;
		  } ;
PREP		: { yy.decls = {};
		    yy.decl = function (type, name, ob) {
		      type = type.substr(0, type.length-1);
		      ob._name = name;
		      ob._ = type;
		      yy.decls[name] = ob;
		      if (type == 'ENDPOINT' && 'allEndpoints' in yy)
			yy.allEndpoints.push(name);
		      return name;
                    } ;
		  };
DeclStar	:					{ $$ = null; }
		| DeclStar Decl				{ $$ = $1 + $2; } ;
Decl		: EndpointDecl				{ $$ = $1; }
		| OutcomeDecl				{ $$ = $1; }
		| AssessmentDecl			{ $$ = $1; }
		| ObservationDecl			{ $$ = $1; } ;

EndpointDecl	: 'ENDPOINT' Name Definition Outcome
							{ $$ = yy.decl($1, $2, { definition:$3, outcome:$4 }); } ;

OutcomeDecl	: 'OUTCOME' Name Outcome_Def		{ $$ = yy.decl($1, $2, $3); } ;
Outcome		: Name Outcome_Def_Opt			{ $$ = $2 ? yy.decl('OUTCOME', $1, $2) : $1; } ;
Outcome_Def_Opt	: '(' Outcome_Def ')'			{ $$ = $2; }
		|					{ $$ = null; } ;
Outcome_Def	: Definition Assessment			{ $$ = { definition:$1, assessment:$2 }; } ;

AssessmentDecl	: 'ASSESSMENT' Name Assessment_Def	{ $$ = yy.decl($1, $2, $3); } ;
Assessment	: Name Assessment_Def_Opt		{ $$ = $2 ? yy.decl('OUTCOME', $1, $2) : $1; } ;
Assessment_Def_Opt: '(' Assessment_Def ')'		{ $$ = $2; }
		|					{ $$ = null; } ;
Assessment_Def	: Definition Observation_Or_Assessment_Plus
							{ $$ = { definition:$1, basedOn:$2 }; } ;
Observation_Or_Assessment_Plus:
		  Observation_Or_Assessment		{ $$ = [ $1 ]; }
		| Observation_Or_Assessment_Plus Observation_Or_Assessment
							{ $1.push($2); $$ = $1; } ;
Observation_Or_Assessment:
		  Observation				{ $$ = [false, $1]; }
		| '{' Assessment '}'			{ $$ = [true, $2]; } ;

ObservationDecl	: 'OBSERVATION' Name Observation_Def	{ $$ = yy.decl($1, $2, $3); } ;
Observation	: Name Observation_Def_Opt		{ $$ = $2 ? yy.decl('OBSERVATION', $1, $2) : $1; } ;
Observation_Def_Opt: '(' Observation_Def ')'		{ $$ = $2; }
		|					{ $$ = null; } ;
Observation_Def : Definition	{ $$ = { definition:$1 }; } ;

Name		: NAME					{ $$ = $1; }
		| iri					{ $$ = $1; } ;

Definition	: Definition_Elt_Star			{ $$ = $1; } ;

Definition_Elt_Star
		:					{ $$ = {}; }
		| Definition_Elt_Star Definition_Elt	{ $1[$2[0]] = $2[1]; $$ = $1; };
Definition_Elt	: STRING_LITERAL2			{ $$ = ['name', $1]; }
		| STRING_LITERAL_LONG2			{ $$ = ['defn', $1]; }
		| '[' CodeDefinition ']'		{ $$ = ['code', $2]; }
		| '@' NAME				{ $$ = ['ref', $2]; }
		| '@' STRING_LITERAL2			{ $$ = ['ref', $2.substr(1, $2.length-2)]; } ;

CodeDefinition	: RelChar STRING_LITERAL2 STRING_LITERAL2
							{ $$ = [$1, $2, $3]; } ;

RelChar		: '<'	  		  		{ $$ = '<'; }
		| '='					{ $$ = '='; } ;

Iri		: IRIREF				{ $$ = $1; }
		| PrefixedName				{ $$ = $1; } ;

PrefixedName	: PNAME_LN				{ $$ = $1; }
		| PNAME_NS				{ $$ = $1; } ;


