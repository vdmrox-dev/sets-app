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

## Plan
A structured workout program. Contains `meta` (name, edition, start date, duration in weeks, Workout Split) and `workouts` (ordered list of Workouts). Plans are mutually exclusive — only one Plan is active at a time. Loading a new plan replaces the existing one and discards the previous plan's Sessions.

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

## Active Session
A Session currently in progress. Records: which Workout, when it started (`startTime`), and which exercises have been checked off (`checked: string[]`).

## Exercise Status
During an Active Session, each Exercise is either **Pending** (not yet saved) or **Done** (set log saved). The Exercise card displays this status explicitly. "Done" corresponds to the exercise name appearing in `activeSession.checked`.

## Set Log
The recorded Sets for one Exercise within a Session. Stored as a map keyed by exercise name, in both the Active Session (for durability across reloads) and the completed Session record. Each entry is an ordered array of `{ weight, reps }` objects.
