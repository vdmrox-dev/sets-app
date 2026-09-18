// Set Logs live on the Active Session while training, and on the completed
// Session afterwards. Weight, reps, and Set Status persist as they change.
// An Exercise is Done when every Set in its log is Done.

export function isSetLogDone(rows) {
  return Array.isArray(rows) && rows.length > 0 && rows.every((r) => r?.done);
}

export function doneExerciseNames(session) {
  const logs = session?.setLogs || {};
  return Object.keys(logs).filter((name) => isSetLogDone(logs[name]));
}

export function withSetLog(session, exerciseName, rows) {
  if (!session) return session;
  const setLogs = { ...(session.setLogs || {}), [exerciseName]: rows };
  const next = { ...session, setLogs };
  return { ...next, checked: doneExerciseNames(next) };
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
      done: !!r.done,
    };
  });
}

// Finished Sessions older than this window are permanent. Newest first.
export const RETRACTABLE_LIMIT = 5;

export function retractableSessions(sessions, limit = RETRACTABLE_LIMIT) {
  if (!Array.isArray(sessions)) return [];
  return sessions.filter((s) => s?.id).slice(-limit).reverse();
}
