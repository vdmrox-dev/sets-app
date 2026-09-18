// Set Logs live on the Active Session while training, and on the completed
// Session afterwards. Drafts (typed but not Saved) update the log without
// marking the Exercise Done.

export function withSetLog(session, exerciseName, rows, { done = false } = {}) {
  if (!session) return session;
  const setLogs = { ...(session.setLogs || {}), [exerciseName]: rows };
  let checked = session.checked || [];
  if (done && !checked.includes(exerciseName)) {
    checked = [...checked, exerciseName];
  }
  return { ...session, setLogs, checked };
}

export function lastSetLog(sessions, exerciseName) {
  if (!exerciseName || !Array.isArray(sessions)) return null;
  for (let i = sessions.length - 1; i >= 0; i--) {
    const log = sessions[i]?.setLogs?.[exerciseName];
    if (Array.isArray(log) && log.length > 0) return log;
  }
  return null;
}

export function serializeLogRows(rows) {
  return rows.map((r) => {
    const weight = parseFloat(r.weight);
    const reps = parseInt(r.reps, 10);
    return {
      weight: Number.isFinite(weight) ? weight : null,
      reps: Number.isFinite(reps) ? reps : null,
    };
  });
}

// Finished Sessions older than this window are permanent. Newest first.
export const RETRACTABLE_LIMIT = 5;

export function retractableSessions(sessions, limit = RETRACTABLE_LIMIT) {
  if (!Array.isArray(sessions)) return [];
  return sessions.filter((s) => s?.id).slice(-limit).reverse();
}
