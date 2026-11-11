// A full backup: the Plan plus every Session, so history can move to another
// device or to the native app. A plain plan export (Menu → Export Plan) only
// carries the Plan.

export const BACKUP_FORMAT = "sets-backup";
export const BACKUP_VERSION = 1;

export function buildBackup({ plan, sessions, activeSession }) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    plan: plan ?? null,
    sessions: Array.isArray(sessions) ? sessions : [],
    activeSession: activeSession ?? null,
  };
}

export function backupFilename(date = new Date()) {
  return `sets-backup-${date.toISOString().split("T")[0]}.json`;
}
