// Pull a Plan out of whatever an AI pasted — full replies, markdown fences,
// leftover copies of the prompt template, trailing commas, the lot. We score
// every valid candidate and keep the one with the most exercises, because the
// first JSON in a reply is often the empty template from our own prompt.

export function isValidPlanShape(obj) {
  return !!obj && !!obj.meta && Array.isArray(obj.workouts ?? obj.days);
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

// Top-level `{ ... }` objects, respecting strings so braces in cues don't
// split a Plan in half.
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

export function extractPlanFromText(text) {
  if (!text || !String(text).trim()) {
    throw new Error("No JSON found");
  }

  const source = String(text);
  const candidates = [...fencedBlocks(source), ...braceObjects(source)];

  let best = null;
  let bestScore = -1;
  let bestSize = -1;

  for (const src of candidates) {
    const parsed = tryParse(src);
    if (!isValidPlanShape(parsed)) continue;
    const score = exerciseCount(parsed);
    if (score > bestScore || (score === bestScore && src.length > bestSize)) {
      best = parsed;
      bestScore = score;
      bestSize = src.length;
    }
  }

  if (!best) throw new Error("No JSON found");
  return best;
}
