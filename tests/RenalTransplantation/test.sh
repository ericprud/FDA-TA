sparql -d ../../core.ttl -d ../../renal.ttl -d ../../transplant.ttl -d ../../RenalTransplantation.ttl -d subject-amy.ttl -d subject-bob.ttl -d subject-sue.ttl scripOutcome.rq
#!/bin/bash

# $id$
# test RenalTransplantation sample patient data.

./createProtege-ttl.sh
sparql -d ../../core.ttl -d ../../renal.ttl -d ../../transplant.ttl -d ../../RenalTransplantation.ttl -d subject-amy.ttl -d subject-bob.ttl -d subject-sue.ttl > work.trig
./infer.sh work.trig
sparql -d work.trig scripOutcome.rq -8
sparql -d work.trig endpoints.rq -8

# expect this output:

# +-------+----------------------+----------------------+----+--------------------------+--------------------+-----+
# | ?who  | ?medName             | ?dose                | ?x | ?outcomeCode             | ?start             | ?PN |
# | "Amy" | "ImmunosuppressantB" | "50.0mg 6 per 1.0 d" | 20 | "NormalFunctioningGraft" | "2013-10-19 12:34" | "?" |
# | "Bob" | "ImmunosuppressantA" | "50.0mg 1 per 1.0 d" |  9 |   "SemiFunctioningGraft" | "2013-08-27 19:30" | "?" |
# | "Bob" | "ImmunosuppressantA" | "25.0mg 1 per 1.0 d" |  5 |   "SemiFunctioningGraft" | "2013-08-28 14:32" | "?" |
# | "Bob" |                   -- |                   -- | -- |           "PatientDeath" | "2013-08-28 16:15" | "?" |
# | "Sue" | "ImmunosuppressantB" | "50.0mg 6 per 1.0 d" |  8 |   "SemiFunctioningGraft" | "2013-07-07 19:00" | "?" |
# | "Sue" | "ImmunosuppressantB" | "75.0mg 8 per 1.0 d" |  7 |    "NonFunctioningGraft" | "2013-07-08 16:15" | "?" |
# +-------+----------------------+----------------------+----+--------------------------+--------------------+-----+
# ┌───────┬──────────────────────┬──────────────────────┬────┬──────────────────────────┬────────────────────┬─────┐
# │ ?who  │ ?medName             │ ?dose                │ ?x │ ?outcomeCode             │ ?start             │ ?PN │
# │ "Amy" │ "ImmunosuppressantB" │ "50.0mg 6 per 1.0 d" │ 20 │ "NormalFunctioningGraft" │ "2013-10-19 12:34" │ "+" │
# │ "Bob" │ "ImmunosuppressantA" │ "50.0mg 1 per 1.0 d" │  9 │   "SemiFunctioningGraft" │ "2013-08-27 19:30" │ "?" │
# │ "Bob" │ "ImmunosuppressantA" │ "25.0mg 1 per 1.0 d" │  5 │   "SemiFunctioningGraft" │ "2013-08-28 14:32" │ "?" │
# │ "Bob" │                   -- │                   -- │ -- │           "PatientDeath" │ "2013-08-28 16:15" │ "?" │
# │ "Sue" │ "ImmunosuppressantB" │ "50.0mg 6 per 1.0 d" │  8 │   "SemiFunctioningGraft" │ "2013-07-07 19:00" │ "?" │
# │ "Sue" │ "ImmunosuppressantB" │ "75.0mg 8 per 1.0 d" │  7 │    "NonFunctioningGraft" │ "2013-07-08 16:15" │ "-" │
# └───────┴──────────────────────┴──────────────────────┴────┴──────────────────────────┴────────────────────┴─────┘

# used to be:
# +-------+--------------------+---------------------+----------------------+-----------------+
# | ?who  | ?medicationTime    | ?ingredientName     | ?dose                | ?hoursToFailure |
# | "Amy" | "2013-10-16 07:03" | "ActiveIngredientB" | "50.0mg 1 per 1.0 d" |              77 |
# | "Bob" | "2013-08-26 07:05" | "ActiveIngredientA" | "50.0mg 1 per 1.0 d" |              57 |
# | "Bob" | "2013-08-27 19:33" | "ActiveIngredientA" | "25.0mg 1 per 1.0 d" |              21 |
# | "Bob" | "2013-08-28 14:35" | "ActiveIngredientA" |  "0.0mg 1 per 1.0 d" |               2 |
# | "Sue" | "2013-07-06 07:25" | "ActiveIngredientB" | "50.0mg 1 per 1.0 d" |              57 |
# | "Sue" | "2013-07-07 19:33" | "ActiveIngredientB" | "75.0mg 1 per 1.0 d" |              21 |
# +-------+--------------------+---------------------+----------------------+-----------------+
# ┌───────┬────────────────────┬─────────────────────┬──────────────────────┬─────────────────┐
# │ ?who  │ ?medicationTime    │ ?ingredientName     │ ?dose                │ ?hoursToFailure │
# │ "Bob" │ "2013-08-26 07:05" │ "ActiveIngredientA" │ "50.0mg 1 per 1.0 d" │              57 │
# │ "Bob" │ "2013-08-27 19:33" │ "ActiveIngredientA" │ "25.0mg 1 per 1.0 d" │              21 │
# │ "Bob" │ "2013-08-28 14:35" │ "ActiveIngredientA" │  "0.0mg 1 per 1.0 d" │               2 │
# │ "Sue" │ "2013-07-06 07:25" │ "ActiveIngredientB" │ "50.0mg 1 per 1.0 d" │              57 │
# │ "Sue" │ "2013-07-07 19:33" │ "ActiveIngredientB" │ "75.0mg 1 per 1.0 d" │              21 │
# └───────┴────────────────────┴─────────────────────┴──────────────────────┴─────────────────┘
