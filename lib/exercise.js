// How-to guidance lives on the Exercise as text. A video is never stored as
// an id — an AI asked for one will sometimes invent it, and a cross-origin
// embed is dead offline. A search from the name always resolves to something.

export function youtubeSearchUrl(exerciseName) {
  const query = encodeURIComponent(`${exerciseName} proper form`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

// Plans may omit instructions, and an AI may send a string instead of an
// array. Either way the sheet wants a list of non-empty cues.
export function exerciseInstructions(exercise) {
  const value = exercise?.instructions;
  if (Array.isArray(value)) {
    return value.map((cue) => String(cue).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}
