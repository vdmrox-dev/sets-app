// Pull a Plan out of pasted text or a file, then accept it only if it matches
// this app's allowlist. Extra keys fail the whole import — see
// docs/adr/0003-import-is-an-allowlist.md.

// Keep in sync with lib/splits.js — the allowlist is the gate, so unknown
// split ids are rejected rather than imported as a free-form string.
const SPLIT_IDS = new Set(["full-body", "upper-lower", "ppl", "body-part", "custom"]);

const PLAN_KEYS = ["meta", "workouts", "days"];
const META_KEYS = ["name", "edition", "split", "startDate", "durationWeeks"];
const WORKOUT_KEYS = ["id", "label", "exercises"];
const EXERCISE_KEYS = [
  "name",
  "sets",
  "repsMin",
  "repsMax",
  "perSetReps",
  "instructions",
  "note",
];

function extraKeys(obj, allowed) {
  return Object.keys(obj).filter((k) => !allowed.includes(k));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isInt(value) {
  return typeof value === "number" && Number.isInteger(value);
}

function fail(error) {
  return { ok: false, error };
}

function idFromLabel(label, index) {
  const slug = String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `${slug}-${index + 1}` : `workout-${index + 1}`;
}

export function looksLikePlan(obj) {
  return isPlainObject(obj) && isPlainObject(obj.meta) && Array.isArray(obj.workouts ?? obj.days);
}

// Loose shape sniff used while fishing JSON out of a reply. The allowlist
// runs after we've picked a candidate.
export function isValidPlanShape(obj) {
  return looksLikePlan(obj);
}

export function validatePlan(input) {
  if (!isPlainObject(input)) return fail("That isn't a plan.");

  const extras = extraKeys(input, PLAN_KEYS);
  if (extras.length) return fail(`Unknown field "${extras[0]}".`);

  const hasWorkouts = Object.prototype.hasOwnProperty.call(input, "workouts");
  const hasDays = Object.prototype.hasOwnProperty.call(input, "days");
  if (hasWorkouts && hasDays) {
    return fail('A plan can\'t include both "workouts" and "days".');
  }
  const rawWorkouts = hasWorkouts ? input.workouts : input.days;
  if (!Array.isArray(rawWorkouts)) {
    return fail("A plan needs a workouts list.");
  }

  if (!isPlainObject(input.meta)) return fail("A plan needs meta.");
  const metaExtras = extraKeys(input.meta, META_KEYS);
  if (metaExtras.length) return fail(`Unknown field "${metaExtras[0]}" in meta.`);

  const name = input.meta.name;
  if (typeof name !== "string" || !name.trim()) {
    return fail("A plan needs a name.");
  }
  const durationWeeks = input.meta.durationWeeks;
  if (!isInt(durationWeeks) || durationWeeks < 1) {
    return fail("durationWeeks must be a positive whole number.");
  }

  const meta = {
    name: name.trim(),
    durationWeeks,
  };

  if (Object.prototype.hasOwnProperty.call(input.meta, "edition")) {
    if (typeof input.meta.edition !== "string") return fail("edition must be text.");
    meta.edition = input.meta.edition;
  }
  if (Object.prototype.hasOwnProperty.call(input.meta, "split")) {
    if (typeof input.meta.split !== "string" || !SPLIT_IDS.has(input.meta.split)) {
      return fail("split isn't one this app knows.");
    }
    meta.split = input.meta.split;
  }
  if (Object.prototype.hasOwnProperty.call(input.meta, "startDate")) {
    if (typeof input.meta.startDate !== "string") return fail("startDate must be text.");
    meta.startDate = input.meta.startDate;
  }

  const workouts = [];
  for (let i = 0; i < rawWorkouts.length; i++) {
    const raw = rawWorkouts[i];
    const checked = validateWorkout(raw, i);
    if (!checked.ok) return checked;
    workouts.push(checked.workout);
  }

  return { ok: true, plan: { meta, workouts } };
}

function validateWorkout(raw, index) {
  if (!isPlainObject(raw)) return fail(`Workout ${index + 1} isn't an object.`);
  const extras = extraKeys(raw, WORKOUT_KEYS);
  if (extras.length) {
    return fail(`Unknown field "${extras[0]}" on a workout.`);
  }
  if (typeof raw.label !== "string" || !raw.label.trim()) {
    return fail(`Workout ${index + 1} needs a label.`);
  }
  const label = raw.label.trim();

  let id;
  if (Object.prototype.hasOwnProperty.call(raw, "id")) {
    if (typeof raw.id !== "string" || !raw.id.trim()) {
      return fail(`Workout "${label}" has an invalid id.`);
    }
    id = raw.id.trim();
  } else {
    id = idFromLabel(label, index);
  }

  const rawExercises = Object.prototype.hasOwnProperty.call(raw, "exercises")
    ? raw.exercises
    : [];
  if (!Array.isArray(rawExercises)) {
    return fail(`Workout "${label}" needs an exercises list.`);
  }

  const exercises = [];
  for (let i = 0; i < rawExercises.length; i++) {
    const checked = validateExercise(rawExercises[i], label, i);
    if (!checked.ok) return checked;
    exercises.push(checked.exercise);
  }

  return { ok: true, workout: { id, label, exercises } };
}

function validateExercise(raw, workoutLabel, index) {
  if (!isPlainObject(raw)) {
    return fail(`Exercise ${index + 1} in "${workoutLabel}" isn't an object.`);
  }
  const extras = extraKeys(raw, EXERCISE_KEYS);
  if (extras.length) {
    const where = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : `exercise ${index + 1}`;
    return fail(`Unknown field "${extras[0]}" on "${where}".`);
  }
  if (typeof raw.name !== "string" || !raw.name.trim()) {
    return fail(`An exercise in "${workoutLabel}" needs a name.`);
  }
  const name = raw.name.trim();
  if (!isInt(raw.sets) || raw.sets < 1) {
    return fail(`"${name}" needs a positive whole number of sets.`);
  }

  const hasRange =
    Object.prototype.hasOwnProperty.call(raw, "repsMin") ||
    Object.prototype.hasOwnProperty.call(raw, "repsMax");
  const hasPerSet = Object.prototype.hasOwnProperty.call(raw, "perSetReps");

  if (hasPerSet) {
    if (!Array.isArray(raw.perSetReps) || raw.perSetReps.length === 0) {
      return fail(`"${name}" has an empty perSetReps list.`);
    }
    if (raw.perSetReps.some((n) => !isInt(n) || n < 0)) {
      return fail(`"${name}" has invalid per-set reps.`);
    }
  } else if (hasRange) {
    if (!isInt(raw.repsMin) || !isInt(raw.repsMax) || raw.repsMin < 0 || raw.repsMax < 0) {
      return fail(`"${name}" needs whole-number repsMin and repsMax.`);
    }
    if (raw.repsMax < raw.repsMin) {
      return fail(`"${name}" has repsMax lower than repsMin.`);
    }
  } else {
    return fail(`"${name}" needs a rep range or per-set reps.`);
  }

  const exercise = { name, sets: raw.sets };
  if (hasPerSet) exercise.perSetReps = [...raw.perSetReps];
  if (hasRange) {
    exercise.repsMin = raw.repsMin;
    exercise.repsMax = raw.repsMax;
  }

  if (Object.prototype.hasOwnProperty.call(raw, "instructions")) {
    if (
      !Array.isArray(raw.instructions) ||
      raw.instructions.some((cue) => typeof cue !== "string")
    ) {
      return fail(`"${name}" has invalid instructions.`);
    }
    exercise.instructions = raw.instructions;
  }
  if (Object.prototype.hasOwnProperty.call(raw, "note")) {
    if (raw.note !== null && typeof raw.note !== "string") {
      return fail(`"${name}" has an invalid note.`);
    }
    exercise.note = raw.note;
  }

  return { ok: true, exercise };
}

function stripTrailingCommas(src) {
  return src.replace(/,\s*([}\]])/g, "$1");
}

