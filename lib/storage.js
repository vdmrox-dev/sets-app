const PLAN_KEY = "sets_plan";
const SESSIONS_KEY = "sets_sessions";
const ACTIVE_SESSION_KEY = "sets_active_session";

// ── Legacy compatibility ────────────────────────────────────────────────────
// Plans and Sessions written before the Workout rename stored `days`,
// `dayId` and `dayLabel`. Reads normalize them so existing data keeps working;
// writes always use the current names. Safe to delete once no legacy data
// remains in the wild.

function normalizePlan(plan) {
  if (!plan) return null;
  const workouts = plan.workouts ?? plan.days;
  if (!workouts) return plan;
  const { days, ...rest } = plan;
  return { ...rest, workouts };
}

function normalizeSession(session) {
  if (!session) return session;
  if (session.workoutId !== undefined) return session;
  const { dayId, dayLabel, ...rest } = session;
  return { ...rest, workoutId: dayId, workoutLabel: dayLabel };
}

// An imported plan is valid if it has meta and a workout list under either the
// current or the legacy key.
export function isValidPlanShape(obj) {
  return !!obj && !!obj.meta && Array.isArray(obj.workouts ?? obj.days);
}

// ── Plan ────────────────────────────────────────────────────────────────────

export function getPlan() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? normalizePlan(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function clearPlan() {
  localStorage.removeItem(PLAN_KEY);
}

// Replaces the plan and wipes everything tied to the previous one: session
// history, its derived stats, and any session left in progress. Use savePlan
// directly when editing the plan that is already active.
// The start date is stamped to today so an imported file carrying an old date
// doesn't begin mid-way through its own schedule. Returns the stored plan.
export function startNewPlan(plan) {
  const normalized = normalizePlan(plan);
  const stamped = {
    ...normalized,
    meta: { ...normalized.meta, startDate: todayString() },
  };
  savePlan(stamped);
  clearSessions();
  saveActiveSession(null);
  return stamped;
}

// ── Sessions ────────────────────────────────────────────────────────────────

export function getSessions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw).map(normalizeSession) : [];
  } catch {
    return [];
  }
}

export function addSession(session) {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return sessions;
}

// Removes a single logged Session, for undoing one finished by accident.
// Returns the remaining sessions. Bails on a missing id rather than matching
// every session that also lacks one.
export function deleteSession(sessionId) {
  if (!sessionId) return getSessions();
  const sessions = getSessions().filter((s) => s.id !== sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return sessions;
}

export function clearSessions() {
  localStorage.removeItem(SESSIONS_KEY);
}

export function getActiveSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? normalizeSession(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session) {
  if (session) {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function todayString() {
  return new Date().toISOString().split("T")[0];
}

export function isWorkoutCompletedToday(workoutId) {
  const today = todayString();
  return getSessions().some((s) => s.workoutId === workoutId && s.date === today);
}
