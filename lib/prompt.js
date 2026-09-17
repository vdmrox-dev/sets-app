import { getSplit, splitLabels, splitWorkoutCount, isBodyPart } from "./splits";

export const EMPTY_TEMPLATE = {
  meta: {
    name: "Plan Name",
    edition: "Month 01",
    split: "ppl",
    startDate: new Date().toISOString().split("T")[0],
    durationWeeks: 8,
  },
  workouts: [
    {
      id: "push",
      label: "Push",
      exercises: [
        {
          name: "Exercise Name",
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          instructions: [
            "Short cue about the setup or starting position",
            "Short cue about executing the movement",
            "Short cue about a common mistake to avoid",
          ],
          note: null,
        },
      ],
    },
  ],
};

// The Split dictates the Workout labels for the three unambiguous shapes. For
// Body Part the division is a coaching judgement, so the AI chooses the labels
// under a brevity constraint that protects the tab bar.
function labelRule(split, partCount) {
  if (isBodyPart(split)) {
    const count = splitWorkoutCount(split, partCount);
    return `- Decide how to divide the body across the ${count} workouts, and replace every placeholder label ("Part 1", "Part 2", …) with the body part you chose for it. Each label must be one or two words, like "Chest" or "Back" — never a description or a list.
- Give each workout an "id" that is its label in lowercase with hyphens instead of spaces.`;
  }
  const labels = splitLabels(split);
  return `- Use exactly these labels and ids, in this order: ${labels.map((l) => `"${l}"`).join(", ")}.`;
}

export function generatePlanPrompt(formData) {
  const {
    goal,
    split,
    partCount,
    sessionDuration,
    level,
    age,
    equipment,
    injuries,
    planDuration,
  } = formData;

  const splitDef = getSplit(split);
  const workoutCount = splitWorkoutCount(split, partCount);
  const labels = splitLabels(split, partCount);
  const today = new Date().toISOString().split("T")[0];

  const template = {
    meta: {
      ...EMPTY_TEMPLATE.meta,
      split,
      startDate: today,
      durationWeeks: parseInt(planDuration),
    },
    workouts: (labels ?? []).map((label, i) => ({
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label,
      exercises: i === 0 ? EMPTY_TEMPLATE.workouts[0].exercises : [],
    })),
  };

  return `You are a professional personal trainer. Create a complete, periodized workout plan based on the following client profile.

## Client Profile
- Goal: ${goal}
- Workout split: ${splitDef?.label ?? split}${isBodyPart(split) ? ` (${workoutCount} body parts)` : ""}
- Session duration: ${sessionDuration} minutes
- Experience level: ${level}
- Age: ${age} years old
- Available equipment: ${Array.isArray(equipment) ? equipment.join(", ") : equipment}${injuries ? `\n- Injuries/limitations: ${injuries}` : ""}
- Plan duration: ${planDuration} weeks

## Rules
- Create exactly ${workoutCount} workout(s) in the "workouts" array. Each workout is one training session the client performs when they go to the gym.
${labelRule(split, partCount)}
- The client rotates through the workouts in order and decides for themselves how often they train, so do not prescribe weekdays, rest days, or a weekly schedule.
- Fill every workout with exercises appropriate to its muscle groups and the session duration above.
- Each exercise must include: name, sets (integer), repsMin (integer), repsMax (integer), instructions (array), note (string or null)
- "instructions" describes how to perform the movement itself: 2 to 4 cues covering setup, execution and the mistake people most often make. One short sentence each, under 15 words, no numbering. Write them as they would be true in any plan — never mention this client, this workout or the prescribed sets and reps.
- "note" is for something specific to this plan that changes how that exercise is carried out here — a tempo, an emphasis, a substitution, an intensity technique. It is exceptional: most exercises must have "note": null, and only a couple per workout should have one. Never use it to repeat an instruction.
- The "split" must be exactly "${split}"
- The "startDate" must be today's date in YYYY-MM-DD format: ${today}
- The "durationWeeks" must be ${planDuration}
- The "edition" should reflect the month/phase (e.g. "Month 01", "Phase 1 — Foundation")

## Output Instructions
Wrap your JSON in a \`\`\`json code block so the SETS app can detect and import it automatically. The user will paste your entire response back into the app — they do not need to manually save any file.

## Required JSON Format
\`\`\`json
${JSON.stringify(template, null, 2)}
\`\`\``;
}
