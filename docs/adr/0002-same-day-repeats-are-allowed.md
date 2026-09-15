# Same-day repeats are allowed; safety comes from confirmation, not prohibition

The app used to refuse to log a Workout that already had a Session on the current date, as a guard against double-logging by accident. That guard also blocked legitimate training — a two-a-day, or any second visit on a Full-body Plan whose rotation has only one Workout — which makes it the last place the app overrode the user's own judgement about their training, against the principle in ADR 0001. It is removed: a Workout can be performed any number of times per day, and the accident it protected against is handled where the risk actually is, by confirming before a Session is finished and letting today's latest Session be deleted.

## Consequences

Repeats count as separate Sessions, so they raise the tally and the weekly average — that is intended, since the work genuinely happened twice. Deletion is deliberately limited to the most recent Session dated today, which means a Session finished by accident late at night and noticed the next morning cannot be removed.
