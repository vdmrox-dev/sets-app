export const EMPTY_TEMPLATE = {
  meta: {
    name: "Plan Name",
    edition: "Month 01",
    restSeconds: "60-90",
    startDate: new Date().toISOString().split("T")[0],
    durationWeeks: 8,
  },
  days: [
    {
      id: "set-a",
      label: "Set A",
      exercises: [
        {
          name: "Exercise Name",
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          note: "Optional coaching tip",
          highlight: false,
        },
      ],
    },
  ],
};

export function generatePlanPrompt(formData) {
  const {
    goal,
    daysPerWeek,
    sessionDuration,
    level,
    age,
    equipment,
    injuries,
    planDuration,
  } = formData;

  const template = {
    ...EMPTY_TEMPLATE,
    meta: {
      ...EMPTY_TEMPLATE.meta,
      startDate: new Date().toISOString().split("T")[0],
      durationWeeks: parseInt(planDuration),
    },
  };

  return `You are a professional personal trainer. Create a complete, periodized workout plan based on the following client profile.

## Client Profile
- Goal: ${goal}
- Training days per week: ${daysPerWeek}
- Session duration: ${sessionDuration} minutes
- Experience level: ${level}
- Age: ${age} years old
- Available equipment: ${Array.isArray(equipment) ? equipment.join(", ") : equipment}${injuries ? `\n- Injuries/limitations: ${injuries}` : ""}
- Plan duration: ${planDuration} weeks

## Rules
- Create exactly ${daysPerWeek} day(s) in the "days" array
- Day labels must be short: use "Set A", "Set B", "Set C", etc. Do not use long descriptive names.
- Each exercise must include: name, sets (integer), repsMin (integer), repsMax (integer)
- Add a "note" string with a specific coaching cue for key exercises
- Set "highlight: true" for 1–2 priority exercises per day
- Choose "restSeconds" appropriate for the goal (e.g. "60-90" for hypertrophy, "120-180" for strength)
- The "startDate" must be today's date in YYYY-MM-DD format: ${new Date().toISOString().split("T")[0]}
- The "durationWeeks" must be ${planDuration}
- The "edition" should reflect the month/phase (e.g. "Month 01", "Phase 1 — Foundation")

## Output Instructions
Wrap your JSON in a \`\`\`json code block so the SETS app can detect and import it automatically. The user will paste your entire response back into the app — they do not need to manually save any file.

## Required JSON Format
\`\`\`json
${JSON.stringify(template, null, 2)}
\`\`\``;
}
