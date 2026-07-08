# Domain Glossary

## Set
One round of an exercise performed at a given weight and rep count. An exercise prescription like "4 × 8–10" means 4 Sets. A Set is the unit of logging in the set-log drawer — one row per Set, recording both weight and actual reps performed.

> Not to be confused with "Set A / Set B" day labels, which are workout day names in AI-generated plans.

## Rep (Repetition)
A single movement within a Set. Reps are prescribed as a range (`repsMin`–`repsMax`) on each exercise. Reps are not individually logged; only the weight for each Set is recorded.

## Exercise
A named movement in a workout day (e.g. "Bench Press"). Has a prescription: `sets` (count), and either:
- `repsMin` / `repsMax` — a uniform rep range applied to all sets (used by AI-generated plans), or
- `perSetReps` — an array of exact rep targets, one per set (used by manually created plans, e.g. `[12, 10, 8, 6]`).

The two formats are mutually exclusive. `perSetReps` takes precedence when present.

## Plan
A structured workout program. Contains `meta` (name, edition, start date, duration in weeks) and `days` (ordered list of workout days, each with exercises). Plans are mutually exclusive — only one Plan is active at a time. Loading a new plan replaces the existing one.

## Session
A completed workout. Records: date, which day was performed, total duration (seconds), and which exercises were completed.

## Active Session
A workout currently in progress. Records: which day, when it started (`startTime`), and which exercises have been checked off (`checked: string[]`).

## Exercise Status
During an Active Session, each Exercise is either **Pending** (not yet saved) or **Done** (set log saved). The Exercise card displays this status explicitly. "Done" corresponds to the exercise name appearing in `activeSession.checked`.

## Set Log
The recorded Sets for one Exercise within a Session. Stored as a map keyed by exercise name, in both the Active Session (for durability across reloads) and the completed Session record. Each entry is an ordered array of `{ weight, reps }` objects.
