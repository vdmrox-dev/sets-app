# Domain Glossary

## Set
One round of an exercise performed at a given weight and rep count. An exercise prescription like "4 × 8–10" means 4 Sets. A Set is the unit of logging in the set-log drawer — one row per Set, recording both weight and actual reps performed.

> Not to be confused with Workout labels such as "Push" or "Upper".

## Rep (Repetition)
A single movement within a Set. Reps are prescribed as a range (`repsMin`–`repsMax`) on each exercise. Reps are not individually logged; only the weight for each Set is recorded.

## Exercise
A named movement in a Workout (e.g. "Bench Press"). Has a prescription: `sets` (count), and either:
- `repsMin` / `repsMax` — a uniform rep range applied to all sets (used by AI-generated plans), or
- `perSetReps` — an array of exact rep targets, one per set (used by manually created plans, e.g. `[12, 10, 8, 6]`).

The two formats are mutually exclusive. `perSetReps` takes precedence when present.

An Exercise may also carry Instructions and a Note.

## Instructions
Guidance on how to perform a movement correctly — a handful of short cues covering form and technique. Instructions belong to the movement itself, so they are the same wherever that Exercise appears and do not change when the Plan changes.

> Distinct from a Note, which applies only to one Exercise in one Plan.

## Note
A plan-specific instruction attached to a single Exercise, modifying how that particular prescription is carried out — a tempo, an emphasis, a substitution, or an intensity technique such as a dropset. A Note is authored for this Plan and does not travel with the movement.

## Plan
A structured workout program. Contains `meta` (name, edition, start date, duration in weeks, Workout Split) and `workouts` (ordered list of Workouts). Plans are mutually exclusive — only one Plan is active at a time. Loading a new plan replaces the existing one and discards the previous plan's Sessions.

A candidate is only a Plan if it is this structure and nothing else. Unknown properties — including the retired Exercise `highlight` flag — mean it is not a Plan and is rejected on import. See `docs/adr/0003-import-is-an-allowlist.md`.

## Workout
One prescribed training session in a Plan — a label plus an ordered list of Exercises. A Workout is a template, performed any number of times over the life of the Plan. The Workouts of a Plan form the sequence defined by its Workout Split.

## Workout Split
The organizing shape of a Plan — which muscle groups belong to each Workout, and the order the Workouts are performed in. Four splits exist:

- **Full-body** — 1 Workout, performed every visit
- **Upper/Lower** — 2 Workouts
- **Push/Pull/Legs** — 3 Workouts
- **Body Part** — 4, 5, or 6 Workouts, one per body part

A Split fixes the *sequence* of Workouts, never the frequency. The user decides how often they train and simply advances through the sequence on each visit, wrapping around to the start and carrying across week boundaries. A Push/Pull/Legs Split trained four times in a week performs Push, Pull, Legs, Push. See `docs/adr/0001-frequency-is-not-modelled.md`.

A Plan's Split is optional: imported and legacy Plans may have none. A hand-built Plan whose Workout count no longer matches the Split it was seeded from is **Custom**.

## Session
A completed performance of one Workout. Records: date, which Workout was performed, total duration (seconds), and which Exercises were completed.

A Session can be finished while some Exercises are still Pending. The user must confirm, and that confirmation states that some Exercises may be Pending.

Sessions are not unique per Workout per date — the same Workout may be performed more than once on the same day, and each performance is its own Session counting separately toward the tally.

The five most recent Sessions are retractable. Older Sessions are permanent. See `docs/adr/0004-last-five-sessions-are-retractable.md`.

## Active Session
A Session currently in progress. Records: which Workout, when it started (`startTime`), and which Exercises are Done.

## Exercise Status
During an Active Session, an Exercise is **Pending** until every Set in its Set Log is Done, then **Done**. The Exercise card shows Pending or Done explicitly. Adding a Set or unchecking one returns the Exercise to Pending.

## Rest Time
The pause after marking a Set Done during an Active Session, before the next Set. Rest Time is between Sets, not between Exercises. It starts after every Set check, including the last Set of an Exercise and the last Set of the Workout. It is not stored and does not change the Session or the Plan. Dismissing Rest Time is an explicit Close — not the backdrop, not the clock — and returns to the Set Log still open underneath.

> Distinct from the Active Session's elapsed duration, which measures the whole visit.

## Set Log
The recorded Sets for one Exercise within a Session. Stored as a map keyed by exercise name, in both the Active Session (for durability across reloads) and the completed Session record. Each entry is an ordered array of `{ weight, reps }` objects. Weight and reps persist on the Active Session as they are typed; there is no separate Save.

## Set Status
During an Active Session, each Set in a Set Log is **Pending** or **Done**. The user marks a Set Done with a check on that Set's row in the set-log drawer. The check starts Rest Time. A Set can be Done with empty weight or reps. Checking or unchecking persists on the Active Session immediately. Unchecking does not start Rest Time.
