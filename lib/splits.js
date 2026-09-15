// Workout Splits — the organizing shape of a Plan. A Split fixes which
// Workouts a Plan contains and the order they run in. It says nothing about
// how often the user trains; see docs/adr/0001-frequency-is-not-modelled.md.

export const BODY_PART_COUNTS = [4, 5, 6];

// A hand-built Plan whose Workouts no longer match any Split's shape. Stored
// so the status card can still say something truthful about the Plan.
export const CUSTOM_SPLIT = "custom";

export const SPLITS = [
  {
    id: "full-body",
    label: "Full-body",
    chip: "Full Body",
    blurb: "One workout, performed every visit",
    labels: ["Full Body"],
  },
  {
    id: "upper-lower",
    label: "Upper / Lower",
    chip: "Upper/Lower",
    blurb: "Two workouts, alternating",
    labels: ["Upper", "Lower"],
  },
  {
    id: "ppl",
    label: "Push / Pull / Legs",
    chip: "PPL",
    blurb: "Three workouts in rotation",
    labels: ["Push", "Pull", "Legs"],
  },
  {
    id: "body-part",
    label: "Body Part",
    chip: "Body Part",
    blurb: "One workout per body part",
    // Labels are a coaching judgement, so the AI picks them. Only the count
    // is fixed, by the user's part-count choice.
    labels: null,
  },
];

export function getSplit(splitId) {
  return SPLITS.find((s) => s.id === splitId) ?? null;
}

export function isBodyPart(splitId) {
  return splitId === "body-part";
}

// How many Workouts a Plan with this Split must contain.
export function splitWorkoutCount(splitId, partCount) {
  const split = getSplit(splitId);
  if (!split) return null;
  if (split.labels) return split.labels.length;
  return BODY_PART_COUNTS.includes(partCount) ? partCount : null;
}

// The Workout labels this Split prescribes, or null when the AI decides.
export function splitLabels(splitId, partCount) {
  const split = getSplit(splitId);
  if (!split) return null;
  if (split.labels) return split.labels;
  const count = splitWorkoutCount(splitId, partCount);
  // Placeholder labels for the manual builder to seed rows the user renames.
  return count ? Array.from({ length: count }, (_, i) => `Part ${i + 1}`) : null;
}

// Short label for the status card chip. Null when the plan has no Split at all
// (legacy plans and hand-authored imports).
export function splitChip(splitId) {
  if (splitId === CUSTOM_SPLIT) return "Custom";
  return getSplit(splitId)?.chip ?? null;
}

// A stored Split is only truthful while the Workout count still matches it.
export function splitMatchesWorkouts(splitId, partCount, workoutCount) {
  const expected = splitWorkoutCount(splitId, partCount);
  return expected !== null && expected === workoutCount;
}

// A Split fixes the order, so "what's next" is just the Workout after the most
// recently performed one, wrapping around. Falls back to the first Workout
// when nothing has been logged yet, or when the last Session refers to a
// Workout the current Plan no longer contains.
export function nextWorkoutId(workouts, lastWorkoutId) {
  if (!workouts?.length) return "";
  const lastIndex = workouts.findIndex((w) => w.id === lastWorkoutId);
  if (lastIndex === -1) return workouts[0].id;
  return workouts[(lastIndex + 1) % workouts.length].id;
}

export function workoutIdFromLabel(label, index) {
  const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug ? `${slug}-${index + 1}` : `workout-${index + 1}`;
}