function tryParse(src) {
  const trimmed = src.trim().replace(/^\uFEFF/, "");
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      return JSON.parse(stripTrailingCommas(trimmed));
    } catch {
      return null;
    }
  }
}

function fencedBlocks(text) {
  const blocks = [];
  const re = /```(?:jsonc?)?\s*([\s\S]*?)```/gi;
  let match;
  while ((match = re.exec(text))) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

function braceObjects(text) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === "}") {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start !== -1) {
        objects.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return objects;
}

function exerciseCount(plan) {
  const workouts = plan.workouts ?? plan.days ?? [];
  if (!Array.isArray(workouts)) return 0;
  return workouts.reduce(
    (n, w) => n + (Array.isArray(w.exercises) ? w.exercises.length : 0),
    0
  );
}

export function parsePlanJson(text) {
  const parsed = tryParse(String(text ?? ""));
  if (!parsed) throw new Error("Could not parse the JSON.");
  const result = validatePlan(parsed);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}

export function extractPlanFromText(text) {
  if (!text || !String(text).trim()) {
    throw new Error("No JSON found");
  }

  const source = String(text);
  const candidates = [...fencedBlocks(source), ...braceObjects(source)];

  const shaped = [];
  for (const src of candidates) {
    const parsed = tryParse(src);
    if (!looksLikePlan(parsed)) continue;
    shaped.push({ parsed, src });
  }

  if (!shaped.length) throw new Error("No JSON found");

  shaped.sort(
    (a, b) =>
      exerciseCount(b.parsed) - exerciseCount(a.parsed) || b.src.length - a.src.length
  );

  const result = validatePlan(shaped[0].parsed);
  if (!result.ok) throw new Error(result.error);
  return result.plan;
}
