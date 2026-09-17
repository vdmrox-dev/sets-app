# Import is an allowlist: unknown fields are not a Plan

Anything offered as a Plan — file, paste, or an extracted AI reply — has to be this app's structure and nothing else. Extra keys fail the whole import rather than being ignored, because silent drop makes a hand-authored JSON look accepted while the app quietly discards what the author thought they stored. We considered ignoring unknowns (friendlier to old exports and forward-compatible fields) and rejected it: the cost of a refused import is an explicit error; the cost of a silent drop is data the user believes is there.

## Consequences

Exports written when Exercise had a `highlight` flag will not import until that key is removed. The same is true of any other retired or foreign property. Missing Workout `id` is still filled in from the label, and `meta.startDate` is still stamped to today on import — those are the only gaps we repair.
